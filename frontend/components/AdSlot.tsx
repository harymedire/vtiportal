"use client";

type AdSlotProps = {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
};

/**
 * Ad placeholder. Kad NEXT_PUBLIC_ADSENSE_CLIENT nije postavljen, prikazuje
 * vizualni placeholder (za dev). Kad JE postavljen, vraća null i prepušta
 * Google AdSense Auto Ads-u da sam odluči gdje i kako staviti oglas.
 */
export default function AdSlot({
  className = "ad-box ad-rectangle",
  style,
  placeholder,
}: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (client) {
    // Auto Ads handle placement — render nothing ovdje
    return null;
  }

  return (
    <div className={className} style={style}>
      {placeholder || "Reklama"}
    </div>
  );
}
