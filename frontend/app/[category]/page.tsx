import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categorySlugToName, CATEGORIES } from "@/lib/categories";
import { getArticlesByCategory, getMostRead } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";

export const revalidate = 600;
export const dynamicParams = false;

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const name = categorySlugToName(params.category);
  if (!name) return {};
  return {
    title: name,
    description: `Priče iz kategorije ${name} na VTIportal.com`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const name = categorySlugToName(params.category);
  if (!name) notFound();

  const [articles, mostRead] = await Promise.all([
    getArticlesByCategory(name, 30),
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
          {name}
        </h1>
        {articles.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic", padding: "40px 0" }}>
            Još nema objavljenih priča u ovoj kategoriji.
          </p>
        ) : (
          <div className="home-grid">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}
