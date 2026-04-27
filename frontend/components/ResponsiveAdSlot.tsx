"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

/**
 * AdSense 336x280 Medium Rectangle.
 * Isti slot se koristi na svim pozicijama (3 po stranici).
 */
const AD_CLIENT = "ca-pub-2437073177304126";
const AD_SLOT = "2262904149";

export default function ResponsiveAdSlot() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="vti-ad-wrap">
      <span className="vti-ad-label">Oglas</span>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 336, height: 280 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
      />
      <Script id={`adsense-push-${Math.random()}`} strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </div>
  );
}
