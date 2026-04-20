import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { categorySlugToName } from "@/lib/categories";
import {
  getArticleBySlug,
  getRelatedArticles,
  getMostRead,
} from "@/lib/supabase";
import ArticlePager from "@/components/ArticlePager";
import RelatedArticles from "@/components/RelatedArticles";
import Sidebar from "@/components/Sidebar";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600;

type Params = { category: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  const url = `/${params.category}/${params.slug}`;
  return {
    title: article.title,
    description: article.subtitle || article.moral || article.title,
    openGraph: {
      title: article.title,
      description: article.subtitle || undefined,
      url,
      type: "article",
      images: article.hero_image_url ? [article.hero_image_url] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const categoryName = categorySlugToName(params.category);
  if (!categoryName) notFound();

  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  // Enforce da se članak učitava samo pod ispravnom kategorijom
  if (article.category !== categoryName) notFound();

  const [related, mostRead] = await Promise.all([
    getRelatedArticles(article.category, article.id, 3),
    getMostRead(5),
  ]);

  const publishedDate = new Date(article.published_at).toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalWords = article.pages_json.reduce(
    (sum, p) => sum + p.text.split(/\s+/).length,
    0
  );
  const readMinutes = Math.max(1, Math.round(totalWords / 220));

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
    <div className="page-wrap">
      <main id="article-main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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
              <strong>{article.views.toLocaleString("bs-BA")}</strong> pregleda
            </>
          )}
        </div>

        <div className="hero-image">
          {article.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.hero_image_url} alt={article.title} />
          ) : null}
        </div>

        <ArticlePager pages={article.pages_json} moral={article.moral} />

        <AdSlot
          slot="article-bottom"
          className="ad-box ad-rectangle"
          style={{ marginTop: 26 }}
          placeholder="Reklama · 300×250"
        />

        <RelatedArticles articles={related} />
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
