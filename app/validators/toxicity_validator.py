"""Jednostavna toxicity provjera preko keyword-a.

Za produkcijsku upotrebu može se dodati Perspective API ili Detoxify model,
ali za naš use-case (drama priče, Claude ih piše prateći sistem prompt) —
keyword-based je dovoljno kao safety net.
"""
import re
from typing import Dict, Any, Tuple, List

# Lista keyword-a koji indiciraju problematičan sadržaj
RED_FLAGS = [
    # Nasilje
    r"\bubij(a|i|ti)\b",
    r"\bsamoubistv",
    r"\bsamopovredj",
    r"\bnasilje nad djec",
    # Diskriminacija
    r"\bprljav(i|og) ciga",
    r"\bbalija\b",
    r"\bustaš(a|e|ka)\b(?! knjig)",  # dozvoli u istorijskom kontekstu
    r"\bčetnik(a|e)\b(?! knjig)",
    # Eksplicitno seksualno
    r"\bseksualn(i|o) odnos(a|i)? sa djet",
    r"\bpedofili",
    # Teške droge
    r"\bhero(i|in)",
    r"\bkokain(a|om)",
    r"\bkristal met",
]


def check_toxicity(article: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Vraća (is_safe, flagged_patterns).
    """
    full_text = " ".join([
        article.get("title", ""),
        article.get("subtitle", ""),
        article.get("moral_or_punchline", ""),
    ] + [p.get("text", "") for p in article.get("pages", [])]).lower()

    flagged = []
    for pattern in RED_FLAGS:
        if re.search(pattern, full_text, re.IGNORECASE):
            flagged.append(pattern)

    return len(flagged) == 0, flagged
