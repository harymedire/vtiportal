// Detekcija i parsiranje video markera u tekstu članka.
//
// Inline marker (bilo gdje u tekstu, u vlastitom redu):
//   [video: https://...]
// End marker (renderuje se na zadnjoj stranici ispod pouke):
//   [video-kraj: https://...]
//
// URL se auto-prepoznaje: YouTube / TikTok / Instagram / direktan video fajl (MP4/WebM/MOV).

export type MediaKind = "youtube" | "tiktok" | "instagram" | "video" | "unknown";

export type DetectedMedia = {
  kind: MediaKind;
  url: string;
  /** Spreman iframe/video src. null = ne možemo embedovati (prikaži link). */
  embedUrl: string | null;
  /** Oblik okvira radi responzivnog renderiranja. */
  aspect: "16:9" | "9:16";
};

// Inline marker — cijeli paragraf je samo [video: URL]
const INLINE_RE = /^\s*\[video:\s*(\S.*?)\s*\]\s*$/i;
// End marker — može biti bilo gdje, izvlači se i renderuje posebno
const END_RE = /\[video-kraj:\s*(\S.*?)\s*\]/i;

/** Ako je paragraf čisti inline video marker, vrati URL; inače null. */
export function parseInlineVideo(paragraph: string): string | null {
  const m = paragraph.match(INLINE_RE);
  return m ? m[1].trim() : null;
}

/** Izvuče end-video URL iz teksta (ako postoji). */
export function extractEndVideo(text: string): string | null {
  const m = text.match(END_RE);
  return m ? m[1].trim() : null;
}

/** Ukloni end-video marker iz teksta (za render i za edit textarea-u). */
export function stripEndVideo(text: string): string {
  return text.replace(END_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

function extractYouTubeId(url: string): string | null {
  // youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID
  const patterns = [
    /youtu\.be\/([\w-]{6,})/i,
    /[?&]v=([\w-]{6,})/i,
    /youtube\.com\/(?:shorts|embed|live|v)\/([\w-]{6,})/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractTikTokId(url: string): string | null {
  const m = url.match(/\/video\/(\d{6,})/);
  return m ? m[1] : null;
}

function extractInstagramPath(url: string): string | null {
  // /p/CODE/, /reel/CODE/, /tv/CODE/
  const m = url.match(/instagram\.com\/(p|reel|tv|reels)\/([\w-]+)/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `${kind}/${m[2]}`;
}

/** Prepoznaj izvor iz URL-a i izračunaj spreman embed src. */
export function detectMedia(rawUrl: string): DetectedMedia {
  const url = rawUrl.trim();

  if (/youtube\.com|youtu\.be/i.test(url)) {
    const id = extractYouTubeId(url);
    const isShorts = /\/shorts\//i.test(url);
    return {
      kind: "youtube",
      url,
      embedUrl: id ? `https://www.youtube.com/embed/${id}` : null,
      aspect: isShorts ? "9:16" : "16:9",
    };
  }
  if (/tiktok\.com/i.test(url)) {
    const id = extractTikTokId(url);
    return {
      kind: "tiktok",
      url,
      embedUrl: id ? `https://www.tiktok.com/player/v1/${id}` : null,
      aspect: "9:16",
    };
  }
  if (/instagram\.com/i.test(url)) {
    const path = extractInstagramPath(url);
    return {
      kind: "instagram",
      url,
      embedUrl: path ? `https://www.instagram.com/${path}/embed` : null,
      aspect: "9:16",
    };
  }
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) {
    return { kind: "video", url, embedUrl: url, aspect: "16:9" };
  }
  return { kind: "unknown", url, embedUrl: null, aspect: "16:9" };
}
