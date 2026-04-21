import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { paginateText } from "@/lib/paginate";
import { CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";

// Jednostavan slugify bosanske ćirilice/latinice
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

export async function POST(req: NextRequest) {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    subtitle,
    category,
    tags,
    moral,
    text,
    hero_image_url,
  } = body as Record<string, string | string[] | undefined>;

  // Validacija
  const errors: string[] = [];
  if (!title || typeof title !== "string" || title.length < 20)
    errors.push("Naslov mora imati najmanje 20 karaktera");
  if (title && typeof title === "string" && title.length > 200)
    errors.push("Naslov najviše 200 karaktera");
  if (!category || typeof category !== "string")
    errors.push("Kategorija je obavezna");
  if (category && !CATEGORIES.some((c) => c.name === category))
    errors.push(`Kategorija mora biti jedna od: ${CATEGORIES.map((c) => c.name).join(", ")}`);
  if (!text || typeof text !== "string" || text.trim().length < 300)
    errors.push("Tekst mora imati najmanje 300 karaktera");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" · ") }, { status: 400 });
  }

  const pages = paginateText(text as string, {
    targetWordsPerPage: 200,
    minPages: 3,
    maxPages: 10,
  });

  let finalSlug = slugify(title as string);
  const articleId = randomUUID();

  const supabase = getSupabaseAdmin();

  // Provjeri dup slug
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existing) {
    const hash = createHash("sha256").update(articleId).digest("hex").slice(0, 6);
    finalSlug = `${finalSlug}-${hash}`;
  }

  const tagsArray = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
    ? (tags as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error: insertError } = await supabase.from("articles").insert({
    id: articleId,
    title,
    slug: finalSlug,
    subtitle: subtitle || null,
    category,
    tags: tagsArray,
    pages_json: pages,
    moral: moral || null,
    hero_image_url: hero_image_url || null,
    thumbnail_url: hero_image_url || null,
    status: "published",
    template_id: 99, // 99 = admin-published
    variables_used: { manual: true, source: "admin" },
    published_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json(
      { error: `DB insert failed: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Trigger ISR revalidation
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
