"use client";

import { useState } from "react";
import MediaEmbed from "@/components/MediaEmbed";
import { detectMedia } from "@/lib/media";

type Props = {
  /** Ubaci [video: URL] marker na poziciju kursora u tekstu članka. */
  onInsertMarker: (marker: string) => void;
  /** Trenutni "video na kraju" URL. */
  endVideoUrl: string;
  onChangeEndVideo: (url: string) => void;
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#555",
  marginBottom: 4,
  fontWeight: 600,
};

export default function VideoBlock({
  onInsertMarker,
  endVideoUrl,
  onChangeEndVideo,
}: Props) {
  const [staged, setStaged] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stagedTrim = staged.trim();
  const detected = stagedTrim ? detectMedia(stagedTrim) : null;
  const known = detected && detected.kind !== "unknown";

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Upload greška");
      } else {
        setStaged(json.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function insertInline() {
    if (!stagedTrim) return;
    onInsertMarker(`\n\n[video: ${stagedTrim}]\n\n`);
    setStaged("");
  }

  function setAsEnd() {
    if (!stagedTrim) return;
    onChangeEndVideo(stagedTrim);
    setStaged("");
  }

  const btn: React.CSSProperties = {
    padding: "8px 12px",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
  };

  return (
    <>
      <label style={labelStyle}>
        Video (YouTube / TikTok / Instagram / Facebook / X / MP4)
      </label>
      <div
        style={{
          border: "1px dashed #ccc",
          borderRadius: 6,
          padding: 16,
          marginBottom: 14,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          Zalijepi link (YouTube / TikTok / Instagram / Facebook / X):
        </div>
        <input
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            border: "1px solid #ccc",
            borderRadius: 6,
            fontFamily: "inherit",
          }}
          type="url"
          value={staged}
          onChange={(e) => setStaged(e.target.value)}
          placeholder="https://youtube.com/…  ·  tiktok.com/…  ·  instagram.com/reel/…  ·  facebook.com/reel/…  ·  x.com/…/status/…"
        />

        <div style={{ fontSize: 12, color: "#888", margin: "10px 0 4px" }}>
          Ili upload vlastitog snimka (MP4/WebM/MOV, max 80 MB):
        </div>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleVideoUpload}
          disabled={uploading}
          style={{ fontSize: 13 }}
        />
        {uploading && (
          <div style={{ marginTop: 8, color: "#1a73e8", fontSize: 13 }}>
            Upload videa u toku… (veći fajlovi traju duže)
          </div>
        )}
        {uploadError && (
          <div style={{ marginTop: 8, color: "#d00", fontSize: 13 }}>
            {uploadError}
          </div>
        )}

        {stagedTrim && (
          <div style={{ marginTop: 12 }}>
            {known ? (
              <MediaEmbed url={stagedTrim} />
            ) : (
              <div style={{ color: "#d00", fontSize: 13, marginBottom: 8 }}>
                ⚠️ Ne prepoznajem izvor ovog linka. Podržano: YouTube, TikTok,
                Instagram, Facebook, X (Twitter), ili direktan .mp4/.webm/.mov.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={insertInline}
                disabled={!known}
                style={{ ...btn, background: known ? "#1a73e8" : "#aaa" }}
              >
                ➕ Ubaci u tekst (na kursor)
              </button>
              <button
                type="button"
                onClick={setAsEnd}
                disabled={!known}
                style={{ ...btn, background: known ? "#6a4fb6" : "#aaa" }}
              >
                📌 Postavi kao video na kraju
              </button>
              <button
                type="button"
                onClick={() => setStaged("")}
                style={{
                  ...btn,
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ccc",
                }}
              >
                Očisti
              </button>
            </div>
          </div>
        )}

        {/* Trenutni "video na kraju" */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid #e5e5e5",
          }}
        >
          <div style={{ fontSize: 12, color: "#555", fontWeight: 600, marginBottom: 6 }}>
            🎬 Video na kraju članka{" "}
            <span style={{ fontWeight: 400, color: "#999" }}>
              (prikazuje se na zadnjoj stranici ispod pouke)
            </span>
          </div>
          {endVideoUrl ? (
            <>
              <MediaEmbed url={endVideoUrl} />
              <div style={{ fontSize: 11, color: "#666", wordBreak: "break-all" }}>
                {endVideoUrl}
              </div>
              <button
                type="button"
                onClick={() => onChangeEndVideo("")}
                style={{
                  marginTop: 6,
                  background: "transparent",
                  border: "1px solid #ccc",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Ukloni
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#999" }}>Nije postavljen.</div>
          )}
        </div>
      </div>
    </>
  );
}
