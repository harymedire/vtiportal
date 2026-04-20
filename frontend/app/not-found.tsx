import Link from "next/link";

export default function NotFound() {
  return (
    <div className="static-page" style={{ textAlign: "center" }}>
      <h1>404 — Stranica nije pronađena</h1>
      <p>Stranica koju tražite ne postoji ili je premještena.</p>
      <p>
        <Link href="/" style={{ fontWeight: 700 }}>
          ← Nazad na početnu
        </Link>
      </p>
    </div>
  );
}
