import { createClient } from "@supabase/supabase-js";

/**
 * Minimalna schema definicija za type safety kod admin insert/update
 * operacija. Ne pokušava biti kompletna — samo pokriva polja koja
 * admin route koristi.
 */
type AdminDatabase = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          category: string;
          tags: string[];
          pages_json: unknown;
          moral: string | null;
          hero_image_url: string | null;
          thumbnail_url: string | null;
          status: string;
          template_id: number;
          variables_used: unknown;
          published_at: string | null;
          created_at: string;
          views: number;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          category: string;
          tags?: string[];
          pages_json: unknown;
          moral?: string | null;
          hero_image_url?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          template_id?: number;
          variables_used?: unknown;
          published_at?: string | null;
        };
        Update: Partial<{
          title: string;
          slug: string;
          subtitle: string | null;
          category: string;
          tags: string[];
          pages_json: unknown;
          moral: string | null;
          hero_image_url: string | null;
          thumbnail_url: string | null;
          status: string;
        }>;
      };
    };
  };
};

/**
 * Server-only Supabase client sa service role ključem.
 * Koristi se SAMO u server API rutama (nikad u client kodu) jer zaobilazi RLS.
 */
let _admin: ReturnType<typeof createClient<AdminDatabase>> | null = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY moraju biti postavljeni"
    );
  }

  _admin = createClient<AdminDatabase>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
