import Link from "next/link";
import type { ArticleListItem } from "@/lib/types";
import { categoryNameToSlug } from "@/lib/categories";

type Props = { article: ArticleListItem };

export default function ArticleCard({ article }: Props) {
  const href = `/${categoryNameToSlug(article.category)}/${article.slug}`;
  const imageSrc = article.hero_image_url || article.thumbnail_url;

  return (
    <div className="article-card">
      <Link href={href} aria-label={article.title}>
        <div className="card-image">
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" loading="lazy" />
          )}
        </div>
      </Link>
      <div className="card-body">
        <div className="card-meta">
          <span style={{ color: "#1a73e8", fontWeight: 700 }}>
            {article.category.toUpperCase()}
          </span>
        </div>
        <h2>
          <Link href={href}>{article.title}</Link>
        </h2>
        {article.subtitle && <div className="card-sub">{article.subtitle}</div>}
      </div>
    </div>
  );
}
