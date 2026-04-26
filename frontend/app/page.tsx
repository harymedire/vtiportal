import type { Metadata } from "next";
import Link from "next/link";
import {
  getLatestArticles,
  countPublishedArticles,
  getMostRead,
  getArticlesByCategory,
} from "@/lib/supabase";
import { CATEGORIES, categoryNameToSlug } from "@/lib/categories";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";
import type { ArticleListItem } from "@/lib/types";

export const revalidate = 600;

const PER_PAGE = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { strana?: string };
}): Promise<Metadata> {
  const page = parseInt(searchParams.strana || "1") || 1;
  const canonical = page === 1 ? "/" : `/?strana=${page}`;
  return {
    title: page === 1 ? undefined : `Najnovije priče — strana ${page}`,
    alternates: { canonical },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { strana?: string };
}) {
  const totalCount = await countPublishedArticles();
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const rawPage = parseInt(searchParams.strana || "1");
  const currentPage = Math.max(
    1,
    Math.min(totalPages, isNaN(rawPage) ? 1 : rawPage)
  );

  // Na stranicama 2+ → klasičan paginirani grid (kao i prije)
  if (currentPage > 1) {
    const offset = (currentPage - 1) * PER_PAGE;
    const [latest, mostRead] = await Promise.all([
      getLatestArticles(PER_PAGE, offset),
      getMostRead(5),
    ]);

    return (
      <div className="page-wrap">
        <main>
          <h1 className="home-section-title">
            Priče — strana {currentPage}
          </h1>
          <div className="home-grid">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/"
          />
        </main>
        <Sidebar mostRead={mostRead} />
      </div>
    );
  }

  // === Portal-style HOMEPAGE (strana 1) ===
  const [latest, mostRead, ispovijesti, komsiluk, lifestyle] =
    await Promise.all([
      getLatestArticles(8, 0),
      getMostRead(5),
      getArticlesByCategory("Ispovijesti", 4),
      getArticlesByCategory("Društvo", 4),
      getArticlesByCategory("Lifestyle", 4),
    ]);

  if (latest.length === 0) {
    return (
      <div className="page-wrap">
        <main>
          <h1 className="home-section-title">Najnovije priče</h1>
          <p style={{ color: "#888", fontStyle: "italic", padding: "40px 0" }}>
            Uskoro stižu prve priče.
          </p>
        </main>
        <Sidebar mostRead={mostRead} />
      </div>
    );
  }

  const hero = latest[0];
  const subHero = latest.slice(1, 4);

  return (
    <div className="page-wrap">
      <main>
        {/* === HERO === */}
        <HeroCard article={hero} />

        {/* === SUB-HERO ROW === */}
        {subHero.length > 0 && (
          <div className="sub-hero-grid">
            {subHero.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}

        {/* === SEKCIJE PO KATEGORIJAMA === */}
        <CategorySection
          title="Ispovijesti"
          slug="ispovijesti"
          articles={ispovijesti}
        />
        <CategorySection
          title="Društvo"
          slug="komsiluk"
          articles={komsiluk}
        />
        <CategorySection
          title="Lifestyle"
          slug="lifestyle"
          articles={lifestyle}
        />

        {totalPages > 1 && (
          <div style={{ marginTop: 24 }}>
            <Pagination
              currentPage={1}
              totalPages={totalPages}
              basePath="/"
            />
          </div>
        )}
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}

function HeroCard({ article }: { article: ArticleListItem }) {
  const href = `/${categoryNameToSlug(article.category)}/${article.slug}`;
  const imageSrc = article.hero_image_url || article.thumbnail_url;

  return (
    <Link href={href} className="hero-card" aria-label={article.title}>
      <div className="hero-image">
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="" />
        )}
        <span className="hero-category">
          {article.category.toUpperCase()}
        </span>
      </div>
      <div className="hero-body">
        <h1 className="hero-title">{article.title}</h1>
        {article.subtitle && (
          <p className="hero-subtitle">{article.subtitle}</p>
        )}
      </div>
    </Link>
  );
}

function CategorySection({
  title,
  slug,
  articles,
}: {
  title: string;
  slug: string;
  articles: ArticleListItem[];
}) {
  if (articles.length === 0) return null;
  return (
    <section className="cat-section">
      <div className="cat-section-head">
        <h2>{title}</h2>
        <Link href={`/${slug}`} className="cat-section-more">
          Vidi sve →
        </Link>
      </div>
      <div className="cat-section-grid">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
