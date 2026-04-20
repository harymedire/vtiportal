"""Facebook Graph API — auto-post na Page."""
import logging
import requests
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


def post_to_page(
    message: str,
    link: str,
    image_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Post na Facebook stranicu sa linkom i opciono slikom.

    Returns:
        FB post response (sa 'id' poljem) ili {'error': ...}
    """
    if not settings.FACEBOOK_AUTO_POST_ENABLED:
        logger.info("FB auto-post disabled, skipping")
        return {"skipped": True}

    if not settings.FACEBOOK_PAGE_ID or not settings.FACEBOOK_PAGE_ACCESS_TOKEN:
        logger.warning("FB credentials missing")
        return {"error": "missing_credentials"}

    # Koristi /photos endpoint ako ima slika, /feed ako nema
    if image_url:
        endpoint = f"https://graph.facebook.com/v19.0/{settings.FACEBOOK_PAGE_ID}/photos"
        payload = {
            "url": image_url,
            "caption": f"{message}\n\n{link}",
            "access_token": settings.FACEBOOK_PAGE_ACCESS_TOKEN,
        }
    else:
        endpoint = f"https://graph.facebook.com/v19.0/{settings.FACEBOOK_PAGE_ID}/feed"
        payload = {
            "message": message,
            "link": link,
            "access_token": settings.FACEBOOK_PAGE_ACCESS_TOKEN,
        }

    try:
        response = requests.post(endpoint, data=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info(f"FB post success: {data.get('id')}")
        return data
    except requests.HTTPError as e:
        logger.error(f"FB post failed: {e.response.text}")
        return {"error": str(e), "response": e.response.text if e.response else None}
    except Exception as e:
        logger.error(f"FB post exception: {e}")
        return {"error": str(e)}


def format_fb_message(article: dict) -> str:
    """Formatira caption za FB post sa naslovom i podnaslovom."""
    title = article["title"]
    subtitle = article.get("subtitle", "")

    message = f"📖 {title}"
    if subtitle:
        message += f"\n\n{subtitle}"
    message += "\n\n👇 Pročitajte cijelu priču na VTIportal.com"

    return message
