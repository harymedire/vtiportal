export const CATEGORIES = [
  { name: "Ispovijesti", slug: "ispovijesti" },
  { name: "Društvo", slug: "drustvo" },
  { name: "Lifestyle", slug: "lifestyle" },
] as const;

/**
 * Slug "komsiluk" ostaje aktivan SAMO za jedan stari FB ad članak
 * (srbija-u-soku-bracni-par-iz-novog-sada-...). Nije u navigaciji,
 * novi članci se generišu kao "Društvo" (slug "drustvo").
 */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "price-iz-zivota": "drustvo",
  "drame-uz-kafu": "lifestyle",
  "smijeh-i-suze": "lifestyle",
};

export const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.name, c.slug])),
  // Legacy: "Komšiluk" zadržava svoj slug zbog 1 FB ad članka koji ostaje na /komsiluk/...
  "Komšiluk": "komsiluk",
  // Stara DB display imena (ako poneki red u DB-u još nije migriran)
  "Priče iz života": "drustvo",
  "Drame uz kafu": "lifestyle",
  "Smijeh i suze": "lifestyle",
};

export const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name])),
  // Legacy slug "komsiluk" prikazuje se kao "Društvo" u UI (1 FB ad članak)
  "komsiluk": "Društvo",
};

export function categoryNameToSlug(name: string): string {
  return CATEGORY_NAME_TO_SLUG[name] || name.toLowerCase();
}

export function categorySlugToName(slug: string): string | null {
  return CATEGORY_SLUG_TO_NAME[slug] || null;
}
