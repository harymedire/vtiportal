import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin";
import PublishForm from "./PublishForm";

export const dynamic = "force-dynamic";

export default function AdminPage() {
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
        }}
      >
        <h1 style={{ fontSize: 22, color: "#1a73e8" }}>VTIportal Admin</h1>
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
      <PublishForm />
    </div>
  );
}
