"""Provjera originalnosti preko embedding similarity sa postojećim člancima."""
import logging
from typing import List, Tuple
from sqlalchemy import select

from app.models import Article
from app.services.database import get_db

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.88  # iznad ovog smatramo duplikatom


def check_originality(embedding: List[float], days_back: int = 90) -> Tuple[bool, float]:
    """
    Provjera da se članak ne poklapa previše sa ranijima.

    Returns:
        (is_original, max_similarity)
    """
    with get_db() as db:
        # pgvector cosine distance: <=> operator (0 = identično, 2 = suprotno)
        # Similarity = 1 - (cosine_distance / 2)
        from sqlalchemy import text, func
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(days=days_back)

        # Koristimo raw SQL jer pgvector ima specifične operatore
        query = text("""
            SELECT id, title, 1 - (embedding <=> CAST(:emb AS vector)) AS similarity
            FROM articles
            WHERE embedding IS NOT NULL
              AND created_at >= :cutoff
              AND status = 'published'
            ORDER BY embedding <=> CAST(:emb AS vector)
            LIMIT 5
        """)

        result = db.execute(
            query,
            {"emb": str(embedding), "cutoff": cutoff},
        ).fetchall()

        if not result:
            return True, 0.0

        max_sim = float(result[0].similarity)
        logger.info(f"Max similarity to existing: {max_sim:.3f} ({result[0].title[:60]})")

        return max_sim < SIMILARITY_THRESHOLD, max_sim
