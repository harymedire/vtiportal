import Link from "next/link";
import type { ArticleListItem } from "@/lib/types";
import { categoryNameToSlug } from "@/lib/categories";

type Props = { articles: ArticleListItem[] };

export default function RelatedArticles({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <div className="related-section">
      <h3>📖 Pročitaj još</h3>
      <div className="related-grid">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/${categoryNameToSlug(a.category)}/${a.slug}`}
            className="related-item"
          >
            <div className="thumb">
              {(a.thumbnail_url || a.hero_image_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.thumbnail_url || a.hero_image_url || ""}
                  alt=""
                  loading="lazy"
                />
              )}
            </div>
            <h4>{a.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
