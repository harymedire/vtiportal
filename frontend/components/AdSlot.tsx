"use client";

import { useEffect, useRef } from "react";

type AdSlotProps = {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

/**
 * AdSense slot. Ako NEXT_PUBLIC_ADSENSE_CLIENT nije postavljen, renderuje
 * placeholder box sa vizuelnim indikatorom (za dev/preview).
 */
export default function AdSlot({
  slot,
  format = "auto",
  className = "ad-box ad-rectangle",
  style,
  placeholder,
}: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!client || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [client]);

  if (!client) {
    return (
      <div className={className} style={style}>
        {placeholder || "Reklama"}
      </div>
    );
  }

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
