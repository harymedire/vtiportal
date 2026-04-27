"""Validacija strukture članka — dužine, obavezna polja, broj stranica."""
import re
from typing import Dict, Any, List, Tuple


def validate_content(article: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Provjerava strukturu članka.

    Returns:
        (valid, errors) — valid je False ako ima errora
    """
    errors = []

    # Obavezna polja
    required_fields = ["title", "subtitle", "category", "tags", "pages", "moral_or_punchline"]
    for field in required_fields:
        if not article.get(field):
            errors.append(f"Nedostaje polje: {field}")

    # Pages
    pages = article.get("pages", [])
    if len(pages) < 4 or len(pages) > 12:
        errors.append(f"Broj stranica mora biti 4-12, ima {len(pages)}")

    # Svaka stranica mora imati text
    for i, page in enumerate(pages, 1):
        if not page.get("text"):
            errors.append(f"Stranica {i} nema text")
            continue

        word_count = len(page["text"].split())
        if word_count < 250:
            errors.append(f"Stranica {i} prekratka: {word_count} riječi (min 250)")
        elif word_count > 420:
            errors.append(f"Stranica {i} preduga: {word_count} riječi (max 420)")

        # Stranice 1-4 moraju imati hook (osim poslednja)
        if i < len(pages) and not page.get("hook"):
            errors.append(f"Stranica {i} nema hook")

    # Naslov
    title = article.get("title", "")
    if len(title) < 40 or len(title) > 140:
        errors.append(f"Naslov mora biti 40-140 karaktera, ima {len(title)}")

    # Tags
    tags = article.get("tags", [])
    if not isinstance(tags, list) or len(tags) < 2 or len(tags) > 8:
        errors.append(f"Tags mora biti lista 2-8 stringova, ima {len(tags)}")

    # Moral / punchline
    moral = article.get("moral_or_punchline", "")
    if len(moral) < 20:
        errors.append(f"Pouka/punchline prekratka: {len(moral)} karaktera")

    # Blacklist imena poznatih ličnosti (proširi po potrebi)
    blacklist = [
        "milanović", "plenković", "dodik", "vučić", "dačić", "komšić",
        "rihanna", "beyoncé", "drake",
        # dodaj više po potrebi
    ]
    full_text = " ".join([title, article.get("subtitle", ""), moral] +
                          [p.get("text", "") for p in pages]).lower()
    for name in blacklist:
        if name.lower() in full_text:
            errors.append(f"Detektovano blacklisted ime: {name}")

    return len(errors) == 0, errors
