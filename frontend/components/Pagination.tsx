type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string; // npr. "/" ili "/ispovijesti"
};

/**
 * Paginacija sa brojevima stranica. Koristi plain <a> linkove
 * za full page reload (konzistentno sa člankovima — AdSense fires
 * new impression na svakoj strani).
 */
export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    if (p === 1) return basePath;
    const sep = basePath.includes("?") ? "&" : "?";
    return `${basePath}${sep}strana=${p}`;
  };

  // Kreiraj listu brojeva za prikaz:
  // Primjer: 1 2 3 ... 10  ili  1 ... 4 5 6 ... 10
  const pages: (number | "ellipsis")[] = [];
  const range = 2; // koliko brojeva lijevo/desno od current

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    } else if (
      pages[pages.length - 1] !== "ellipsis" &&
      (i === currentPage - range - 1 || i === currentPage + range + 1)
    ) {
      pages.push("ellipsis");
    }
  }

  return (
    <nav className="pagination" aria-label="Navigacija stranica">
      {currentPage > 1 ? (
        <a
          href={href(currentPage - 1)}
          className="pagination-btn pagination-prev"
          aria-label="Prethodna stranica"
        >
          ← Prethodna
        </a>
      ) : (
        <span className="pagination-btn pagination-prev disabled">
          ← Prethodna
        </span>
      )}

      <div className="pagination-numbers">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="pagination-number active"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <a
              key={p}
              href={href(p)}
              className="pagination-number"
              aria-label={`Stranica ${p}`}
            >
              {p}
            </a>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <a
          href={href(currentPage + 1)}
          className="pagination-btn pagination-next"
          aria-label="Sljedeća stranica"
        >
          Sljedeća →
        </a>
      ) : (
        <span className="pagination-btn pagination-next disabled">
          Sljedeća →
        </span>
      )}
    </nav>
  );
}
