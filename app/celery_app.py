"""Celery aplikacija sa scheduling-om."""
from celery import Celery
from celery.schedules import crontab
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration

from app.config import settings

# Sentry integracija (ako je konfigurisan)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[CeleryIntegration()],
        traces_sample_rate=0.1,
    )

celery_app = Celery(
    "vtiportal",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone=settings.TIMEZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min hard limit po task-u
    task_soft_time_limit=240,  # 4 min soft limit
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

# ===== SCHEDULE =====
celery_app.conf.beat_schedule = {
    # Svaki dan u 00:00 pokreni dnevni batch
    "schedule-daily-articles": {
        "task": "app.tasks.schedule_daily_batch",
        "schedule": crontab(hour=0, minute=0),
    },
    # Svaki dan u 06:15 pošalji digest
    "morning-digest": {
        "task": "app.tasks.morning_digest",
        "schedule": crontab(hour=6, minute=15),
    },
    # Health check u 06:30
    "daily-health-check": {
        "task": "app.tasks.daily_health_check",
        "schedule": crontab(hour=6, minute=30),
    },
    # FB auto-post 5x dnevno (ako je enabled)
    "fb-auto-post-07": {
        "task": "app.tasks.fb_auto_post",
        "schedule": crontab(hour=7, minute=0),
    },
    "fb-auto-post-10": {
        "task": "app.tasks.fb_auto_post",
        "schedule": crontab(hour=10, minute=0),
    },
    "fb-auto-post-13": {
        "task": "app.tasks.fb_auto_post",
        "schedule": crontab(hour=13, minute=0),
    },
    "fb-auto-post-16": {
        "task": "app.tasks.fb_auto_post",
        "schedule": crontab(hour=16, minute=0),
    },
    "fb-auto-post-19": {
        "task": "app.tasks.fb_auto_post",
        "schedule": crontab(hour=19, minute=0),
    },
}
