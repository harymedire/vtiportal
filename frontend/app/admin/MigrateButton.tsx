"use client";

import { useState } from "react";

type Result = {
  ok?: boolean;
  results?: Array<{ from: string; to: string; updated: number }>;
  counts?: Record<string, number>;
  error?: string;
};

export default function MigrateButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleClick() {
    if (!confirm("Pokreni migraciju kategorija?\n\nPriče iz života + Komšiluk → Društvo\nDrame uz kafu + Smijeh i suze → Lifestyle")) {
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/migrate-categories", {
        method: "POST",
      });
      const data = (await res.json()) as Result;
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#fff",
          border: "1px solid #f59e0b",
          color: "#92400e",
          borderRadius: 6,
          fontSize: 13,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Migriram..." : "Pokreni migraciju kategorija (jednom)"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f4f4f4",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
