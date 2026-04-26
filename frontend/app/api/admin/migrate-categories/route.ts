import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const MIGRATIONS: Array<{ from: string; to: string }> = [
  { from: "Priče iz života", to: "Društvo" },
  { from: "Komšiluk", to: "Društvo" },
  { from: "Drame uz kafu", to: "Lifestyle" },
  { from: "Smijeh i suze", to: "Lifestyle" },
];

export async function POST() {
  if (!getAdminSessionFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const results: Array<{ from: string; to: string; updated: number }> = [];

  for (const m of MIGRATIONS) {
    const { data, error } = await supabase
      .from("articles")
      .update({ category: m.to })
      .eq("category", m.from)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: `Failed migrating ${m.from} → ${m.to}: ${error.message}` },
        { status: 500 }
      );
    }
    results.push({ from: m.from, to: m.to, updated: data?.length ?? 0 });
  }

  // Tally final state
  const { data: tally, error: tallyErr } = await supabase
    .from("articles")
    .select("category");
  if (tallyErr) {
    return NextResponse.json({ error: tallyErr.message }, { status: 500 });
  }
  const counts: Record<string, number> = {};
  for (const row of tally || []) {
    const k = (row as { category: string }).category;
    counts[k] = (counts[k] || 0) + 1;
  }

  // ISR — revalidiraj sve relevantne rute
  revalidatePath("/", "layout");
  revalidatePath("/komsiluk");
  revalidatePath("/lifestyle");
  revalidatePath("/ispovijesti");

  return NextResponse.json({ ok: true, results, counts });
}
