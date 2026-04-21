import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categorySlugToName, CATEGORIES } from "@/lib/categories";
import {
  getArticlesByCategory,
  countArticlesByCategory,
  getMostRead,
} from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";

export const revalidate = 600;

const PER_PAGE = 10;

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { strana?: string };
}): Promise<Metadata> {
  const name = categorySlugToName(params.category);
  if (!name) return {};
  const page = parseInt(searchParams.strana || "1") || 1;
  const canonical =
    page === 1 ? `/${params.category}` : `/${params.category}?strana=${page}`;
  return {
    title: page === 1 ? name : `${name} — strana ${page}`,
    description: `Priče iz kategorije ${name} na VTIportal.com`,
    alternates: { canonical },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { strana?: string };
}) {
  const name = categorySlugToName(params.category);
  if (!name) notFound();

  const totalCount = await countArticlesByCategory(name);
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const rawPage = parseInt(searchParams.strana || "1");
  const currentPage = Math.max(
    1,
    Math.min(totalPages, isNaN(rawPage) ? 1 : rawPage)
  );
  const offset = (currentPage - 1) * PER_PAGE;

  const [articles, mostRead] = await Promise.all([
    getArticlesByCategory(name, PER_PAGE, offset),
    getMostRead(5),
  ]);

  return (
    <div className="page-wrap">
      <main>
        <div className="breadcrumb">
          <a href="/">Početna</a>
          <span>›</span>
          <span>{name}</span>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 18,
            borderBottom: "2px solid #1a73e8",
            paddingBottom: 10,
            color: "#1a73e8",
            fontFamily: "Arial, sans-serif",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {currentPage === 1 ? name : `${name} — strana ${currentPage}`}
        </h1>
        {articles.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic", padding: "40px 0" }}>
            Još nema objavljenih priča u ovoj kategoriji.
          </p>
        ) : (
          <>
            <div className="home-grid">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/${params.category}`}
            />
          </>
        )}
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}
