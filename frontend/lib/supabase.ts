import { createClient } from "@supabase/supabase-js";
import type { Article, ArticleListItem } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const LIST_SELECT =
  "id,title,slug,subtitle,category,thumbnail_url,hero_image_url,published_at,views";

export async function getLatestArticles(
  limit = 10,
  offset = 0
): Promise<ArticleListItem[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []) as ArticleListItem[];
}

export async function countPublishedArticles(): Promise<number> {
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  if (error) throw error;
  return count || 0;
}

export async function getArticlesByCategory(
  category: string,
  limit = 10,
  offset = 0
): Promise<ArticleListItem[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("category", category)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []) as ArticleListItem[];
}

export async function countArticlesByCategory(
  category: string
): Promise<number> {
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .eq("category", category);
  if (error) throw error;
  return count || 0;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as Article) || null;
}

export async function getRelatedArticles(
  category: string,
  excludeId: string,
  limit = 3
): Promise<ArticleListItem[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("category", category)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ArticleListItem[];
}

export async function getMostRead(limit = 5): Promise<ArticleListItem[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ArticleListItem[];
}

export type AdSlotEntry = {
  id: string;
  image_url: string;
  link_url: string;
  label: string | null;
};

export async function getRandomAdForSlot(slot: string): Promise<AdSlotEntry | null> {
  const { data, error } = await supabase
    .from("ad_slots")
    .select("id,image_url,link_url,label")
    .eq("slot_name", slot)
    .eq("active", true);
  if (error || !data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)] as AdSlotEntry;
}

export async function getAllSlugsForSitemap(): Promise<
  { slug: string; category: string; published_at: string }[]
> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug,category,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return data || [];
}
