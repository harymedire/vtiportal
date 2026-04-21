import type { Metadata } from "next";
import {
  getLatestArticles,
  countPublishedArticles,
  getMostRead,
} from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";
import Pagination from "@/components/Pagination";

export const revalidate = 600;

const PER_PAGE = 10;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { strana?: string };
}): Promise<Metadata> {
  const page = parseInt(searchParams.strana || "1") || 1;
  const canonical = page === 1 ? "/" : `/?strana=${page}`;
  return {
    title:
      page === 1
        ? undefined
        : `Najnovije priče — strana ${page}`,
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
  const offset = (currentPage - 1) * PER_PAGE;

  const [latest, mostRead] = await Promise.all([
    getLatestArticles(PER_PAGE, offset),
    getMostRead(5),
  ]);

  return (
    <div className="page-wrap">
      <main>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 18,
            fontFamily: "Arial, sans-serif",
            borderBottom: "2px solid #1a73e8",
            paddingBottom: 10,
            color: "#1a73e8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {currentPage === 1 ? "Najnovije priče" : `Priče — strana ${currentPage}`}
        </h1>
        {latest.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic", padding: "40px 0" }}>
            Uskoro stižu prve priče.
          </p>
        ) : (
          <>
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
          </>
        )}
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}
