export const CATEGORIES = [
  { name: "Ispovijesti", slug: "ispovijesti" },
  { name: "Komšiluk", slug: "komsiluk" },
  { name: "Lifestyle", slug: "lifestyle" },
] as const;

/**
 * Mapiranje starih kategorija na nove (za migraciju u DB i 301 redirect).
 * "Priče iz života" → "Komšiluk"
 * "Drame uz kafu" → "Lifestyle"
 * "Smijeh i suze" → "Lifestyle"
 */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "price-iz-zivota": "komsiluk",
  "drame-uz-kafu": "lifestyle",
  "smijeh-i-suze": "lifestyle",
};

export const CATEGORY_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.slug])
);

export const CATEGORY_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

export function categoryNameToSlug(name: string): string {
  return CATEGORY_NAME_TO_SLUG[name] || name.toLowerCase();
}

export function categorySlugToName(slug: string): string | null {
  return CATEGORY_SLUG_TO_NAME[slug] || null;
}
