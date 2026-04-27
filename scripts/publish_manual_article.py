"""Publish a manually-written article.

Uses same image generation + R2 upload pipeline kao AI-generisani članci,
ali sa ručno-napisanim sadržajem. Pokreni:

    python scripts/publish_manual_article.py

Ili kao pre-deploy komandu u Railway-u:

    python -u scripts/publish_manual_article.py

Dvije opcije za sadržaj:
- `pages`: lista stranica (ručno podijeljen tekst + hookovi)
- `body`:  jedan dugačak tekst, skripta automatski paginira na ~280-380
           riječi po strani po granicama paragrafa
"""
import sys
import os
import re
import logging
import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any
from slugify import slugify

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from app.config import settings, category_to_slug
from app.models import Article, ApiUsage
from app.services.database import get_db
from app.services.claude_service import generate_image_prompt
from app.services.replicate_service import generate_image
from app.services.image_processor import create_thumbnail
from app.services.storage_service import upload_image
from app.services.embedding_service import compute_article_embedding


ARTICLE = {
    "title": "Srbija u šoku: Bračni par iz Novog Sada živio dvostruki život 7 godina — komšije nisu mogle da vjeruju",
    "subtitle": "Priča koja je uzdrmala mirno novosadsko naselje i o kojoj svi pričaju. Što više detalja izlazi na vidjelo — to je slika mračnija.",
    "category": "Komšiluk",
    "tags": ["dvostruki život", "Novi Sad", "porodica", "tajna", "komšiluk"],
    "moral_or_punchline": "Najsavršenije fasade često kriju najmračnije tajne — ali cijenu laži uvijek plate oni koji nisu birali da lažu.",
    "pages": [
        {
            "page": 1,
            "text": (
                "Stanari jednog stambenog naselja u Novom Sadu danima ne mogu da dođu sebi. Bračni par koji je "
                "godinama važio za uzor komšiluku — ljubazni, tihi, uvijek nasmijani — krio je tajnu koja je na "
                "kraju isplivala na najneočekivaniji način. A kada je isplivala, niko nije bio spreman na ono što "
                "je čekalo ispod površine.\n\n"
                "Marija (41) i Dragan (44), kako ih komšije zovu, uselili su se u zgradu prije skoro decenije. On "
                "inženjer, ona zaposlena u državnoj firmi. Dvoje djece, uredno plaćene račune, vikend odlasci "
                "kolima koja su se mijenjala svakih nekoliko godina.\n\n"
                "\"Nikad glasniji razgovor, nikad svađa. Uvijek su se pozdravljali, uvijek pitali kako si\", priča "
                "jedna komšinica koja nije željela da se imenuje. \"Da mi je neko rekao šta se krije iza tih "
                "vrata — nikad ne bih povjerovala.\"\n\n"
                "Ali upravo ta savršenost, kažu oni koji su ih poznavali duže, bila je prva stvar koja je trebala "
                "da upali alarm.\n\n"
                "\"Niko nije toliko savršen\", kaže Vesna, starica s trećeg sprata koja ih poznaje od prvog dana. "
                "\"Jednom sam ih gledala kroz prozor kako sjede za stolom. Nisu razgovarali. Nisu se ni gledali. "
                "Samo su jeli. Kao dva stranca u restoranu.\""
            ),
            "hook": "A onda je jedan pogrešno dostavljen paket promijenio sve.",
        },
        {
            "page": 2,
            "text": (
                "Sve je počelo jedne kišne novembarske večeri kada je dostavljač pogrešno ostavio paket pred "
                "Vesninim vratima. Ime na paketu bilo je Draganovo, ali adresa — bila je iz Beograda. Ulica u "
                "Zemunu. Stan broj 4.\n\n"
                "Vesna, radoznala kao i svaka dobra komšinica, nije odmah predala paket. Sačekala je jutro. A "
                "onda je počela da pita.\n\n"
                "Ispostavilo se da Dragan godinama nije samo putovao \"na teren\" — on je imao drugi stan, drugi "
                "broj telefona i, kako se kasnije saznalo, drugo ime na računima. Firme registrovane na "
                "prijatelje, poslovne partnere, čak i na jednog čovjeka koji je, prema javnim evidencijama, umro "
                "2019. godine.\n\n"
                "\"Kad sam to čula, sjela sam na stolicu i nisam mogla da ustanem pola sata\", kaže Vesna. "
                "\"Čovjek kojeg sam svaki dan pozdravljala na stepeništu — nije bio to ko sam mislila da jeste.\""
            ),
            "hook": "Ali šta je Marija znala o svemu ovome?",
        },
        {
            "page": 3,
            "text": (
                "Ovo je pitanje koje dijeli čitavo naselje na dva tabora.\n\n"
                "Oni koji je brane kažu da je Marija bila zatočenica vlastitog braka — žena koja je znala da "
                "nešto nije u redu, ali se bojala da postavi pravo pitanje. \"Viđala sam je kako plače u autu\", "
                "priča mlađa komšinica. \"Parkira, ugasi motor, i samo sjedi. Nekad i po sat vremena. A onda "
                "izađe, nasmije se i kaže 'dobar dan' kao da je sve u redu.\"\n\n"
                "Ali drugi imaju drugačiju verziju.\n\n"
                "Prema izvoru koji je direktno upoznat sa situacijom, a koji nije želio da se imenuje, Marija je "
                "bila više od pasivnog posmatrača. \"Ona je potpisivala dokumenta. Bila je svjesna bar dijela "
                "onoga što se dešava. Pitanje je samo koliko.\"\n\n"
                "Skupi kaputi. Nova kuhinja vrijedna nekoliko hiljada eura. Djeca na privatnoj školi čija je "
                "godišnja školarina viša od prosječne novosadske plate. Odakle novac? Na ovo pitanje Marija "
                "nikada nije odgovorila. Barem ne javno."
            ),
            "hook": "A onda je došlo jutro kada je Dragan jednostavno — nestao.",
        },
        {
            "page": 4,
            "text": (
                "Sve se raspalo jedne obične srijede ujutro. Dragan nije došao kući.\n\n"
                "Telefon isključen. Auto nestao. Torba s dokumentima — nestala iz ormara, što je Marija otkrila "
                "tek kada je policija stigla i počela da pita gdje su lične isprave.\n\n"
                "Marija je, prema riječima komšija, samo izašla na balkon, pogledala u daljinu i tiho ušla "
                "nazad. Nije plakala. Nije vikala. Nije zvala prijatelje.\n\n"
                "\"To me je najviše uzdrmalo\", kaže stanar s drugog sprata. \"Normalna žena bi bila histerična. "
                "Ona je bila — mirna. Previše mirna.\"\n\n"
                "Policija je stigla isti dan popodne. Ostali su dugo. Izašli su bez lisica, bez kesa s dokazima, "
                "bez izjave za medije. Zvanična potvrda nikada nije stigla u javnost.\n\n"
                "Prema neslužbenim informacijama do kojih smo došli, istraga je otvorena — ali pod oznakom koja "
                "onemogućava javni uvid u spis."
            ),
            "hook": "Adresa u Zemunu krila je još jedno iznenađenje...",
        },
        {
            "page": 5,
            "text": (
                "Ono što je počelo kao priča o poslovnoj prevari, brzo je dobilo novu, mnogo ličniju dimenziju.\n\n"
                "Stan u Zemunu, onaj čija je adresa bila na paketu, nije bio poslovni prostor. Bio je dom. "
                "Uređen, topao, sa fotografijama na zidovima — fotografijama na kojima je Dragan, ali pored "
                "njega stoji žena koju niko u Novom Sadu nije poznavao.\n\n"
                "I dijete. Djevojčica, stara otprilike pet godina.\n\n"
                "\"Kad sam čula za to dijete, nisam mogla da spavam tri noći\", kaže Vesna. \"Jer to znači da je "
                "sve — baš sve — bila laž. Od prvog do posljednjeg dana.\"\n\n"
                "Žena iz Zemuna, prema informacijama koje kruže, nije znala da Dragan ima porodicu u Novom Sadu. "
                "Ili je, kako neki tvrde, znala — i pristala.\n\n"
                "Ni ona se nije oglašavala."
            ),
            "hook": "Ali ko zaista plaća cijenu ove dvostruke obmane?",
        },
        {
            "page": 6,
            "text": (
                "Najteži dio ove priče nisu odrasli koji su birali svoju sudbinu.\n\n"
                "Najteži dio su dvoje djece koja su jednog jutra otišla u školu, a kada su se vratila — otac "
                "više nije bio tu. I nikad se nije vratio.\n\n"
                "\"Viđam ih na stepeništu\", kaže komšinica. \"Stariji dječak više ne gleda u oči. Mlađa "
                "djevojčica i dalje pita gdje je tata. A Marija svaki put kaže isto — 'na putu je, doći će'.\"\n\n"
                "Hoće li doći — niko ne zna. Ili možda znaju, ali ne govore."
            ),
            "hook": "Šta se stvarno desilo te srijede ujutro?",
        },
        {
            "page": 7,
            "text": (
                "Detalji i dalje nisu u potpunosti poznati javnosti. Dio komšija vjeruje da je Dragan pobjegao "
                "od dugova koji su postali neodrživi. Drugi šapuću o ljudima kojima je dugovao novac — i koji "
                "nisu vrsta ljudi kojima se duguje bez posljedica.\n\n"
                "Treći, najtišim glasom, govore o tome da Dragan možda nije pobjegao svojom voljom.\n\n"
                "Marija se nije oglašavala. Njen profil na društvenim mrežama obrisan je iste sedmice. Broj "
                "telefona promijenjen. Djeca premještena u drugu školu.\n\n"
                "A stan — onaj isti stan u koji su se uselili puni nade prije skoro decenije — stoji prazan. "
                "Roletne spuštene. Sandučić pun pisama koja niko ne uzima.\n\n"
                "Jedino što je sigurno — u tom stanu više niko ne živi. A istina o tome šta se stvarno dešavalo "
                "iza tih vrata možda nikada neće izaći na vidjelo.\n\n"
                "Pratite nas — izvor blizak istrazi najavio je da će novi detalji biti poznati uskoro. Priča se "
                "nastavlja."
            ),
            "resolution_type": "katarza",
        },
    ],
}


def paginate_body(
    body: str,
    target_words: int = 330,
    min_words: int = 280,
    max_words: int = 380,
) -> List[Dict[str, Any]]:
    """Razbi jedan dugačak tekst na stranice po granicama paragrafa.

    Ciljani word count je ~330 po stranici, sa hard min 280 / max 380
    (uskladjeno sa content_validator pragovima 250-420).
    """
    paragraphs = [p.strip() for p in re.split(r"\n\n+", body.strip()) if p.strip()]
    if not paragraphs:
        return []

    pages_text: List[str] = []
    cur: List[str] = []
    cur_words = 0

    for para in paragraphs:
        para_words = len(para.split())

        if cur and cur_words + para_words > max_words:
            pages_text.append("\n\n".join(cur))
            cur = [para]
            cur_words = para_words
            continue

        cur.append(para)
        cur_words += para_words

        if cur_words >= target_words:
            pages_text.append("\n\n".join(cur))
            cur = []
            cur_words = 0

    if cur:
        if cur_words < min_words and pages_text:
            pages_text[-1] = pages_text[-1] + "\n\n" + "\n\n".join(cur)
        else:
            pages_text.append("\n\n".join(cur))

    last_idx = len(pages_text) - 1
    pages: List[Dict[str, Any]] = []
    for i, text in enumerate(pages_text):
        page: Dict[str, Any] = {"page": i + 1, "text": text}
        if i < last_idx:
            page["hook"] = ""
        else:
            page["resolution_type"] = "katarza"
        pages.append(page)
    return pages


def main():
    if ARTICLE.get("body") and not ARTICLE.get("pages"):
        ARTICLE["pages"] = paginate_body(ARTICLE["body"])
        print(f"📄 Auto-paginated body → {len(ARTICLE['pages'])} stranica")
        for p in ARTICLE["pages"]:
            wc = len(p["text"].split())
            print(f"   strana {p['page']}: {wc} riječi")

    total_cost = Decimal("0")
    article_id = uuid.uuid4()
    slug = slugify(ARTICLE["title"])[:80]
    template_id = 9  # 9 = manual article (izvan TEMPLATES registra)

    print(f"\n🎬 Publishing manual article: {ARTICLE['title'][:80]}...\n")

    # 1. Image prompt + image
    print("→ Generating image prompt via Claude...")
    image_prompt = generate_image_prompt(ARTICLE)
    print(f"  Prompt: {image_prompt[:120]}...")

    print("→ Generating image via Replicate...")
    image_bytes, image_cost = generate_image(image_prompt)
    total_cost += Decimal(str(image_cost))
    print(f"  Image cost: ${image_cost:.4f}")

    # 2. Slika bez overlay teksta — čistiji izgled, bolji AdSense signal
    final_image = image_bytes
    thumb_image = create_thumbnail(final_image)

    # 3. Upload
    print("→ Uploading to R2...")
    hero_key = f"articles/{article_id}/hero.jpg"
    thumb_key = f"articles/{article_id}/thumb.jpg"
    hero_url = upload_image(final_image, hero_key)
    thumb_url = upload_image(thumb_image, thumb_key)
    print(f"  Hero: {hero_url}")

    # 4. Embedding
    print("→ Computing embedding...")
    embedding = compute_article_embedding(ARTICLE)

    # 5. DB insert
    print("→ Inserting into DB...")
    with get_db() as db:
        existing = db.query(Article).filter_by(slug=slug).first()
        if existing:
            slug = f"{slug}-{article_id.hex[:6]}"
            print(f"  Slug collision — using: {slug}")

        new_article = Article(
            id=article_id,
            title=ARTICLE["title"],
            slug=slug,
            subtitle=ARTICLE.get("subtitle"),
            category=ARTICLE["category"],
            tags=ARTICLE.get("tags", []),
            pages_json=ARTICLE["pages"],
            moral=ARTICLE.get("moral_or_punchline"),
            hero_image_url=hero_url,
            thumbnail_url=thumb_url,
            status="published",
            template_id=template_id,
            variables_used={"manual": True},
            generation_cost_usd=total_cost,
            embedding=embedding,
            published_at=datetime.utcnow(),
        )
        db.add(new_article)
        db.flush()

        db.add(
            ApiUsage(
                date=date.today(),
                service="replicate",
                operation="manual_article_image",
                tokens_or_units=1,
                cost_usd=Decimal(str(image_cost)),
                article_id=article_id,
            )
        )

    url = f"{settings.PORTAL_BASE_URL.rstrip('/')}/{category_to_slug(ARTICLE['category'])}/{slug}"
    print("\n✅ Published!")
    print(f"   Article ID: {article_id}")
    print(f"   Slug:       {slug}")
    print(f"   URL:        {url}")
    print(f"   Total cost: ${total_cost:.4f}")


if __name__ == "__main__":
    main()
