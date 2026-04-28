import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSessionFromCookies } from "@/lib/admin";
import AdsManager from "./AdsManager";

export const dynamic = "force-dynamic";

export default function AdsAdminPage() {
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
        <h1 style={{ fontSize: 22, color: "#1a73e8" }}>Reklame</h1>
        <Link
          href="/admin"
          style={{
            padding: "8px 14px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 13,
            textDecoration: "none",
            color: "#333",
          }}
        >
          ← Admin home
        </Link>
      </div>
      <AdsManager />
    </div>
  );
}
