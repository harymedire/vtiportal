"use client";

import { useState } from "react";

const CATEGORIES = [
  "Ispovijesti",
  "Priče iz života",
  "Komšiluk",
  "Drame uz kafu",
  "Smijeh i suze",
];

export default function PublishForm() {
  const [loading, setLoading] = useState(false);
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

      <label style={labelStyle}>URL slike (hero + thumbnail)</label>
      <input
        style={inputStyle}
        type="url"
        value={form.hero_image_url}
        onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
        placeholder="https://pub-xxx.r2.dev/... ili bilo koji javni URL slike"
      />
      <div style={hintStyle}>
        Preporučeno 1280x720 (16:9). Ako nemaš svoju — privremeno ostavi
        prazno, članak se objavljuje bez slike.
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
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: loading ? "#999" : "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Objavljujem…" : "Objavi članak"}
      </button>
    </form>
  );
}
