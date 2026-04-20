import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Header() {
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="logo" aria-label="VTIportal početna">
          VTI<span>portal</span>
        </Link>
        <nav aria-label="Glavni meni">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
