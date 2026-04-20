"""Cloudflare R2 upload (S3-kompatibilan API)."""
import logging
import boto3
from botocore.config import Config

from app.config import settings

logger = logging.getLogger(__name__)

_r2_client = None


def get_r2_client():
    """Lazy init R2 klijenta."""
    global _r2_client
    if _r2_client is None:
        _r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
    return _r2_client


def upload_image(image_bytes: bytes, key: str, content_type: str = "image/jpeg") -> str:
    """
    Upload slike na R2, vrati javni URL.

    Args:
        image_bytes: binary content
        key: path u bucket-u (npr. "articles/abc-123/hero.jpg")
        content_type: MIME type

    Returns:
        Javni URL slike
    """
    client = get_r2_client()

    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
        CacheControl="public, max-age=31536000",  # 1 godina cache
    )

    public_url = f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"
    logger.info(f"Uploaded to R2: {public_url}")
    return public_url
