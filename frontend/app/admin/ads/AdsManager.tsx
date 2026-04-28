"use client";

import { useEffect, useState, useCallback } from "react";

type Ad = {
  id: string;
  slot_name: string;
  image_url: string;
  link_url: string;
  label: string | null;
  active: boolean;
  created_at: string;
};

const SLOTS: { value: string; description: string }[] = [
  { value: "home_hero", description: "Home — ispod glavne hero vijesti" },
  { value: "home_category", description: "Home — ispod prve kategorije (Ispovijesti)" },
  { value: "article_middle", description: "Članak — u sredini teksta" },
  { value: "article_cta_below", description: "Članak — ispod 'Nastavi čitati' / 'Kraj priče'" },
  { value: "vignette", description: "Popup vignette (centriran, sa zatamnjenim bg, 30s prvi / 5min poslije)" },
];

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  width: "100%",
  fontFamily: "Arial, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
  color: "#333",
};

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    slot_name: "home_hero",
    link_url: "",
    label: "",
    file: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      if (data.ads) setAds(data.ads);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.file || !form.link_url.trim()) {
      setErr("Slika i link su obavezni.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", form.file);
      const upRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.url) {
        setErr(upData.error || "Upload neuspješan");
        return;
      }
      const createRes = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_name: form.slot_name,
          image_url: upData.url,
          link_url: form.link_url.trim(),
          label: form.label.trim() || null,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setErr(createData.error || "Kreiranje neuspješno");
        return;
      }
      setForm({ slot_name: form.slot_name, link_url: "", label: "", file: null });
      const fileInput = document.getElementById("ad-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(ad: Ad) {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ad.active }),
    });
    refresh();
  }

  async function remove(ad: Ad) {
    if (!confirm(`Obriši reklamu "${ad.label || ad.id.slice(0, 8)}"?`)) return;
    await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    refresh();
  }

  const adsBySlot = SLOTS.map((s) => ({
    ...s,
    ads: ads.filter((a) => a.slot_name === s.value),
  }));

  return (
    <div>
      {/* === Forma za novu reklamu === */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 16,
          background: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 14 }}>
          + Dodaj reklamu
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Pozicija (slot)</label>
            <select
              style={inputStyle}
              value={form.slot_name}
              onChange={(e) => setForm({ ...form, slot_name: e.target.value })}
            >
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value} — {s.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Slika (JPEG/PNG/WebP, max 10 MB)</label>
            <input
              id="ad-file-input"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files?.[0] || null })
              }
              style={{ ...inputStyle, padding: 4 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Link (gdje vodi klik)</label>
            <input
              type="url"
              required
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Label (interno ime, opciono)</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="npr. 'Nina BS - vti1'"
              style={inputStyle}
            />
          </div>
          {err && (
            <div
              style={{
                padding: 10,
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: 4,
                color: "#c00",
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 16px",
              background: submitting ? "#999" : "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Snimam..." : "Snimi reklamu"}
          </button>
        </div>
      </form>

      {/* === Lista postojećih po slot-u === */}
      {loading ? (
        <p>Učitavam...</p>
      ) : (
        adsBySlot.map((slot) => (
          <div
            key={slot.value}
            style={{
              marginBottom: 24,
              padding: 14,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <h3 style={{ fontSize: 15, margin: 0 }}>{slot.value}</h3>
              <span style={{ fontSize: 12, color: "#666" }}>
                {slot.description} — {slot.ads.length} aktivno
              </span>
            </div>
            {slot.ads.length === 0 ? (
              <p style={{ color: "#999", fontStyle: "italic", margin: 0 }}>
                Nema reklama u ovom slot-u.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 12,
                }}
              >
                {slot.ads.map((ad) => (
                  <div
                    key={ad.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      padding: 8,
                      opacity: ad.active ? 1 : 0.5,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ad.image_url}
                      alt=""
                      style={{
                        width: "100%",
                        maxHeight: 160,
                        objectFit: "contain",
                        background: "#f0f0f0",
                        borderRadius: 4,
                      }}
                    />
                    <div style={{ fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
                      <div style={{ fontWeight: 600 }}>
                        {ad.label || "(bez label-a)"}
                      </div>
                      <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1a73e8" }}
                      >
                        {ad.link_url.length > 50
                          ? ad.link_url.slice(0, 47) + "..."
                          : ad.link_url}
                      </a>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <button
                        onClick={() => toggleActive(ad)}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          background: ad.active ? "#fff" : "#1a73e8",
                          color: ad.active ? "#333" : "#fff",
                          border: "1px solid " + (ad.active ? "#ccc" : "#1a73e8"),
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {ad.active ? "Ugasi" : "Aktiviraj"}
                      </button>
                      <button
                        onClick={() => remove(ad)}
                        style={{
                          padding: "5px 10px",
                          background: "#fff",
                          color: "#c00",
                          border: "1px solid #fcc",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
