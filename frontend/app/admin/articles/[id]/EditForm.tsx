"use client";

import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "Ispovijesti",
  "Društvo",
  "Lifestyle",
];

const TARGET_WORDS_PER_PAGE = 200;
const MIN_PAGES = 3;
const MAX_PAGES = 10;

type Props = { articleId: string };

export default function EditForm({ articleId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [result, setResult] = useState<null | {
    ok: boolean;
    message: string;
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

  const { wordCount, estimatedPages } = useMemo(() => {
    const words = form.text.split(/\s+/).filter((w) => w.length > 0).length;
    const raw = Math.ceil(words / TARGET_WORDS_PER_PAGE);
    const pages = Math.max(MIN_PAGES, Math.min(MAX_PAGES, raw || MIN_PAGES));
    return { wordCount: words, estimatedPages: pages };
  }, [form.text]);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}`);
        const data = await res.json();
        if (abort) return;
        if (!res.ok) {
          setLoadError(data.error || "Greška pri učitavanju članka");
        } else {
          const a = data.article;
          setForm({
            title: a.title || "",
            subtitle: a.subtitle || "",
            category: a.category || CATEGORIES[0],
            tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
            moral: a.moral || "",
            text: a.text || "",
            hero_image_url: a.hero_image_url || "",
          });
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [articleId]);

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
    setSaving(true);
    setResult(null);

    const res = await fetch(`/api/admin/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setResult({
        ok: true,
        message: `Sačuvano (${data.pages} stranica).`,
      });
    } else {
      setResult({ ok: false, message: data.error || "Greška pri snimanju" });
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
        Učitavanje članka…
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          padding: 16,
          background: "#fde0e0",
          color: "#9a2020",
          borderRadius: 6,
        }}
      >
        {loadError}
      </div>
    );
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
      <label style={labelStyle}>Naslov</label>
      <input
        style={inputStyle}
        type="text"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <label style={labelStyle}>Podnaslov</label>
      <input
        style={inputStyle}
        type="text"
        value={form.subtitle}
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
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
      />

      <label style={labelStyle}>Pouka / punchline</label>
      <input
        style={inputStyle}
        type="text"
        value={form.moral}
        onChange={(e) => setForm({ ...form, moral: e.target.value })}
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

      <label style={labelStyle}>Tekst članka</label>
      <textarea
        style={{
          ...inputStyle,
          minHeight: 420,
          resize: "vertical",
          fontFamily: "Georgia, serif",
          lineHeight: 1.6,
        }}
        required
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
      />
      <div
        style={{
          ...hintStyle,
          marginBottom: 14,
          color: wordCount < 300 ? "#d00" : "#1a6b1a",
          fontWeight: 600,
        }}
      >
        {wordCount === 0
          ? "Prazno..."
          : wordCount < 300
          ? `${wordCount} riječi · min 300 potrebno`
          : `${wordCount} riječi · ~${estimatedPages} stranica (snimanje re-paginira)`}
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
          {result.ok ? `✅ ${result.message}` : `❌ ${result.message}`}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={saving || uploading || generating}
          style={{
            flex: 1,
            padding: 14,
            background: saving || uploading || generating ? "#999" : "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            cursor: saving || uploading || generating ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Snimam…" : "Sačuvaj izmjene"}
        </button>
        <a
          href="/admin/articles"
          style={{
            padding: 14,
            background: "#f5f5f5",
            color: "#444",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 14,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Otkaži
        </a>
      </div>
    </form>
  );
}
