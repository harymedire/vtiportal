"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Pogrešan password");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: "Arial, sans-serif" }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          color: "#555",
          marginBottom: 6,
        }}
      >
        Password
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 15,
          border: "1px solid #ccc",
          borderRadius: 6,
          marginBottom: 14,
        }}
      />
      {error && (
        <div
          style={{
            color: "#d00",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          background: "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 15,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Provjera…" : "Uloguj se"}
      </button>
    </form>
  );
}
