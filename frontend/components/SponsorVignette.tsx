"use client";

import { useEffect, useState } from "react";

type VignetteAd = {
  image_url: string;
  link_url: string;
  label: string | null;
};

const STORAGE_KEY = "vti_vignette_last";
const FIRST_DELAY_MS = 30_000; // 30s prvi put
const REPEAT_INTERVAL_MS = 5 * 60_000; // 5 min poslije

export default function SponsorVignette({ ads }: { ads: VignetteAd[] }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<VignetteAd | null>(null);

  useEffect(() => {
    if (ads.length === 0) return;

    const lastShownStr = localStorage.getItem(STORAGE_KEY);
    const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;
    const now = Date.now();
    const elapsed = now - lastShown;

    let delay: number;
    if (!lastShown) {
      delay = FIRST_DELAY_MS;
    } else if (elapsed >= REPEAT_INTERVAL_MS) {
      delay = 1000; // već je prošlo dovoljno — pokaži skoro odmah
    } else {
      delay = REPEAT_INTERVAL_MS - elapsed;
    }

    const t = setTimeout(() => {
      setCurrent(ads[Math.floor(Math.random() * ads.length)]);
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }, delay);

    return () => clearTimeout(t);
  }, [ads]);

  function close() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  if (!visible || !current) return null;

  return (
    <div
      className="sponsor-vignette-overlay"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Sponzorisana poruka"
    >
      <div
        className="sponsor-vignette-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="sponsor-vignette-close"
          onClick={close}
          aria-label="Zatvori"
        >
          ×
        </button>
        <a
          href={current.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={current.label || "Reklama"}
          onClick={() => {
            // Kratko odgodi zatvaranje da se klik registruje
            setTimeout(close, 100);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.image_url} alt={current.label || ""} />
        </a>
      </div>
    </div>
  );
}
