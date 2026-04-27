"""Centralna konfiguracija iz environment varijabli."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ===== LLM =====
    ANTHROPIC_API_KEY: str
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    OPENAI_API_KEY: str
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    REPLICATE_API_TOKEN: str
    IMAGE_MODEL: str = "black-forest-labs/flux-schnell"

    # ===== Baza =====
    DATABASE_URL: str

    # ===== Redis (Celery) =====
    REDIS_URL: str = "redis://localhost:6379/0"

    # ===== Cloudflare R2 =====
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    R2_PUBLIC_URL: str

    # ===== Telegram =====
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_CHAT_ID: str

    # ===== Facebook (opciono) =====
    FACEBOOK_PAGE_ID: Optional[str] = None
    FACEBOOK_PAGE_ACCESS_TOKEN: Optional[str] = None
    # Interni FB auto-post iskl. — koristi Zapier preko RSS feeda
    FACEBOOK_AUTO_POST_ENABLED: bool = False

    # ===== Portal =====
    PORTAL_BASE_URL: str = "http://localhost:3000"
    REVALIDATE_SECRET: str = "change-me"
    ARTICLES_PER_DAY: int = 20
    TIMEZONE: str = "Europe/Sarajevo"

    # ===== Monitoring =====
    SENTRY_DSN: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


# ===== Kategorije: mapa ime → URL slug =====
# Koristi se za generisanje ispravnih URL-ova (telegram, FB, revalidate path).
# Mora biti usklađeno sa frontend/lib/categories.ts.
CATEGORY_SLUGS = {
    "Ispovijesti": "ispovijesti",
    "Društvo": "drustvo",
    "Lifestyle": "lifestyle",
    # Legacy: jedan stari FB ad članak ostaje na /komsiluk/<slug>
    "Komšiluk": "komsiluk",
    # Stara DB display imena → mapiranje na nove slug-ove (za redove koji još nisu migrirani)
    "Priče iz života": "drustvo",
    "Drame uz kafu": "lifestyle",
    "Smijeh i suze": "lifestyle",
}


def category_to_slug(category: str) -> str:
    """Pretvori ime kategorije u URL slug (fallback: slugify originala)."""
    if category in CATEGORY_SLUGS:
        return CATEGORY_SLUGS[category]
    from slugify import slugify
    return slugify(category)
