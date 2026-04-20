"""OpenAI embedding servis za deduplikaciju članaka."""
import logging
from typing import List
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
def get_embedding(text: str) -> List[float]:
    """
    Računa embedding vector (1536 dim za text-embedding-3-small).
    """
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text,
        encoding_format="float",
    )
    return response.data[0].embedding


def compute_article_embedding(article: dict) -> List[float]:
    """Embedding iz title + subtitle + moral."""
    text_parts = [
        article.get("title", ""),
        article.get("subtitle", ""),
        article.get("moral_or_punchline", ""),
    ]
    combined = ". ".join([p for p in text_parts if p])
    return get_embedding(combined)
