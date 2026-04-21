"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

/**
 * Responsive AdSense in-article slot.
 * Minimum dimenzije 336x280 — dovoljno da AdSense fit-uje Large Rectangle
 * ili bilo koji responsive format.
 *
 * Koristi `NEXT_PUBLIC_ADSENSE_CLIENT` (publisher ID) i
 * `NEXT_PUBLIC_ADSENSE_SLOT` (slot ID iz AdSense dashboard-a).
 *
 * Ako slot nije postavljen, prikazuje placeholder (za dev).
 */
export default function ResponsiveAdSlot() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [client, slot]);

  const wrapStyle: React.CSSProperties = {
    minWidth: 336,
    minHeight: 280,
    margin: "24px auto",
    display: "block",
  };

  if (!client || !slot) {
    return (
      <div
        style={{
          ...wrapStyle,
          background: "#fff",
          border: "1px dashed #c9c9c9",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#aaa",
          fontFamily: "Arial, sans-serif",
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 10,
            fontSize: 9,
            color: "#999",
          }}
        >
          OGLAS
        </span>
        Reklama (responsive 336×280+)
      </div>
    );
  }

  return (
    <>
      <ins
        className="adsbygoogle"
        style={wrapStyle}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <Script id={`adsense-push-${slot}-${Math.random()}`} strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </>
  );
}
