"""Briše sve članke OSIM 2 zaštićena (FB ad-ovi koji ne smiju da nestanu).

Pokreni:
    python scripts/cleanup_for_regen.py             # dry-run, samo prikaže šta bi obrisao
    python scripts/cleanup_for_regen.py --execute   # stvarno briše (sa potvrdom)

Zaštićeni slug-ovi (NE diraju se):
  - srbija-u-soku-bracni-par-iz-novog-sada-...-f500f2  (FB ad, kategorija Komšiluk)
  - cijeli-balkan-u-suzama-sin-je-godinama-mrzio-...   (FB ad, kategorija Ispovijesti)

Briše se iz tabela (redoslijed zbog FK):
  1. generation_jobs (FK article_id)
  2. api_usage       (FK article_id)
  3. articles
"""
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.models import Article, GenerationJob, ApiUsage
from app.services.database import get_db


PROTECTED_SLUGS = {
    "srbija-u-soku-bracni-par-iz-novog-sada-zivio-dvostruki-zivot-7-godina-komsije-ni-f500f2",
    "cijeli-balkan-u-suzama-sin-je-godinama-mrzio-svoju-unakazenu-majku-i-pozelio-joj",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Stvarno obriši (default: dry-run)",
    )
    args = parser.parse_args()

    with get_db() as db:
        protected = db.query(Article).filter(Article.slug.in_(PROTECTED_SLUGS)).all()
        print(f"\n🔒 Zaštićeni članci ({len(protected)}):")
        for a in protected:
            print(f"   - [{a.category}] {a.slug}")
            print(f"     {a.title[:80]}")

        missing = PROTECTED_SLUGS - {a.slug for a in protected}
        if missing:
            print(f"\n⚠️  UPOZORENJE: ne mogu da nađem ove zaštićene slug-ove u DB-u:")
            for s in missing:
                print(f"   - {s}")
            print("   Provjeri tačne slug-ove prije pokretanja sa --execute.")
            if args.execute:
                print("   Otkazujem zbog sigurnosti.")
                return

        to_delete = db.query(Article).filter(~Article.slug.in_(PROTECTED_SLUGS)).all()
        print(f"\n🗑️  Članci za brisanje ({len(to_delete)}):")
        for a in to_delete[:20]:
            print(f"   - [{a.category}] {a.slug}")
        if len(to_delete) > 20:
            print(f"   ... + još {len(to_delete) - 20}")

        if not to_delete:
            print("\n✓ Nema članaka za brisanje.")
            return

        if not args.execute:
            print("\n💡 Dry-run mode. Pokreni sa --execute da stvarno obrišeš.")
            return

        confirm = input(f"\n⚠️  Stvarno obrisati {len(to_delete)} članaka? (otkucaj 'OBRISI' da potvrdiš): ")
        if confirm != "OBRISI":
            print("Otkazano.")
            return

        delete_ids = [a.id for a in to_delete]

        jobs_deleted = (
            db.query(GenerationJob)
            .filter(GenerationJob.article_id.in_(delete_ids))
            .delete(synchronize_session=False)
        )
        api_deleted = (
            db.query(ApiUsage)
            .filter(ApiUsage.article_id.in_(delete_ids))
            .delete(synchronize_session=False)
        )
        articles_deleted = (
            db.query(Article)
            .filter(Article.id.in_(delete_ids))
            .delete(synchronize_session=False)
        )

        print(f"\n✅ Obrisano:")
        print(f"   - {articles_deleted} članaka")
        print(f"   - {jobs_deleted} generation_jobs zapisa")
        print(f"   - {api_deleted} api_usage zapisa")


if __name__ == "__main__":
    main()
