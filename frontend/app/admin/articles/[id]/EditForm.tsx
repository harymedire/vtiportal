"use client";

import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "Ispovijesti",
  "Priče iz života",
  "Komšiluk",
  "Drame uz kafu",
  "Smijeh i suze",
];

const TARGET_WORDS_PER_PAGE = 200;
const MIN_PAGES = 3;
const MAX_PAGES = 10;

type Props = { articleId: string };

export default function EditForm({ articleId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

      <label style={labelStyle}>URL slike (hero + thumbnail)</label>
      <input
        style={inputStyle}
        type="url"
        value={form.hero_image_url}
        onChange={(e) =>
          setForm({ ...form, hero_image_url: e.target.value })
        }
        placeholder="https://... ili ostavi prazno"
      />
      {form.hero_image_url && (
        <div style={{ marginTop: -10, marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.hero_image_url}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: 240,
              borderRadius: 4,
              display: "block",
              border: "1px solid #eee",
            }}
          />
        </div>
      )}

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
          disabled={saving}
          style={{
            flex: 1,
            padding: 14,
            background: saving ? "#999" : "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
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
