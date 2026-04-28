import Link from "next/link";
import { getRandomAdForSlot } from "@/lib/supabase";
import NinaBanner from "./NinaBanner";

type Props = {
  slot: "home_hero" | "home_category" | "article_middle" | "article_cta_below";
  /** Ako slot u DB-u nema aktivnih reklama, prikaže hardkodirani NinaBanner
   *  kao fallback. Pass null da se ne prikazuje ništa. */
  fallbackVariant?: "vti1" | "vti2" | null;
};

const SLOT_TO_FALLBACK: Record<Props["slot"], "vti1" | "vti2"> = {
  home_hero: "vti1",
  home_category: "vti2",
  article_middle: "vti1",
  article_cta_below: "vti2",
};

export default async function SponsorSlot({ slot, fallbackVariant }: Props) {
  const ad = await getRandomAdForSlot(slot);
  if (!ad) {
    if (fallbackVariant === null) return null;
    return <NinaBanner variant={fallbackVariant ?? SLOT_TO_FALLBACK[slot]} />;
  }
  return (
    <div className="nina-banner-wrap">
      <Link
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="nina-banner-link"
        aria-label={ad.label || "Reklama"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt={ad.label || ""} loading="lazy" />
      </Link>
    </div>
  );
}
