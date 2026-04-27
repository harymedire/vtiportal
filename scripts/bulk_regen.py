"""Bulk bootstrap — generiše 12 članaka po kategoriji (36 ukupno).

Distribucija prati daily_quota ratio iz templates.py:

    Ispovijesti (12):  T1×8, T5×4
    Društvo     (12):  T2×6, T3×3, T6×3
    Lifestyle   (12):  T4×6, T7×2, T8×4

Pokreni:
    python scripts/bulk_regen.py              # sync, jedan po jedan
    python scripts/bulk_regen.py --async      # baca u Celery queue (treba worker)
    python scripts/bulk_regen.py --template 1 # samo testira jedan template

NAPOMENA:
- Ne dira postojeće članke. Samo dodaje nove.
- Ako neki članak padne na validaciji ili API erroru, nastavlja sa ostalim.
- Sync mod traje ~20-40s po članku → očekuj 12-25 min za svih 36.
"""
import sys
import os
import argparse
import logging
import time
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.WARNING,  # WARNING umjesto INFO da ne preplavi output
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from app.tasks import generate_single_article
from app.prompts import TEMPLATES


GENERATION_PLAN = [
    # (template_id, count)
    (1, 8),  # Ispovijest sa poukom        → Ispovijesti
    (5, 4),  # Pismo redakciji             → Ispovijesti
    (2, 6),  # Humoristična familijarna    → Društvo
    (3, 3),  # Komšijska                   → Društvo
    (6, 3),  # Generacijska drama          → Društvo
    (4, 6),  # SMS dijalog                 → Lifestyle
    (7, 2),  # Priča s putovanja           → Lifestyle
    (8, 4),  # Svadbena drama              → Lifestyle
]


def print_plan():
    print("\n🎬 Bulk regeneracija — plan:\n")
    by_category: dict[str, list[tuple[int, int]]] = {}
    for tid, count in GENERATION_PLAN:
        cat = TEMPLATES[tid].category
        by_category.setdefault(cat, []).append((tid, count))

    total = 0
    for cat, items in by_category.items():
        cat_total = sum(c for _, c in items)
        total += cat_total
        print(f"📂 {cat} ({cat_total}):")
        for tid, count in items:
            t = TEMPLATES[tid]
            print(f"   [T{tid}] {t.name} — {count}×")
    print(f"\n   Ukupno: {total} članaka\n")


def run_sync(plan: list[tuple[int, int]]) -> None:
    total = sum(c for _, c in plan)
    done = 0
    succeeded = 0
    failed = 0
    total_cost = Decimal("0")
    start = time.time()

    for template_id, count in plan:
        template = TEMPLATES[template_id]
        for _ in range(count):
            done += 1
            elapsed = time.time() - start
            avg = elapsed / done if done > 1 else 0
            eta = (total - done) * avg if avg else 0
            eta_str = f"~{int(eta // 60)}m{int(eta % 60)}s" if eta else "—"

            print(
                f"\n[{done}/{total}] T{template_id} ({template.name}) → "
                f"{template.category} | elapsed {int(elapsed)}s, eta {eta_str}"
            )
            try:
                result = generate_single_article.apply(
                    args=[template_id, None],
                ).get()
                cost = Decimal(str(result.get("cost_usd", 0)))
                total_cost += cost
                succeeded += 1
                print(f"   ✓ {result['slug']} (${cost:.4f})")
            except Exception as e:
                failed += 1
                print(f"   ✗ FAIL: {type(e).__name__}: {str(e)[:200]}")

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"✅ Završeno za {int(elapsed // 60)}m{int(elapsed % 60)}s")
    print(f"   Uspjelo: {succeeded}/{total}")
    print(f"   Palo:    {failed}/{total}")
    print(f"   Cost:    ${total_cost:.4f}")


def run_async(plan: list[tuple[int, int]]) -> None:
    total = sum(c for _, c in plan)
    queued = 0
    for template_id, count in plan:
        template = TEMPLATES[template_id]
        for _ in range(count):
            queued += 1
            generate_single_article.delay(template_id, None)
            print(f"[{queued}/{total}] queued T{template_id} ({template.name})")
    print(f"\n✅ {queued} taskova ubačeno u Celery queue.")
    print("   Provjeri progres preko Celery worker log-a ili Telegram alerta.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--async",
        dest="async_mode",
        action="store_true",
        help="Ubaci u Celery queue umjesto sync izvršavanja",
    )
    parser.add_argument(
        "--template",
        type=int,
        help="Generiši samo X članaka jednog template-a (za test)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1,
        help="(sa --template) Koliko članaka tog template-a generisati",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Preskoči potvrdu",
    )
    args = parser.parse_args()

    if args.template:
        if args.template not in TEMPLATES:
            print(f"❌ Template {args.template} ne postoji.")
            sys.exit(1)
        plan = [(args.template, args.count)]
    else:
        plan = GENERATION_PLAN

    print_plan() if not args.template else None

    if not args.yes:
        confirm = input("Pokreni generisanje? (yes/no): ")
        if confirm.lower() not in ("yes", "y", "da"):
            print("Otkazano.")
            return

    if args.async_mode:
        run_async(plan)
    else:
        run_sync(plan)


if __name__ == "__main__":
    main()
