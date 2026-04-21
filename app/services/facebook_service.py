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
    Post na Facebook stranicu sa linkom.

    FB će sam scrape-ovati og:image iz linkovane stranice i prikazati je
    kao preview card. To je pouzdanije od direktnog /photos uploada.

    `image_url` je zadržan radi backward compatibility ali se ignoriše
    (FB preview će povući sliku kroz og:image tagove frontenda).

    Returns:
        FB post response (sa 'id' poljem) ili {'error': ...}
    """
    if not settings.FACEBOOK_AUTO_POST_ENABLED:
        logger.info("FB auto-post disabled, skipping")
        return {"skipped": True}

    if not settings.FACEBOOK_PAGE_ID or not settings.FACEBOOK_PAGE_ACCESS_TOKEN:
        logger.warning("FB credentials missing")
        return {"error": "missing_credentials"}

    endpoint = f"https://graph.facebook.com/v19.0/{settings.FACEBOOK_PAGE_ID}/feed"
    payload = {
        "message": f"{message}\n\n{link}",
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
        body = e.response.text if e.response is not None else ""
        logger.error(f"FB post failed ({e.response.status_code if e.response else '?'}): {body}")
        return {
            "error": str(e),
            "status": e.response.status_code if e.response is not None else None,
            "response": body,
        }
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
