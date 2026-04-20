"""Pillow image processing — dodavanje žutog clickbait overlay teksta."""
import logging
import os
import textwrap
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

FONT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "Anton-Regular.ttf")
FONT_PATH = os.path.abspath(FONT_PATH)


def add_clickbait_overlay(
    image_bytes: bytes,
    text: str,
    position: str = "top",
) -> bytes:
    """
    Dodaje žuti ALL CAPS tekst sa crnim stroke-om na sliku.

    Args:
        image_bytes: originalna slika
        text: 2-4 riječi (već ALL CAPS)
        position: "top" ili "bottom"

    Returns:
        JPEG bytes sa overlay-em
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    w, h = image.size

    # Dinamički font size zavisno od širine slike
    base_font_size = int(w / 14)  # ~90px za 1280w sliku

    # Wrap tekst ako je dug
    max_chars_per_line = 16
    lines = textwrap.wrap(text, width=max_chars_per_line) or [text]

    # Load font
    try:
        font = ImageFont.truetype(FONT_PATH, base_font_size)
    except OSError:
        logger.warning(f"Font not found at {FONT_PATH}, falling back to default")
        font = ImageFont.load_default()

    draw = ImageDraw.Draw(image)

    # Izračunaj ukupnu visinu teksta
    line_heights = []
    max_width = 0
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        line_h = bbox[3] - bbox[1]
        line_heights.append(line_h)
        max_width = max(max_width, line_w)

    line_spacing = int(base_font_size * 0.15)
    total_h = sum(line_heights) + line_spacing * (len(lines) - 1)

    # Pozicija
    padding = int(w * 0.04)
    if position == "top":
        y_start = padding
    else:  # bottom
        y_start = h - total_h - padding

    # Crtaj svaku liniju
    y = y_start
    stroke_width = max(4, int(base_font_size / 14))

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        x = padding  # left-aligned

        # Crni stroke (obrub za čitljivost)
        draw.text(
            (x, y),
            line,
            font=font,
            fill=(255, 215, 0),  # zlatno-žuta
            stroke_width=stroke_width,
            stroke_fill=(0, 0, 0),
        )

        y += line_heights[i] + line_spacing

    # Vrati JPEG bytes
    output = BytesIO()
    image.save(output, format="JPEG", quality=88, optimize=True)
    return output.getvalue()


def create_thumbnail(image_bytes: bytes, width: int = 400) -> bytes:
    """Pravi thumbnail iz originalne slike (za listing stranice)."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    w, h = image.size
    new_h = int(h * width / w)
    image.thumbnail((width, new_h), Image.LANCZOS)

    output = BytesIO()
    image.save(output, format="JPEG", quality=82, optimize=True)
    return output.getvalue()
