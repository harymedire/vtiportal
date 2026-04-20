import type { MetadataRoute } from "next";
import { CATEGORIES, categoryNameToSlug } from "@/lib/categories";
import { getAllSlugsForSitemap } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1.0 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/o-nama`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${SITE_URL}/privatnost`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${SITE_URL}/uslovi`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${SITE_URL}/oglasavanje`, changeFrequency: "yearly" as const, priority: 0.2 },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllSlugsForSitemap();
    articleRoutes = articles.map((a) => ({
      url: `${SITE_URL}/${categoryNameToSlug(a.category)}/${a.slug}`,
      lastModified: a.published_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Supabase may not be reachable at build time — return only static routes
  }

  return [...staticRoutes, ...articleRoutes];
}
