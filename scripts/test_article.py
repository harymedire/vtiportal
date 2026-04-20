"""Manualni test — generiše jedan članak i upisuje ga u bazu.

Pokreni sa:
    python scripts/test_article.py

ili sa specifičnim template-om:
    python scripts/test_article.py --template 2
"""
import sys
import os
import argparse
import logging

# Dodaj root u path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from app.tasks import generate_single_article


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--template", type=int, default=1, help="Template ID (1-8)")
    args = parser.parse_args()

    print(f"\n🎬 Testing article generation with template {args.template}...\n")

    # Pokreni synchrono (ne preko Celery queue-a)
    result = generate_single_article.apply(
        args=[args.template, None],
    ).get()

    print("\n✅ Uspjeh!")
    print(f"   Article ID: {result['article_id']}")
    print(f"   Slug: {result['slug']}")
    print(f"   Title: {result['title']}")
    print(f"   Cost: ${result['cost_usd']:.4f}")


if __name__ == "__main__":
    main()
