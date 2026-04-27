export type PaginatedPage = {
  page: number;
  text: string;
  hook?: string;
  resolution_type?: string;
};

/**
 * Auto-paginira tekst članka u stranice target-ovane na ~330 riječi po stranici
 * (uskladjeno sa AdSense quality signal-om i content_validator pragovima 250-420).
 * Poštuje paragraph boundaries (nikad ne siječe paragraf u sredini).
 *
 * - targetWordsPerPage: default 330
 * - minPages: default 3 (kratki članci ne postaju 1-pager)
 * - maxPages: default 7
 *
 * Ako ima previše paragrafa za max, mergeuje krajnje dvije stranice.
 * Ako je tekst jako kratak, napravi minPages ravnomjerno.
 */
export function paginateText(
  body: string,
  options: {
    targetWordsPerPage?: number;
    minPages?: number;
    maxPages?: number;
  } = {}
): PaginatedPage[] {
  const target = options.targetWordsPerPage ?? 330;
  const minPages = options.minPages ?? 3;
  const maxPages = options.maxPages ?? 7;

  // Paragrafi = blokovi razdvojeni praznim redom ili linebreak-om
  const paragraphs = body
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    return [{ page: 1, text: body.trim() }];
  }

  // Pack paragrafe u stranice
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentWords = 0;

  for (const p of paragraphs) {
    const w = p.split(/\s+/).length;
    if (currentWords + w > target && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [p];
      currentWords = w;
    } else {
      currentPage.push(p);
      currentWords += w;
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);

  // Mergeuj ako prekoračuje max
  while (pages.length > maxPages) {
    const last = pages.pop()!;
    pages[pages.length - 1].push(...last);
  }

  // Ako je manje od min i ima dovoljno paragrafa, redistribuiraj
  if (pages.length < minPages && paragraphs.length >= minPages) {
    const perPage = Math.ceil(paragraphs.length / minPages);
    const redistributed: string[][] = [];
    for (let i = 0; i < paragraphs.length; i += perPage) {
      redistributed.push(paragraphs.slice(i, i + perPage));
    }
    return redistributed.map((ps, i) => ({
      page: i + 1,
      text: ps.join("\n\n"),
      ...(i === redistributed.length - 1 ? { resolution_type: "pouka" } : {}),
    }));
  }

  return pages.map((ps, i) => ({
    page: i + 1,
    text: ps.join("\n\n"),
    ...(i === pages.length - 1 ? { resolution_type: "pouka" } : {}),
  }));
}
