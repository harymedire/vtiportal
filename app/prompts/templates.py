"""8 template formata priča. Svaki ima prompt i očekivane varijable."""
from dataclasses import dataclass
from typing import List


@dataclass
class TemplateSpec:
    id: int
    name: str
    category: str
    user_prompt: str
    required_variables: List[str]
    daily_quota: int  # preporučena učestalost po danu (sumiraju u 20)


# ===== TEMPLATE 1: Ispovijest sa poukom =====
TEMPLATE_1 = TemplateSpec(
    id=1,
    name="Ispovijest sa poukom",
    category="Ispovijesti",
    daily_quota=4,
    required_variables=["godine", "grad", "situacija", "konflikt", "obrt", "pouka"],
    user_prompt="""Napiši priču u formatu ISPOVIJEST (prvo lice, žena, {godine} godina, iz {grad}).

SITUACIJA: {situacija}
UNUTRAŠNJI KONFLIKT: {konflikt}
TAJNA/OBRT na stranici 3: {obrt}
POUKA na kraju: {pouka}

TON: iskren, samorefleksivan, povremeno ironičan prema sebi samoj, bez samosažaljenja. Protagonistkinja nije žrtva — ona je čovjek koji je pogriješio/naučio/odrastao.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 2: Humoristična familijarna drama =====
TEMPLATE_2 = TemplateSpec(
    id=2,
    name="Humoristična familijarna drama",
    category="Društvo",
    daily_quota=4,
    required_variables=["narator", "tenzija"],
    user_prompt="""Napiši HUMORISTIČNU priču iz porodičnog života.

NARATOR: {narator}
GLAVNA TENZIJA: {tenzija}
ESKALACIJA: na svakoj stranici situacija se apsurdno pogoršava kroz serije nesporazuma
VRHUNAC: na stranici 4 dolazi do potpunog haosa
RAZRJEŠENJE: na stranici 5 sve se okrene u nježan, topao smijeh gdje svi shvate koliko su bili glupi

TON: topao humor, ne podsmijeh. Likovi su dragi čitatelju i pored svojih mana. Koristi prirodne dijaloge, unutrašnje monologe tipa "šta ja ovo radim", situacionu komiku.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 3: Komšijska priča sa poukom o predrasudama =====
TEMPLATE_3 = TemplateSpec(
    id=3,
    name="Komšijska priča",
    category="Društvo",
    daily_quota=2,
    required_variables=["opis_osobe", "istina"],
    user_prompt="""Napiši priču u stilu komšijske gossip priče.

STRUKTURA:
- Stranica 1: Narator (komšinica/komšija) opisuje "čudnu" ili "sumnjivu" osobu iz zgrade/ulice
- Stranica 2: Pojačavaju se tračevi, narator ih prenosi i sam počinje da vjeruje
- Stranica 3: Desi se nešto što zaoštri situaciju
- Stranica 4: Narator slučajno sazna istinu — osoba nije ono što su svi mislili
- Stranica 5: Istina razotkriva zajedničke predrasude. Narator se suočava sa svojom sramotom i donosi pouku

O OSOBI: {opis_osobe}
PRAVA ISTINA: {istina}

TON: na početku lagano osuđujući (kao što komšije i jesu), postepeno se mijenja u empatičan i pokajnički. Ne didaktičan — čitatelj sam treba da izvede pouku.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 4: SMS/Viber dijalog drama =====
TEMPLATE_4 = TemplateSpec(
    id=4,
    name="SMS dijalog",
    category="Lifestyle",
    daily_quota=3,
    required_variables=["osoba_A", "osoba_B", "zavrsetak"],
    user_prompt="""Napiši priču u formatu PRIKAZANIH SMS/Viber poruka između {osoba_A} i {osoba_B}.

STRUKTURA:
- Stranica 1: ~8 razmjenjenih poruka, uvodi situaciju
- Stranica 2: ~8 poruka, tenzija raste
- Stranica 3: ~8 poruka, otkriva se problem ili misterija
- Stranica 4: ~8 poruka, konflikt ili otkriće vrhunca
- Stranica 5: završnica — razrješenje + narativni komentar na kraju sa: {zavrsetak}

FORMAT svake poruke:
[14:23] Ana: Tekst poruke
[14:24] Marko: Odgovor
(možeš koristiti i ✓✓ viđeno ili "piše..." za dramski efekat)

TON: realističan — pravopis malo nehajan kao u stvarnim porukama, emotikoni povremeno, kratke rečenice.

Ispoštuj sve globalne formatke. U output JSON-u, "text" stranica sadrži formatirane poruke.""",
)


# ===== TEMPLATE 5: Pismo redakciji =====
TEMPLATE_5 = TemplateSpec(
    id=5,
    name="Pismo redakciji",
    category="Ispovijesti",
    daily_quota=2,
    required_variables=["situacija", "pitanje", "savjet_tip"],
    user_prompt="""Napiši članak u formatu PISMA REDAKCIJI + ODGOVOR UREDNICE.

STRUKTURA:
- Stranica 1: Intro urednice ("Dobili smo ovo pismo od naše čitateljke..."), prva trećina pisma
- Stranica 2: Druga trećina pisma — situacija postaje složena
- Stranica 3: Poslednja trećina pisma — čitateljka postavlja konkretno pitanje/molbu za savjet
- Stranica 4: Početak odgovora urednice — empatija, razumijevanje, validacija osjećaja
- Stranica 5: Nastavak i završetak odgovora — konkretan savjet koji {savjet_tip}. Završava toplom riječju.

SITUACIJA: {situacija}
ČITATELJKINO PITANJE: {pitanje}

TON PISMA: iskren, razbarušen, emocionalan, malo haotičan (kao pravo pismo)
TON ODGOVORA: mudar, empatičan, ne osuđujući, daje perspektivu bez moraliziranja

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 6: Generacijska drama =====
TEMPLATE_6 = TemplateSpec(
    id=6,
    name="Generacijska drama",
    category="Društvo",
    daily_quota=2,
    required_variables=["mladi", "stariji", "tema"],
    user_prompt="""Napiši priču o sukobu GENERACIJA sa rezolucijom gdje obje strane shvate istinu.

GLAVNI LIKOVI: {mladi} i {stariji}
KONFLIKTNA TEMA: {tema}

STRUKTURA:
- Stranica 1: Uvod, prvi sukob, obje strane se učvršćuju u svojim pozicijama
- Stranica 2: Eskalacija, ružne riječi, emotivna reakcija
- Stranica 3: Distanca — ljudi ne pričaju, pripovjedač razmišlja
- Stranica 4: Događaj/otkriće koje promijeni perspektivu jednog od likova
- Stranica 5: Razgovor u kojem OBOJE priznaju da su dijelom bili u pravu i dijelom pogrešno. Topla rezolucija.

POUKA: obje generacije imaju valid perspektive; mudrost je u slušanju, ne u "pobjedi"

TON: emotivan ali ne melodramatičan. Dijalozi autentični za regionalnu porodičnu dinamiku.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 7: Priča sa putovanja =====
TEMPLATE_7 = TemplateSpec(
    id=7,
    name="Priča s putovanja",
    category="Lifestyle",
    daily_quota=1,
    required_variables=["destinacija", "sezona", "lik", "tvist", "lekcija"],
    user_prompt="""Napiši priču koja se dešava na {destinacija} tokom {sezona}.

GLAVNI LIK: {lik}
OČEKIVANJE: šta je lik mislio da će se desiti na putovanju
STVARNOST: {tvist} — desi se nešto potpuno drugačije
LEKCIJA: {lekcija}

STRUKTURA:
- Stranica 1: Priprema/dolazak, lik opisuje svoje planove i anksioznosti
- Stranica 2: Prvi dan, malo uvodi se nešto što odstupa od plana
- Stranica 3: Situacija eskalira u {tvist}
- Stranica 4: Lik mora da se snađe u neočekivanim okolnostima
- Stranica 5: Povratak kući — lik shvati da je putovanje bilo drugačije nego što je očekivao, ali MOŽDA i bolje. Ispisana lekcija.

TON: nostalgičan, blaga introspekcija, mogu biti humorističniji momenti kroz sitnice.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== TEMPLATE 8: Svadbena drama =====
TEMPLATE_8 = TemplateSpec(
    id=8,
    name="Svadbena drama",
    category="Lifestyle",
    daily_quota=2,
    required_variables=["narator", "opis_svadbe", "problem"],
    user_prompt="""Napiši HUMORISTIČNU priču o haotičnoj svadbi iz perspektive {narator}.

SVADBA: {opis_svadbe}
GLAVNI PROBLEM: {problem}
DODATNI PROBLEMI: kroz stranice se nižu 3-4 manja haotična momenta (pokvarena kola, pijan kum, izgubljeni prstenovi, ljuti tetak itd.)

STRUKTURA:
- Stranica 1: Jutro dana svadbe — napetost, pripreme
- Stranica 2: Prvi haos se dešava, narator paniči
- Stranica 3: Ceremonija — novi haos
- Stranica 4: Proslava — potpuni cirkus
- Stranica 5: Kraj noći — iznenada svi shvate da je uprkos haosu bilo najbolje slavlje ikad. Topao kraj.

TON: topao humor, blaga samoironija. Svako voli svakog uprkos cirkusu. Likovi imaju manjkavosti ali nisu zli.

Ispoštuj sve globalne formatke i output JSON.""",
)


# ===== REGISTAR =====
TEMPLATES = {
    1: TEMPLATE_1,
    2: TEMPLATE_2,
    3: TEMPLATE_3,
    4: TEMPLATE_4,
    5: TEMPLATE_5,
    6: TEMPLATE_6,
    7: TEMPLATE_7,
    8: TEMPLATE_8,
}

# Ukupno quota = 4+4+2+3+2+2+1+2 = 20 članaka/dan
assert sum(t.daily_quota for t in TEMPLATES.values()) == 20
