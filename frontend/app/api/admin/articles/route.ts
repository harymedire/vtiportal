import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,title,slug,category,status,hero_image_url,published_at,created_at,views"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: `DB read failed: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, articles: data || [] });
}
