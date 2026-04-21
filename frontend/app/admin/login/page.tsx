import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (getAdminSessionFromCookies()) redirect("/admin");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 32,
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            marginBottom: 6,
            color: "#1a73e8",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          VTIportal Admin
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#888",
            marginBottom: 18,
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Pristup za uređivanje sadržaja
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
