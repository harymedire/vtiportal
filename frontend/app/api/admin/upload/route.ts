import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

// Duck-type umjesto globalnog `File` (nije dostupan na starijim Node verzijama)
function isUploadedFile(v: unknown): v is {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
} {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.size === "number" &&
    typeof o.type === "string" &&
    typeof (o as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}

export async function POST(req: NextRequest) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Očekivan multipart/form-data: ${msg}` },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!isUploadedFile(file)) {
    return NextResponse.json(
      { error: "Nedostaje 'file' polje u form data" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Nepodržan tip ${file.type}. Koristi JPEG/PNG/WebP/GIF.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Fajl prevelik (${Math.round(file.size / 1024 / 1024)} MB). Max 10 MB.`,
      },
      { status: 400 }
    );
  }

  const ext = extForMime(file.type);
  const key = `admin-uploads/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(key, bytes, file.type);
    return NextResponse.json({ ok: true, url, key });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Upload greška: ${msg}` },
      { status: 500 }
    );
  }
}
