"""Replicate API wrapper za Flux image generation."""
import logging
import requests
from io import BytesIO
from typing import Tuple
import replicate
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

# Cijene po slici (USD)
IMAGE_COSTS = {
    "black-forest-labs/flux-schnell": 0.003,
    "black-forest-labs/flux-dev": 0.025,
    "black-forest-labs/flux-pro": 0.055,
}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=60),
)
def generate_image(prompt: str, model: str = None) -> Tuple[bytes, float]:
    """
    Generiše sliku preko Replicate-a.

    Returns:
        Tuple (image_bytes, cost_usd)
    """
    model = model or settings.IMAGE_MODEL
    logger.info(f"Generating image with {model}: {prompt[:100]}...")

    # Replicate client inicijalizacija (koristi REPLICATE_API_TOKEN env var automatski)
    import os
    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN

    output = replicate.run(
        model,
        input={
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "output_format": "jpg",
            "output_quality": 85,
            "num_inference_steps": 4 if "schnell" in model else 28,
            "disable_safety_checker": False,
        },
    )

    # Flux vraća FileOutput ili URL — handle both
    if hasattr(output, "read"):
        # FileOutput object
        image_bytes = output.read()
    elif isinstance(output, list) and len(output) > 0:
        # Lista URL-ova
        first = output[0]
        if hasattr(first, "read"):
            image_bytes = first.read()
        else:
            response = requests.get(str(first), timeout=30)
            response.raise_for_status()
            image_bytes = response.content
    elif isinstance(output, str):
        # URL string
        response = requests.get(output, timeout=30)
        response.raise_for_status()
        image_bytes = response.content
    else:
        raise ValueError(f"Unexpected Replicate output format: {type(output)}")

    cost = IMAGE_COSTS.get(model, 0.005)
    return image_bytes, cost
