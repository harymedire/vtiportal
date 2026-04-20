"use client";

import { useEffect, useState } from "react";
import AdSlot from "./AdSlot";
import type { Page } from "@/lib/types";

type Props = {
  pages: Page[];
  moral: string | null;
};

const READ_TIME_SECONDS = 45;

export default function ArticlePager({ pages, moral }: Props) {
  const total = pages.length;
  const [current, setCurrent] = useState(1);

  // Sync sa ?strana= u URL-u pri mount i na back/forward
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const target = parseInt(params.get("strana") || "1");
      if (target >= 1 && target <= total) {
        setCurrent(target);
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [total]);

  const changePage = (dir: number) => {
    const next = current + dir;
    if (next < 1 || next > total) return;
    setCurrent(next);

    const params = new URLSearchParams(window.location.search);
    if (next === 1) {
      params.delete("strana");
    } else {
      params.set("strana", String(next));
    }
    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.pushState(null, "", newUrl);

    const mainEl = document.getElementById("article-main");
    if (mainEl) mainEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const progressPct = (current / total) * 100;

  return (
    <>
      <div className="progress-label">
        <span>Stranica {current} od {total}</span>
        <span className="read-time">~{READ_TIME_SECONDS}s do sljedeće</span>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${progressPct}%` }} />
      </div>

      <AdSlot slot="article-top" className="ad-box ad-rectangle" placeholder="Reklama · 300×250" />

      {pages.map((p, idx) => {
        const pageNum = idx + 1;
        const isLast = pageNum === total;
        const isActive = pageNum === current;
        const label = isLast ? "Pouka" : pageNum === 1 ? "Uvod" : pageNum === total - 1 ? "Otkriće" : "Razvoj";

        return (
          <article
            key={pageNum}
            className={`slide ${isActive ? "active" : ""}`}
            aria-hidden={!isActive}
          >
            <div className="slide-badge">
              {pageNum} od {total} · {label}
            </div>
            {formatPageText(p.text)}
            {idx === 1 && (
              <AdSlot
                slot="article-inline-1"
                className="ad-box ad-inline"
                placeholder="Reklama · 728×90"
              />
            )}
            {idx === 2 && (
              <AdSlot
                slot="article-inline-2"
                className="ad-box ad-inline"
                placeholder="Reklama · 728×90"
              />
            )}
            {!isLast && p.hook && (
              <div className="slide-hook">📌 {p.hook}</div>
            )}
            {isLast && moral && (
              <div className="moral-box">
                <strong>Pouka priče</strong>
                {moral}
              </div>
            )}
            {isLast && (
              <p style={{
                fontSize: 14, color: "#666", fontStyle: "italic",
                textAlign: "center", marginTop: 20,
              }}>
                * Priča inspirisana istinitim životnim situacijama. Imena i detalji su izmijenjeni radi zaštite privatnosti.
              </p>
            )}
          </article>
        );
      })}

      <div className="nav-buttons">
        <button
          className="btn-prev"
          onClick={() => changePage(-1)}
          disabled={current === 1}
          aria-label="Prethodna stranica"
        >
          ← Nazad
        </button>
        <span className="slide-counter">{current} / {total}</span>
        <button
          className="btn-next"
          onClick={() => {
            if (current === total) {
              const rel = document.querySelector(".related-section");
              if (rel) rel.scrollIntoView({ behavior: "smooth" });
            } else {
              changePage(1);
            }
          }}
        >
          {current === total ? "✓ Kraj priče — Pročitaj još" : "Sljedeće →"}
        </button>
      </div>
    </>
  );
}

function formatPageText(text: string) {
  // Split na paragrafe po \n\n ili \n
  const paragraphs = text.split(/\n\n+|\n/).filter((p) => p.trim().length > 0);
  return paragraphs.map((p, i) => <p key={i}>{p}</p>);
}
