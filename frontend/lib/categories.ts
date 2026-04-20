export const CATEGORIES = [
  { name: "Ispovijesti", slug: "ispovijesti" },
  { name: "Priče iz života", slug: "price-iz-zivota" },
  { name: "Komšiluk", slug: "komsiluk" },
  { name: "Drame uz kafu", slug: "drame-uz-kafu" },
  { name: "Smijeh i suze", slug: "smijeh-i-suze" },
] as const;

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
