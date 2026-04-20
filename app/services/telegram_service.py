"""Telegram Bot notifikacije (alerti, dnevni digest)."""
import logging
import requests
from typing import Optional

from app.config import settings, category_to_slug

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"


def send_message(text: str, parse_mode: str = "HTML", disable_preview: bool = True) -> bool:
    """Pošalji poruku na configurisan chat."""
    try:
        response = requests.post(
            f"{TELEGRAM_API_URL}/sendMessage",
            json={
                "chat_id": settings.TELEGRAM_CHAT_ID,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": disable_preview,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False


def send_alert(message: str, level: str = "warning") -> bool:
    """Alert notifikacija sa emoji prefiksom po levelu."""
    emoji_map = {
        "info": "ℹ️",
        "warning": "⚠️",
        "error": "🚨",
        "success": "✅",
    }
    emoji = emoji_map.get(level, "📢")
    return send_message(f"{emoji} <b>{level.upper()}</b>\n\n{message}")


def send_digest(articles: list, total_cost: Optional[float] = None) -> bool:
    """
    Dnevni digest sa listom članaka i linkovima.

    Args:
        articles: lista dict-a sa {title, slug, category, hero_image_url}
        total_cost: ukupna potrošnja za dan u USD
    """
    lines = [f"📰 <b>Dnevni digest — {len(articles)} novih članaka</b>\n"]

    for i, a in enumerate(articles, 1):
        url = f"{settings.PORTAL_BASE_URL.rstrip('/')}/{category_to_slug(a['category'])}/{a['slug']}"
        lines.append(f"{i}. <a href='{url}'>{a['title']}</a>")
        lines.append(f"   <i>{a['category']}</i>\n")

    if total_cost is not None:
        lines.append(f"\n💰 Potrošnja danas: <b>${total_cost:.2f}</b>")

    return send_message("\n".join(lines), disable_preview=True)
