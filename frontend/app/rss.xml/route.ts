import { getLatestArticles } from "@/lib/supabase";
import { categoryNameToSlug } from "@/lib/categories";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822Date(d: Date): string {
  // "Mon, 21 Apr 2026 14:30:00 GMT"
  return d.toUTCString();
}

export async function GET() {
  const articles = await getLatestArticles(50);

  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/${categoryNameToSlug(a.category)}/${a.slug}`;
      const image = a.hero_image_url || a.thumbnail_url || "";
      const title = escapeXml(a.title);
      const description = escapeXml(a.subtitle || a.title);
      const pubDate = rfc822Date(new Date(a.published_at));
      const category = escapeXml(a.category);

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <category>${category}</category>${
        image
          ? `
      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />
      <media:content url="${escapeXml(image)}" medium="image" type="image/jpeg" />
      <media:thumbnail url="${escapeXml(image)}" />`
          : ""
      }
    </item>`;
    })
    .join("\n");

  const lastBuild = articles.length > 0
    ? rfc822Date(new Date(articles[0].published_at))
    : rfc822Date(new Date());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>VTIportal — Drame, ispovijesti i priče iz života</title>
    <link>${SITE_URL}</link>
    <description>Autentične priče iz svakodnevnog života — ispovijesti, drame, priče iz komšiluka.</description>
    <language>bs-BA</language>
    <copyright>© ${new Date().getFullYear()} VTIportal.com</copyright>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>VTIportal</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
    },
  });
}
