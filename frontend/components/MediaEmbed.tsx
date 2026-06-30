import { detectMedia } from "@/lib/media";
import TweetEmbed from "./TweetEmbed";

type Props = { url: string };

// Renderuje video iz markera u tekstu članka.
// YouTube / TikTok / Instagram / Facebook -> responzivan iframe;
// X (Twitter) -> zvanični widget; direktan fajl -> <video>.
export default function MediaEmbed({ url }: Props) {
  const media = detectMedia(url);

  // X (Twitter) — zvanični widget (auto-visina, podržava video)
  if (media.kind === "twitter" && media.embedUrl) {
    return <TweetEmbed url={media.url} />;
  }

  // Direktan video fajl (MP4/WebM/MOV) — npr. upload na R2
  if (media.kind === "video") {
    return (
      <div className="media-embed media-embed-file">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={media.embedUrl ?? media.url}
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            maxHeight: 520,
            borderRadius: 8,
            background: "#000",
            display: "block",
          }}
        />
      </div>
    );
  }

  // Ne možemo embedovati (npr. skraćeni link bez ID-a) — prikaži klikabilan link
  if (!media.embedUrl) {
    return (
      <p className="media-embed media-embed-fallback">
        🎬{" "}
        <a href={media.url} target="_blank" rel="noopener noreferrer">
          Pogledaj video
        </a>
      </p>
    );
  }

  const vertical = media.aspect === "9:16";
  const paddingTop = vertical ? "177.78%" : "56.25%";

  return (
    <div
      className={`media-embed media-embed-${media.kind}`}
      style={{
        margin: "24px auto",
        maxWidth: vertical ? 340 : "100%",
      }}
    >
      <div style={{ position: "relative", width: "100%", paddingTop }}>
        <iframe
          src={media.embedUrl}
          title="Video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}
