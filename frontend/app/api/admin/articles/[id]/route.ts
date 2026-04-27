import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { paginateText } from "@/lib/paginate";
import { CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v))
    return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") {
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function pagesToBody(pages: Array<{ text: string }>): string {
  return pages.map((p) => p.text).join("\n\n");
}

// ===== GET — dohvati članak za edit =====
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Nije pronađeno" }, { status: 404 });
  }

  const pages = Array.isArray(data.pages_json)
    ? (data.pages_json as Array<{ text: string }>)
    : [];
  const text = pagesToBody(pages);

  return NextResponse.json({
    ok: true,
    article: {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      category: data.category,
      tags: data.tags || [],
      moral: data.moral,
      hero_image_url: data.hero_image_url,
      text,
    },
  });
}

// ===== PUT — update članka =====
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = asString(body.title);
  const subtitle = asString(body.subtitle);
  const category = asString(body.category);
  const moral = asString(body.moral);
  const text = asString(body.text);
  const heroImageUrl = asString(body.hero_image_url);
  const tagsArray = asStringArray(body.tags);

  const errors: string[] = [];
  if (!title || title.length < 20)
    errors.push("Naslov mora imati najmanje 20 karaktera");
  if (title && title.length > 200)
    errors.push("Naslov najviše 200 karaktera");
  if (!category) errors.push("Kategorija je obavezna");
  if (category && !CATEGORIES.some((c) => c.name === category))
    errors.push(
      `Kategorija mora biti jedna od: ${CATEGORIES.map((c) => c.name).join(", ")}`
    );
  if (!text || text.trim().length < 300)
    errors.push("Tekst mora imati najmanje 300 karaktera");

  if (errors.length > 0 || !title || !category || !text) {
    return NextResponse.json({ error: errors.join(" · ") }, { status: 400 });
  }

  const pages = paginateText(text, {
    targetWordsPerPage: 330,
    minPages: 3,
    maxPages: 7,
  });

  const supabase = getSupabaseAdmin();
  const { error: updateError } = await supabase
    .from("articles")
    .update({
      title,
      subtitle,
      category,
      tags: tagsArray,
      pages_json: pages,
      moral,
      hero_image_url: heroImageUrl,
      thumbnail_url: heroImageUrl,
    })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json(
      { error: `Update failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  // ISR revalidacija
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";
  const categorySlug = CATEGORIES.find((c) => c.name === category)?.slug || "";
  const revalSecret = process.env.REVALIDATE_SECRET;

  const { data: row } = await supabase
    .from("articles")
    .select("slug")
    .eq("id", params.id)
    .maybeSingle();

  if (revalSecret && row) {
    const paths = ["/", `/${categorySlug}`, `/${categorySlug}/${row.slug}`];
    await Promise.allSettled(
      paths.map((path) =>
        fetch(
          `${siteUrl}/api/revalidate?secret=${encodeURIComponent(revalSecret)}&path=${encodeURIComponent(path)}`,
          { method: "POST" }
        )
      )
    );
  }

  return NextResponse.json({ ok: true, pages: pages.length });
}

// ===== DELETE — brisanje članka =====
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: article } = await supabase
    .from("articles")
    .select("slug,category")
    .eq("id", params.id)
    .maybeSingle();

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: `Delete failed: ${error.message}` },
      { status: 500 }
    );
  }

  if (article) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";
    const categorySlug =
      CATEGORIES.find((c) => c.name === article.category)?.slug || "";
    const revalSecret = process.env.REVALIDATE_SECRET;

    if (revalSecret) {
      const paths = ["/", `/${categorySlug}`, `/${categorySlug}/${article.slug}`];
      await Promise.allSettled(
        paths.map((path) =>
          fetch(
            `${siteUrl}/api/revalidate?secret=${encodeURIComponent(revalSecret)}&path=${encodeURIComponent(path)}`,
            { method: "POST" }
          )
        )
      );
    }
  }

  return NextResponse.json({ ok: true });
}
