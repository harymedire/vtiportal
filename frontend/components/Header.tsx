"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Zatvori meni kad se promijeni ruta (click na link)
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [open]);

  // Blokiraj scroll kad je meni otvoren
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="inner">
        <Link
          href="/"
          className="logo"
          aria-label="VTIportal početna"
          onClick={() => setOpen(false)}
        >
          VTI<span>portal</span>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav" aria-label="Glavni meni">
          <Link href="/">Home</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </nav>

        {/* Hamburger (samo mobile) */}
        <button
          type="button"
          className={`hamburger ${open ? "open" : ""}`}
          aria-label={open ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile overlay meni */}
      <div
        className={`mobile-nav ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      >
        <nav
          aria-label="Mobilni meni"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              onClick={() => setOpen(false)}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
