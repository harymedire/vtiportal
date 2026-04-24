import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin";
import ArticlesList from "./ArticlesList";

export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  if (!getAdminSessionFromCookies()) redirect("/admin/login");

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "20px auto",
        padding: "0 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 22, color: "#1a73e8", margin: 0 }}>
          Svi članci
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/admin"
            style={{
              padding: "8px 14px",
              background: "#1a73e8",
              color: "#fff",
              borderRadius: 6,
              fontSize: 13,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            + Novi članak
          </a>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Odjavi se
            </button>
          </form>
        </div>
      </div>
      <ArticlesList />
    </div>
  );
}
