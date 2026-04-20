"""Claude API wrapper za generisanje članaka i image prompta."""
import json
import logging
import re
from typing import Dict, Any
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings
from app.prompts import GLOBAL_SYSTEM_PROMPT, TEMPLATES

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _extract_json(raw_text: str) -> Dict[str, Any]:
    """Skida markdown fence i izvlači JSON objekat iz teksta."""
    text = raw_text.strip()

    # Skini ```json ... ``` ili ``` ... ``` fence
    fence_match = re.search(r"```(?:json)?\s*(.+?)\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Fallback: izvuci prvi {...} blok (greedy od prvog { do zadnjeg })
    if not text.startswith("{"):
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)

    return json.loads(text)

# Cijene Claude Sonnet (USD per token)
CLAUDE_INPUT_PRICE = 3.0 / 1_000_000
CLAUDE_OUTPUT_PRICE = 15.0 / 1_000_000


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=60),
    retry=retry_if_exception_type((anthropic.APIError, anthropic.RateLimitError)),
)
def generate_article(template_id: int, variables: Dict[str, str]) -> Dict[str, Any]:
    """
    Generiše članak na osnovu template-a i varijabli.

    Returns:
        dict sa poljima: title, subtitle, category, tags, pages[], moral_or_punchline
        + meta: cost_usd, input_tokens, output_tokens
    """
    template = TEMPLATES[template_id]
    user_prompt = template.user_prompt.format(**variables)

    logger.info(f"Generating article with template {template_id} ({template.name})")

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4000,
        system=GLOBAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = response.content[0].text

    try:
        article = _extract_json(raw_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude JSON: {raw_text[:500]}")
        raise ValueError(f"Invalid JSON from Claude: {e}")

    # Troškovi
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    cost = input_tokens * CLAUDE_INPUT_PRICE + output_tokens * CLAUDE_OUTPUT_PRICE

    article["_meta"] = {
        "cost_usd": round(cost, 4),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "model": settings.CLAUDE_MODEL,
    }

    return article


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=30),
    retry=retry_if_exception_type((anthropic.APIError, anthropic.RateLimitError)),
)
def generate_image_prompt(article: Dict[str, Any]) -> str:
    """
    Iz članka izvuci najjaču vizuelnu scenu i napravi engleski image prompt
    optimizovan za Flux.
    """
    system = """Ti si art director za news portal. Iz članka izvuci najjaču vizuelnu scenu i napravi CINEMATIC prompt za image generator.

PRAVILA:
- Output SAMO engleski prompt, bez objašnjenja
- Ne spominji imena stvarnih osoba
- Format: "[shot type] of [subject] [action/emotion] in [setting], [lighting], [mood], photorealistic, [camera lens]"
- Ciljaj na emotivnu, cinematic sliku koja podstiče klik
- Aspect ratio je 16:9
- IZBJEGAVAJ: nudity, violence, blood, weapons, children in distress, recognizable celebrity likenesses
"""

    user = f"""NASLOV: {article['title']}
PODNASLOV: {article.get('subtitle', '')}
PRVA STRANICA: {article['pages'][0]['text'][:400]}

Napravi image prompt."""

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=300,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    prompt = response.content[0].text.strip()
    # Dodaj sigurnosne keyword-e i quality boost
    prompt += ", dramatic lighting, shallow depth of field, professional photography, 85mm lens, cinematic color grading"

    return prompt


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def extract_overlay_text(title: str) -> str:
    """
    Iz naslova izvuci 2-4 riječi za žuti clickbait overlay tekst.
    """
    system = """Iz datog naslova izvuci 2-4 najjače riječi koje će stajati kao overlay tekst na slici.
PRAVILA:
- SAMO 2-4 riječi ukupno
- ALL CAPS
- Ako naslov ima "..." ili misteriju, zadrži je
- Fokusiraj se na emocionalnu kuku, ne na kontekst
- Output samo riječi, bez ikakvog objašnjenja

PRIMJERI:
Ulaz: "Svekrva je došla na ručak, a kad sam vidjela šta stavlja u tašnu — ostala sam bez riječi"
Izlaz: OSTALA SAM BEZ RIJEČI

Ulaz: "20 godina braka, a ono što sam našla u njegovom ormaru..."
Izlaz: U NJEGOVOM ORMARU...

Ulaz: "Komšinica koju smo osuđivali — istina me je rasplakala"
Izlaz: ISTINA ME RASPLAKALA"""

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=50,
        system=system,
        messages=[{"role": "user", "content": f"Ulaz: {title}\nIzlaz:"}],
    )

    text = response.content[0].text.strip().upper()
    # Safety: limit na 40 karaktera
    if len(text) > 40:
        text = text[:37] + "..."
    return text
