import { supabase } from "@/lib/supabase";
import SponsorVignette from "./SponsorVignette";

export const dynamic = "force-dynamic";

export default async function SponsorVignetteLoader() {
  const { data, error } = await supabase
    .from("ad_slots")
    .select("image_url,link_url,label")
    .eq("slot_name", "vignette")
    .eq("active", true);

  if (error || !data || data.length === 0) return null;

  return <SponsorVignette ads={data} />;
}
