"""Celery taskovi — glavni orkestrator cijelog pipeline-a."""
import logging
import uuid
from datetime import datetime, timedelta, date
from decimal import Decimal
from slugify import slugify

from app.celery_app import celery_app
from app.config import settings, category_to_slug
from app.models import Article, GenerationJob, ApiUsage
from app.services.database import get_db
from app.services.claude_service import (
    generate_article,
    generate_image_prompt,
    extract_overlay_text,
)
from app.services.replicate_service import generate_image
from app.services.image_processor import add_clickbait_overlay, create_thumbnail
from app.services.storage_service import upload_image
from app.services.embedding_service import compute_article_embedding
from app.services.telegram_service import send_alert, send_digest
from app.services.facebook_service import post_to_page, format_fb_message
from app.validators import validate_content, check_originality, check_toxicity
from app.variables import pick_variables
from app.prompts import TEMPLATES

logger = logging.getLogger(__name__)


# ================================================================
# TASK: Generisanje jednog članka (end-to-end)
# ================================================================
@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def generate_single_article(self, template_id: int, job_id: str = None) -> dict:
    """
    Glavni task. 8 koraka:
    1. Pick varijable
    2. Claude → članak
    3. Validate content
    4. Claude → image prompt
    5. Replicate → slika
    6. Pillow → overlay tekst
    7. R2 → upload
    8. DB → upis + embedding + originality
    """
    logger.info(f"Starting article generation: template_id={template_id}")

    # Update job status
    if job_id:
        with get_db() as db:
            job = db.query(GenerationJob).filter_by(id=uuid.UUID(job_id)).first()
            if job:
                job.status = "running"
                job.started_at = datetime.utcnow()

    total_cost = Decimal("0")

    # ===== 1. Pick varijable =====
    variables = pick_variables(template_id)
    logger.info(f"Variables: {variables}")

    # ===== 2. Claude → članak =====
    article = generate_article(template_id, variables)
    meta = article.pop("_meta")
    total_cost += Decimal(str(meta["cost_usd"]))

    # ===== 3. Validate content =====
    valid, errors = validate_content(article)
    if not valid:
        logger.error(f"Content validation failed: {errors}")
        raise ValueError(f"Content invalid: {errors}")

    safe, flagged = check_toxicity(article)
    if not safe:
        logger.error(f"Toxicity check failed: {flagged}")
        raise ValueError(f"Toxicity: {flagged}")

    # Embedding + originality
    embedding = compute_article_embedding(article)
    original, max_sim = check_originality(embedding)
    if not original:
        logger.warning(f"Duplicate detected (sim={max_sim:.3f}), skipping")
        raise ValueError(f"Duplicate article, similarity {max_sim:.3f}")

    # ===== 4. Image prompt =====
    image_prompt = generate_image_prompt(article)
    logger.info(f"Image prompt: {image_prompt}")

    # ===== 5. Generisanje slike =====
    image_bytes, image_cost = generate_image(image_prompt)
    total_cost += Decimal(str(image_cost))

    # ===== 6. Overlay tekst =====
    overlay_text = extract_overlay_text(article["title"])
    logger.info(f"Overlay text: {overlay_text}")
    final_image = add_clickbait_overlay(image_bytes, overlay_text)
    thumb_image = create_thumbnail(final_image)

    # ===== 7. Upload =====
    article_id = uuid.uuid4()
    slug = slugify(article["title"])[:80]

    hero_key = f"articles/{article_id}/hero.jpg"
    thumb_key = f"articles/{article_id}/thumb.jpg"
    hero_url = upload_image(final_image, hero_key)
    thumb_url = upload_image(thumb_image, thumb_key)

    # ===== 8. DB upis =====
    with get_db() as db:
        # Provjeri duplikat slug (rijetko, ali desi se)
        existing = db.query(Article).filter_by(slug=slug).first()
        if existing:
            slug = f"{slug}-{article_id.hex[:6]}"

        new_article = Article(
            id=article_id,
            title=article["title"],
            slug=slug,
            subtitle=article.get("subtitle"),
            category=article["category"],
            tags=article.get("tags", []),
            pages_json=article["pages"],
            moral=article.get("moral_or_punchline"),
            hero_image_url=hero_url,
            thumbnail_url=thumb_url,
            status="published",
            template_id=template_id,
            variables_used=variables,
            generation_cost_usd=total_cost,
            embedding=embedding,
            published_at=datetime.utcnow(),
        )
        db.add(new_article)
        db.flush()  # Forsiraj INSERT u articles prije api_usage (FK constraint)

        # Usage tracking
        db.add(ApiUsage(
            date=date.today(),
            service="claude",
            operation="article_generation",
            tokens_or_units=meta["input_tokens"] + meta["output_tokens"],
            cost_usd=Decimal(str(meta["cost_usd"])),
            article_id=article_id,
        ))
        db.add(ApiUsage(
            date=date.today(),
            service="replicate",
            operation="image_generation",
            tokens_or_units=1,
            cost_usd=Decimal(str(image_cost)),
            article_id=article_id,
        ))

        # Update job
        if job_id:
            job = db.query(GenerationJob).filter_by(id=uuid.UUID(job_id)).first()
            if job:
                job.status = "success"
                job.article_id = article_id
                job.completed_at = datetime.utcnow()

    # ===== Trigger ISR revalidation =====
    try:
        import requests
        cat_slug = category_to_slug(article["category"])
        # Revalidate homepage, kategoriju i novi članak
        for path in ["/", f"/{cat_slug}", f"/{cat_slug}/{slug}"]:
            requests.post(
                f"{settings.PORTAL_BASE_URL.rstrip('/')}/api/revalidate",
                params={"secret": settings.REVALIDATE_SECRET, "path": path},
                timeout=10,
            )
    except Exception as e:
        logger.warning(f"ISR revalidation failed: {e}")

    logger.info(f"Article published: {article_id} — {article['title']}")
    return {
        "article_id": str(article_id),
        "slug": slug,
        "title": article["title"],
        "cost_usd": float(total_cost),
    }


# ================================================================
# TASK: Dnevni batch scheduling (runs at 00:00)
# ================================================================
@celery_app.task
def schedule_daily_batch():
    """
    Enqueue-a 20 job-ova, jedan svakih 18 min između 00:00 i 06:00.
    """
    logger.info("Scheduling daily batch of 20 articles")

    # Izračunaj template distribuciju na osnovu daily_quota
    template_queue = []
    for template_id, spec in TEMPLATES.items():
        template_queue.extend([template_id] * spec.daily_quota)

    # Shuffle da ne budu iste kategorije zaredom
    import random
    random.shuffle(template_queue)

    assert len(template_queue) == settings.ARTICLES_PER_DAY

    # Raspodijeli na 18-min intervale
    now = datetime.utcnow()
    interval_minutes = (6 * 60) // settings.ARTICLES_PER_DAY  # 18 min

    with get_db() as db:
        for i, template_id in enumerate(template_queue):
            scheduled_for = now + timedelta(minutes=i * interval_minutes)

            job = GenerationJob(
                scheduled_for=scheduled_for,
                template_id=template_id,
                status="pending",
            )
            db.add(job)
            db.flush()

            # Enqueue sa eta
            generate_single_article.apply_async(
                args=[template_id, str(job.id)],
                eta=scheduled_for,
            )

    send_alert(f"Zakazano {settings.ARTICLES_PER_DAY} članaka za danas", level="info")
    return {"scheduled": settings.ARTICLES_PER_DAY}


# ================================================================
# TASK: Jutarnji digest (06:15)
# ================================================================
@celery_app.task
def morning_digest():
    """Šalje Telegram digest sa svim današnjim člancima."""
    from sqlalchemy import func as sqlfunc

    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    # Materijalizuj sve unutar jedne session-e (da izbjegnemo detached objekte)
    with get_db() as db:
        articles = db.query(Article).filter(
            Article.published_at >= today_start,
            Article.status == "published",
        ).order_by(Article.published_at).all()

        article_dicts = [
            {
                "title": a.title,
                "slug": a.slug,
                "category": a.category,
                "hero_image_url": a.hero_image_url,
            }
            for a in articles
        ]

        total = db.query(sqlfunc.sum(ApiUsage.cost_usd)).filter(
            ApiUsage.date == today
        ).scalar() or Decimal("0")

    send_digest(article_dicts, total_cost=float(total))
    return {"articles": len(article_dicts), "total_cost": float(total)}


# ================================================================
# TASK: Health check (06:30)
# ================================================================
@celery_app.task
def daily_health_check():
    """Provjerava jesu li sva generisanja prošla i šalje alert ako nisu."""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    with get_db() as db:
        published_count = db.query(Article).filter(
            Article.published_at >= today_start,
            Article.status == "published",
        ).count()

        failed_count = db.query(GenerationJob).filter(
            GenerationJob.scheduled_for >= today_start,
            GenerationJob.status == "failed",
        ).count()

    if published_count < settings.ARTICLES_PER_DAY:
        send_alert(
            f"Objavljeno samo {published_count}/{settings.ARTICLES_PER_DAY} članaka. "
            f"Failed: {failed_count}",
            level="warning",
        )
    else:
        send_alert(
            f"Sve OK: {published_count}/{settings.ARTICLES_PER_DAY} objavljeno",
            level="success",
        )

    return {"published": published_count, "failed": failed_count}


# ================================================================
# TASK: FB auto-post (5x dnevno)
# ================================================================
@celery_app.task
def fb_auto_post():
    """Postavi sljedeći najrelevantniji članak na FB stranicu."""
    if not settings.FACEBOOK_AUTO_POST_ENABLED:
        return {"skipped": "disabled"}

    cutoff = datetime.utcnow() - timedelta(days=2)

    with get_db() as db:
        # Najbolji kandidat: objavljen u zadnja 2 dana, još nije na FB-u
        candidate = db.query(Article).filter(
            Article.status == "published",
            Article.published_at >= cutoff,
            Article.fb_posted_at.is_(None),
        ).order_by(Article.published_at.desc()).first()

        if not candidate:
            logger.info("No candidates for FB posting")
            return {"skipped": "no_candidates"}

        url = f"{settings.PORTAL_BASE_URL.rstrip('/')}/{category_to_slug(candidate.category)}/{candidate.slug}"
        message = format_fb_message({
            "title": candidate.title,
            "subtitle": candidate.subtitle or "",
        })

        result = post_to_page(
            message=message,
            link=url,
            image_url=candidate.hero_image_url,
        )

        if result.get("id"):
            candidate.fb_posted_at = datetime.utcnow()
            candidate.fb_post_id = result["id"]

    return result
