import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  if (!getAdminSessionFromCookies()) redirect("/admin/login");

  return (
    <div
      style={{
        maxWidth: 900,
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
        }}
      >
        <h1 style={{ fontSize: 22, color: "#1a73e8", margin: 0 }}>
          Uredi članak
        </h1>
        <a
          href="/admin/articles"
          style={{
            padding: "8px 14px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 13,
            textDecoration: "none",
            color: "#444",
          }}
        >
          ← Svi članci
        </a>
      </div>
      <EditForm articleId={params.id} />
    </div>
  );
}
