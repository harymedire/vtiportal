import { getLatestArticles, getMostRead } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";

export const revalidate = 600;

export default async function HomePage() {
  const [latest, mostRead] = await Promise.all([
    getLatestArticles(24),
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
          Najnovije priče
        </h1>
        {latest.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic", padding: "40px 0" }}>
            Uskoro stižu prve priče.
          </p>
        ) : (
          <div className="home-grid">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </main>
      <Sidebar mostRead={mostRead} />
    </div>
  );
}
