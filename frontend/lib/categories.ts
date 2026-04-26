export const CATEGORIES = [
  { name: "Ispovijesti", slug: "ispovijesti" },
  { name: "Društvo", slug: "komsiluk" },
  { name: "Lifestyle", slug: "lifestyle" },
] as const;

/**
 * Stari slug-ovi koji 301-redirectaju na nove (vidi next.config.mjs).
 * Display name "Društvo" mapira na slug "komsiluk" da ne bi pukle FB
 * reklame i postojeći backlinkovi koji ciljaju /komsiluk/* URL-ove.
 */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "price-iz-zivota": "komsiluk",
  "drame-uz-kafu": "lifestyle",
  "smijeh-i-suze": "lifestyle",
};

export const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.name, c.slug])),
  // Legacy display imena u DB redovima (dok se ne migrira) — mapirana na nove slug-ove.
  "Komšiluk": "komsiluk",
  "Priče iz života": "komsiluk",
  "Drame uz kafu": "lifestyle",
  "Smijeh i suze": "lifestyle",
};

export const CATEGORY_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

export function categoryNameToSlug(name: string): string {
  return CATEGORY_NAME_TO_SLUG[name] || name.toLowerCase();
}

export function categorySlugToName(slug: string): string | null {
  return CATEGORY_SLUG_TO_NAME[slug] || null;
}
