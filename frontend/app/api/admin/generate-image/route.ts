import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const REPLICATE_MODEL = "black-forest-labs/flux-schnell";
const MAX_PROMPT_LEN = 2000;

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[] | string | null;
  error?: string | null;
  urls?: { get?: string };
};

async function createPrediction(
  token: string,
  prompt: string
): Promise<ReplicatePrediction> {
  const res = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=55",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: "jpg",
          output_quality: 85,
          num_inference_steps: 4,
          disable_safety_checker: false,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Replicate API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function pollPrediction(
  token: string,
  pred: ReplicatePrediction,
  maxAttempts = 30
): Promise<ReplicatePrediction> {
  if (
    pred.status === "succeeded" ||
    pred.status === "failed" ||
    pred.status === "canceled"
  ) {
    return pred;
  }
  const url = pred.urls?.get;
  if (!url) throw new Error("Missing Replicate get URL in prediction");

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Replicate poll ${res.status}: ${body.slice(0, 300)}`
      );
    }
    const next = (await res.json()) as ReplicatePrediction;
    if (
      next.status === "succeeded" ||
      next.status === "failed" ||
      next.status === "canceled"
    ) {
      return next;
    }
  }
  throw new Error("Replicate prediction timed out (45s)");
}

function extractOutputUrl(pred: ReplicatePrediction): string {
  const out = pred.output;
  if (!out) throw new Error("No output in prediction");
  if (typeof out === "string") return out;
  if (Array.isArray(out) && out.length > 0 && typeof out[0] === "string") {
    return out[0];
  }
  throw new Error(`Unexpected output format: ${JSON.stringify(out).slice(0, 200)}`);
}

export async function POST(req: NextRequest) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN nije postavljen u env" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const prompt =
    body && typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt je obavezan" },
      { status: 400 }
    );
  }
  if (prompt.length > MAX_PROMPT_LEN) {
    return NextResponse.json(
      { error: `Prompt predug (max ${MAX_PROMPT_LEN} karaktera)` },
      { status: 400 }
    );
  }

  try {
    let pred = await createPrediction(token, prompt);
    pred = await pollPrediction(token, pred);

    if (pred.status !== "succeeded") {
      return NextResponse.json(
        {
          error: `Generisanje slike nije uspjelo: ${pred.status}${pred.error ? " — " + pred.error : ""}`,
        },
        { status: 500 }
      );
    }

    const imageUrl = extractOutputUrl(pred);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Preuzimanje slike neuspješno: ${imgRes.status}` },
        { status: 500 }
      );
    }
    const bytes = Buffer.from(await imgRes.arrayBuffer());

    const key = `admin-generated/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.jpg`;
    const publicUrl = await uploadToR2(key, bytes, "image/jpeg");

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      key,
      bytes: bytes.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Generate greška: ${msg}` },
      { status: 500 }
    );
  }
}
