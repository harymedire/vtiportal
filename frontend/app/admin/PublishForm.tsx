"use client";

import { useState } from "react";

const CATEGORIES = [
  "Ispovijesti",
  "Komšiluk",
  "Lifestyle",
];

export default function PublishForm() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [result, setResult] = useState<null | {
    ok: boolean;
    message: string;
    url?: string;
    pages?: number;
  }>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: CATEGORIES[0],
    tags: "",
    moral: "",
    text: "",
    hero_image_url: "",
  });

  async function handleGenerateImage() {
    const prompt = imagePrompt.trim();
    if (!prompt) {
      setGenerateError("Unesi prompt za generisanje");
      return;
    }
    setGenerateError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGenerateError(json.error || "Generisanje neuspješno");
      } else {
        setForm((f) => ({ ...f, hero_image_url: json.url }));
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Upload greška");
      } else {
        setForm((f) => ({ ...f, hero_image_url: json.url }));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult({
        ok: true,
        message: `Članak objavljen (${data.article.pages} stranica). URL: ${data.article.url}`,
        url: data.article.url,
        pages: data.article.pages,
      });
      // Reset form
      setForm({
        title: "",
        subtitle: "",
        category: CATEGORIES[0],
        tags: "",
        moral: "",
        text: "",
        hero_image_url: "",
      });
    } else {
      setResult({
        ok: false,
        message: data.error || "Greška pri objavi",
      });
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
    marginBottom: 14,
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    fontWeight: 600,
  };
  const hintStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#888",
    marginTop: -10,
    marginBottom: 14,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 8,
        border: "1px solid #e0e0e0",
      }}
    >
      <label style={labelStyle}>Naslov (clickbait, 40-200 karaktera)</label>
      <input
        style={inputStyle}
        type="text"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="npr. Svekrva je došla na ručak, a kad sam vidjela šta stavlja u tašnu..."
      />

      <label style={labelStyle}>Podnaslov (1-2 rečenice)</label>
      <input
        style={inputStyle}
        type="text"
        value={form.subtitle}
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        placeholder="Kratki teaser ispod naslova"
      />

      <label style={labelStyle}>Kategorija</label>
      <select
        style={inputStyle}
        required
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Tagovi (odvojeni zarezom)</label>
      <input
        style={inputStyle}
        type="text"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
        placeholder="porodica, drama, tajna"
      />

      <label style={labelStyle}>Pouka / punchline (kraj priče)</label>
      <input
        style={inputStyle}
        type="text"
        value={form.moral}
        onChange={(e) => setForm({ ...form, moral: e.target.value })}
        placeholder="Jednorečenična pouka koja se prikazuje na poslednjoj stranici"
      />

      <label style={labelStyle}>Hero slika</label>
      <div
        style={{
          border: "1px dashed #ccc",
          borderRadius: 6,
          padding: 16,
          marginBottom: 14,
          background: "#fafafa",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4, fontWeight: 600 }}>
            🪄 Generiši sliku (Flux Schnell, ~$0.003)
          </div>
          <textarea
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 13,
              border: "1px solid #ccc",
              borderRadius: 6,
              minHeight: 70,
              resize: "vertical",
              fontFamily: "inherit",
            }}
            placeholder="Opiši sliku na engleskom (16:9, JPG, bez ljudi ako članak to ne traži)..."
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            disabled={generating}
          />
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={generating || uploading}
            style={{
              marginTop: 6,
              padding: "8px 14px",
              background: generating ? "#999" : "#6a4fb6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: generating ? "wait" : "pointer",
            }}
          >
            {generating ? "Generišem… (do 30s)" : "Generiši sliku"}
          </button>
          {generateError && (
            <div style={{ marginTop: 6, color: "#d00", fontSize: 13 }}>
              {generateError}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          Ili upload fajla:
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ fontSize: 13 }}
        />
        <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
          Ili zalijepi javni URL:
        </div>
        <input
          style={{ ...inputStyle, marginTop: 6, marginBottom: 0 }}
          type="url"
          value={form.hero_image_url}
          onChange={(e) =>
            setForm({ ...form, hero_image_url: e.target.value })
          }
          placeholder="https://..."
        />
        {uploading && (
          <div style={{ marginTop: 8, color: "#1a73e8", fontSize: 13 }}>
            Upload u toku…
          </div>
        )}
        {uploadError && (
          <div style={{ marginTop: 8, color: "#d00", fontSize: 13 }}>
            {uploadError}
          </div>
        )}
        {form.hero_image_url && !uploading && (
          <div style={{ marginTop: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.hero_image_url}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: 240,
                borderRadius: 4,
                display: "block",
                marginBottom: 6,
              }}
            />
            <div
              style={{ fontSize: 11, color: "#666", wordBreak: "break-all" }}
            >
              {form.hero_image_url}
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, hero_image_url: "" })}
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
          </div>
        )}
      </div>
      <div style={hintStyle}>
        Preporučeno 1280x720 (16:9). Max 10 MB. JPEG/PNG/WebP/GIF.
      </div>

      <label style={labelStyle}>
        Tekst članka (paragrafi razdvojeni praznim redom)
      </label>
      <textarea
        style={{ ...inputStyle, minHeight: 400, resize: "vertical", fontFamily: "Georgia, serif", lineHeight: 1.6 }}
        required
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        placeholder={"Paragraf 1...\n\nParagraf 2...\n\nParagraf 3..."}
      />
      <div style={hintStyle}>
        Sistem automatski dijeli na stranice (~200 riječi po stranici, max 10 stranica).
        Prazan red između paragrafa = novi paragraf.
      </div>

      {result && (
        <div
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 6,
            background: result.ok ? "#e7f5e7" : "#fde0e0",
            color: result.ok ? "#1a6b1a" : "#9a2020",
            fontSize: 14,
          }}
        >
          {result.ok && result.url ? (
            <>
              ✅ Članak objavljen u {result.pages} stranica.{" "}
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                Otvori članak →
              </a>
            </>
          ) : (
            <>❌ {result.message}</>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading || generating}
        style={{
          width: "100%",
          padding: 14,
          background: loading || uploading || generating ? "#999" : "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: "bold",
          cursor: loading || uploading || generating ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Objavljujem…" : "Objavi članak"}
      </button>
    </form>
  );
}
