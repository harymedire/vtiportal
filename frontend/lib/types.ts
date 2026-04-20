export type Page = {
  page: number;
  text: string;
  hook?: string;
  resolution_type?: "pouka" | "humor" | "katarza";
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  category: string;
  tags: string[];
  pages_json: Page[];
  moral: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  status: string;
  template_id: number;
  views: number;
  published_at: string;
  created_at: string;
};

export type ArticleListItem = Pick<
  Article,
  "id" | "title" | "slug" | "subtitle" | "category" | "thumbnail_url" | "hero_image_url" | "published_at" | "views"
>;
