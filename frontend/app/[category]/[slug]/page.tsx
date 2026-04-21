import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { categorySlugToName } from "@/lib/categories";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/supabase";
import ResponsiveAdSlot from "@/components/ResponsiveAdSlot";
import RelatedArticles from "@/components/RelatedArticles";

export const revalidate = 3600;

type Params = { category: string; slug: string };
type SearchParams = { strana?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};

  const totalPages = article.pages_json.length;
  const currentPage = Math.max(
    1,
    Math.min(totalPages, parseInt(searchParams.strana || "1"))
  );

  const base = `/${params.category}/${params.slug}`;
  const canonical = currentPage === 1 ? base : `${base}?strana=${currentPage}`;

  const description = article.subtitle || article.moral || article.title;

  return {
    title:
      currentPage === 1
        ? article.title
        : `${article.title} (strana ${currentPage})`,
    description,
    openGraph: {
      title: article.title,
      description,
      url: canonical,
      type: "article",
      siteName: "VTIportal",
      locale: "bs_BA",
      publishedTime: article.published_at,
      images: article.hero_image_url
        ? [
            {
              url: article.hero_image_url,
              secureUrl: article.hero_image_url,
              width: 1280,
              height: 720,
              type: "image/jpeg",
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.hero_image_url ? [article.hero_image_url] : undefined,
    },
    alternates: { canonical },
  };
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const categoryName = categorySlugToName(params.category);
  if (!categoryName) notFound();

  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  if (article.category !== categoryName) notFound();

  const totalPages = article.pages_json.length;
  const rawPage = parseInt(searchParams.strana || "1");
  const currentPage = Math.max(
    1,
    Math.min(totalPages, isNaN(rawPage) ? 1 : rawPage)
  );
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const pageData = article.pages_json[currentPage - 1];
  const base = `/${params.category}/${params.slug}`;
  const hrefFor = (p: number) => (p === 1 ? base : `${base}?strana=${p}`);

  const related = isLastPage
    ? await getRelatedArticles(article.category, article.id, 6)
    : [];

  const publishedDate = new Date(article.published_at).toLocaleDateString(
    "bs-BA",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const totalWords = article.pages_json.reduce(
    (sum, p) => sum + p.text.split(/\s+/).length,
    0
  );
  const readMinutes = Math.max(1, Math.round(totalWords / 220));

  // Tekst podijeljen u paragrafe
  const paragraphs = pageData.text
    .split(/\n\n+|\n/)
    .filter((p) => p.trim());
  const midPoint = Math.max(1, Math.ceil(paragraphs.length / 2));
  const firstHalf = paragraphs.slice(0, midPoint);
  const secondHalf = paragraphs.slice(midPoint);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.subtitle,
    datePublished: article.published_at,
    image: article.hero_image_url ? [article.hero_image_url] : undefined,
    author: { "@type": "Organization", name: "VTIportal" },
    publisher: {
      "@type": "Organization",
      name: "VTIportal",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com"}/favicon.ico`,
      },
    },
  };

  return (
    <div className="article-single">
      {isFirstPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* === OGLAS #1 — TOP (svaka stranica) === */}
      <ResponsiveAdSlot />

      {isFirstPage && (
        <>
          <div className="breadcrumb">
            <Link href="/">Početna</Link>
            <span>›</span>
            <Link href={`/${params.category}`}>{categoryName}</Link>
            <span>›</span>
            <span>{truncate(article.title, 40)}</span>
          </div>

          <span className="category-tag">{categoryName.toUpperCase()}</span>

          <h1 className="article-title">{article.title}</h1>

          {article.subtitle && (
            <p className="article-subtitle">{article.subtitle}</p>
          )}

          <div className="article-meta">
            Objavljeno: <strong>{publishedDate}</strong>
            {" · "}Autor: <strong>Redakcija</strong>
            {" · "}Čitanje: <strong>~{readMinutes} min</strong>
            {article.views > 0 && (
              <>
                {" · "}
                <strong>{article.views.toLocaleString("bs-BA")}</strong>{" "}
                pregleda
              </>
            )}
          </div>

          {article.hero_image_url && (
            <div className="hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.hero_image_url} alt={article.title} />
            </div>
          )}

          {/* === OGLAS #2 — izmedju slike i teksta (SAMO na page 1) === */}
          <ResponsiveAdSlot />
        </>
      )}

      {/* === TEKST === */}
      <div
        className={`article-body ${isFirstPage ? "first-page" : ""}`}
      >
        <div className="page-indicator">
          Stranica {currentPage} od {totalPages}
        </div>

        {firstHalf.map((p, i) => (
          <p key={`first-${i}`}>{p}</p>
        ))}

        {/* === OGLAS #2 — u sredini teksta (SAMO na page 2+) === */}
        {!isFirstPage && secondHalf.length > 0 && <ResponsiveAdSlot />}

        {secondHalf.map((p, i) => (
          <p key={`second-${i}`}>{p}</p>
        ))}

        {!isLastPage && pageData.hook && (
          <div className="slide-hook">📌 {pageData.hook}</div>
        )}

        {isLastPage && article.moral && (
          <div className="moral-box">
            <strong>Pouka priče</strong>
            {article.moral}
          </div>
        )}

        {isLastPage && (
          <p
            style={{
              fontSize: 14,
              color: "#666",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            * Priča inspirisana istinitim životnim situacijama. Imena i
            detalji su izmijenjeni radi zaštite privatnosti.
          </p>
        )}
      </div>

      {/* === OGLAS #3 — BOTTOM (svaka stranica) === */}
      <ResponsiveAdSlot />

      {/* === NAVIGATION === */}
      <div className="nav-buttons">
        {currentPage > 1 ? (
          <a href={hrefFor(currentPage - 1)} className="btn-prev">
            ← Nazad
          </a>
        ) : (
          <button className="btn-prev" disabled>
            ← Nazad
          </button>
        )}

        <span className="slide-counter">
          {currentPage} / {totalPages}
        </span>

        {!isLastPage ? (
          <a href={hrefFor(currentPage + 1)} className="btn-next">
            Nastavi čitati →
          </a>
        ) : (
          <a href="#related" className="btn-next">
            ✓ Kraj priče — Pročitaj još
          </a>
        )}
      </div>

      {/* === RELATED — samo na zadnjoj stranici === */}
      {isLastPage && related.length > 0 && (
        <section id="related" style={{ marginTop: 40 }}>
          <h2
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#1a73e8",
              borderBottom: "2px solid #1a73e8",
              paddingBottom: 8,
              marginBottom: 14,
            }}
          >
            📖 Pročitaj još
          </h2>
          <RelatedArticles articles={related} />
        </section>
      )}
    </div>
  );
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
