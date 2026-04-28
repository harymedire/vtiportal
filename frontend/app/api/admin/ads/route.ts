import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export const VALID_SLOTS = [
  "home_hero",
  "home_category",
  "article_middle",
  "article_cta_below",
  "vignette",
] as const;

export async function GET() {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ad_slots")
    .select("*")
    .order("slot_name")
    .order("created_at");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ads: data || [] });
}

export async function POST(req: NextRequest) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { slot_name, image_url, link_url, label } = body as Record<string, unknown>;
  if (
    typeof slot_name !== "string" ||
    typeof image_url !== "string" ||
    typeof link_url !== "string" ||
    !VALID_SLOTS.includes(slot_name as (typeof VALID_SLOTS)[number])
  ) {
    return NextResponse.json(
      { error: `Invalid: slot_name mora biti jedan od ${VALID_SLOTS.join("/")}, image_url i link_url obavezni` },
      { status: 400 }
    );
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ad_slots")
    .insert({
      slot_name,
      image_url,
      link_url,
      label: typeof label === "string" ? label : null,
      active: true,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, ad: data });
}
