import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { paginateText } from "@/lib/paginate";
import { CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/č|ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") {
    return v.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export async function POST(req: NextRequest) {
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

  // Validacija
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

  let finalSlug = slugify(title);
  const articleId = randomUUID();

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existing) {
    const hash = createHash("sha256")
      .update(articleId)
      .digest("hex")
      .slice(0, 6);
    finalSlug = `${finalSlug}-${hash}`;
  }

  const { error: insertError } = await supabase.from("articles").insert({
    id: articleId,
    title,
    slug: finalSlug,
    subtitle: subtitle,
    category,
    tags: tagsArray,
    pages_json: pages,
    moral: moral,
    hero_image_url: heroImageUrl,
    thumbnail_url: heroImageUrl,
    status: "published",
    template_id: 99,
    variables_used: { manual: true, source: "admin" },
    published_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json(
      { error: `DB insert failed: ${insertError.message}` },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";
  const categorySlug =
    CATEGORIES.find((c) => c.name === category)?.slug || "";
  const revalSecret = process.env.REVALIDATE_SECRET;

  if (revalSecret) {
    const paths = ["/", `/${categorySlug}`, `/${categorySlug}/${finalSlug}`];
    await Promise.allSettled(
      paths.map((path) =>
        fetch(
          `${siteUrl}/api/revalidate?secret=${encodeURIComponent(revalSecret)}&path=${encodeURIComponent(path)}`,
          { method: "POST" }
        )
      )
    );
  }

  return NextResponse.json({
    ok: true,
    article: {
      id: articleId,
      slug: finalSlug,
      url: `${siteUrl}/${categorySlug}/${finalSlug}`,
      pages: pages.length,
    },
  });
}
