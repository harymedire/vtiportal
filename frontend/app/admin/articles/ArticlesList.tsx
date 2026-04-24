"use client";

import { useEffect, useState } from "react";
import { CATEGORY_NAME_TO_SLUG } from "@/lib/categories";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  hero_image_url: string | null;
  published_at: string | null;
  created_at: string;
  views: number;
};

export default function ArticlesList() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Greška pri učitavanju članaka");
      } else {
        setArticles(data.articles || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (
      !confirm(
        `Obrisati članak "${title.slice(0, 80)}..."? Ovo se ne može poništiti.`
      )
    )
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Greška pri brisanju: ${data.error || "Nepoznato"}`);
      } else {
        setArticles((list) => list.filter((a) => a.id !== id));
      }
    } catch (e) {
      alert(
        `Greška pri brisanju: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
        Učitavanje…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          background: "#fde0e0",
          color: "#9a2020",
          borderRadius: 6,
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#888",
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
        }}
      >
        Nema članaka još.{" "}
        <a href="/admin" style={{ color: "#1a73e8", fontWeight: 600 }}>
          Objavi prvi →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {articles.map((a, i) => {
        const categorySlug =
          CATEGORY_NAME_TO_SLUG[a.category] || a.category.toLowerCase();
        const publicUrl = `/${categorySlug}/${a.slug}`;
        const editUrl = `/admin/articles/${a.id}`;
        const publishedDate = a.published_at
          ? new Date(a.published_at).toLocaleDateString("sr-Latn-BA", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—";

        return (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr auto",
              gap: 14,
              padding: 14,
              borderBottom:
                i < articles.length - 1 ? "1px solid #eee" : "none",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 54,
                background: "#f0f0f0",
                borderRadius: 4,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {a.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.hero_image_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 10, color: "#aaa" }}>bez slike</span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  lineHeight: 1.3,
                  marginBottom: 4,
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#1a73e8" }}>{a.category}</span>
                <span>📅 {publishedDate}</span>
                {a.views > 0 && (
                  <span>👁️ {a.views.toLocaleString("sr-Latn-BA")}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={btnStyle("ghost")}
              >
                Otvori
              </a>
              <a href={editUrl} style={btnStyle("edit")}>
                Uredi
              </a>
              <button
                type="button"
                onClick={() => handleDelete(a.id, a.title)}
                disabled={deletingId === a.id}
                style={btnStyle("delete")}
              >
                {deletingId === a.id ? "…" : "Obriši"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function btnStyle(variant: "ghost" | "edit" | "delete"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid transparent",
    cursor: "pointer",
    display: "inline-block",
    lineHeight: 1.2,
  };
  if (variant === "ghost") {
    return {
      ...base,
      background: "#f5f5f5",
      color: "#444",
      borderColor: "#ddd",
    };
  }
  if (variant === "edit") {
    return { ...base, background: "#1a73e8", color: "#fff" };
  }
  return { ...base, background: "#fff", color: "#c00", borderColor: "#c00" };
}
