"""Varijabla pool za template-ove. Proširiv kroz vrijeme.

Ovo je fallback pool — u produkciji se varijable čuvaju u template_variables
tabeli u DB-u, tako da se mogu dodavati bez deploy-a. Ovaj pool se koristi
kao seed u scripts/seed_variables.py.
"""
import random
from typing import Dict, List

VARIABLE_POOL: Dict[int, Dict[str, List[str]]] = {
    # ===== TEMPLATE 1: Ispovijest sa poukom =====
    1: {
        "godine": ["28", "34", "41", "47", "52", "58", "63"],
        "grad": [
            "Sarajevo", "Tuzla", "Banja Luka", "Mostar", "Zenica", "Bihać",
            "Bijeljina", "Doboj", "Travnik", "Brčko", "Gradiška", "Visoko",
            "Konjic", "Gradačac", "Cazin", "Sanski Most", "Živinice",
            "Ilidža", "Srebrenik", "Goražde", "Tešanj", "Maglaj",
        ],
        "situacija": [
            "Osuđivala sam kolegicu 5 godina, a onda sam saznala istinu o njoj",
            "Nakon 20 godina braka otkrila sam da sam zaboravila ko sam ja kao osoba",
            "Godinama sam ljubomorno čuvala recept svoje svekrve, dok mi nije priznala istinu o njemu",
            "Moj otac me razočarao tri puta u životu, a onda sam shvatila zašto",
            "Cijeli život sam mislila da znam svoju majku, dok jednog dana nisam našla njen dnevnik",
            "Prijateljica mi je rekla nešto što nisam htjela da čujem — a ispalo je da je bila u pravu",
            "Kćerka mi se vratila sa fakulteta sa tajnom koju sam ja nosila 30 godina ranije",
        ],
        "konflikt": [
            "ponos vs istina",
            "strah vs slobodu",
            "dužnost vs vlastitu sreću",
            "ljubav vs zdrave granice",
            "tradicija vs autentičnost",
            "lojalnost vs iskrenost",
        ],
        "obrt": [
            "Ispostavilo se da je osoba koju sam osuđivala ustvari pomagala mom sinu",
            "Pronašla sam staro pismo koje mi je sve objasnilo",
            "Jednog dana mi je rekla istinu za koju sam znala godinama ali sam odbijala da je čujem",
            "Saznala sam da je ono za šta sam krivila nju zapravo bilo moje djelo",
            "Primila sam poruku od nepoznate osobe koja je sve preokrenula",
        ],
        "pouka": [
            "Ljudi su uvijek složeniji od naših sudova",
            "Opraštanje nije za drugoga, nego za nas same",
            "Ponos je najteže breme koje čovjek nosi",
            "Nikad nije kasno ispraviti grešku",
            "Često ono što nam smeta kod drugih je odraz onoga što ne volimo u sebi",
            "Istinska hrabrost je priznati da smo pogriješili",
        ],
    },

    # ===== TEMPLATE 2: Humor =====
    2: {
        "narator": [
            "snaha (32) koja dočekuje svekrvu na ručak",
            "otac (50) koji pokušava da shvati TikTok",
            "majka (45) koja organizuje rođendan kćerke",
            "penzioner (68) koji prvi put putuje avionom",
            "djed (72) koji čuva unuke vikend",
            "tinejdžerka (17) koja vodi baku kod doktora",
            "mlada udata žena (29) koja prvi put pravi sarmu",
            "haklerica (40) koja vodi knjigovodstvo svoje tašte",
        ],
        "tenzija": [
            "pokušaj da se napravi savršen ručak dok sve ide po zlu",
            "tajni plan koji svi znaju osim jedne osobe",
            "kvar u kući koji svi rješavaju na različite načine",
            "iznenadni gost koji dolazi u najgorem trenutku",
            "nestanak kućnog ljubimca usred rođendana",
            "pokvareni šporet na dan proslave",
            "dva gosta koji ne smiju da sretnu jedan drugog u istoj prostoriji",
        ],
    },

    # ===== TEMPLATE 3: Komšiluk =====
    3: {
        "opis_osobe": [
            "Čovjek (60) koji svake noći u 2 ujutru izlazi sa psom i niko ne zna šta radi",
            "Mlada žena koja živi sama sa dvoje djece i stalno prima različite muškarce",
            "Djevojka (22) koja nikad ne pozdravlja u liftu i uvijek nosi slušalice",
            "Stariji par koji cijele godine drži roletne zatvorene",
            "Čovjek koji svaki dan satima sjedi na klupi ispred zgrade i samo gleda",
            "Žena koja nikad ne pušta nikoga u stan, čak ni instalatera",
        ],
        "istina": [
            "Radi u noćnoj smjeni pekare, a pas mu pravi društvo jer žena boluje od demencije",
            "Muškarci su socijalni radnici, hraniteljska porodica, djeca nisu njena nego čuva tuđu djecu bez roditelja",
            "Autistična je, slušalice joj pomažu sa senzornim preopterećenjem; pozdrav joj je težak ali poštuje sve komšije na drugi način",
            "Čovjek ima rijetku očnu bolest zbog koje svijetlo izaziva bol",
            "Izgubio je sina u nesreći prije 5 godina i samo želi da sjedi gdje su se zadnji put šetali",
            "Živi sa ozbiljnim PTSP-om, u stanu ima azil za napuštene mačke koje liječi",
        ],
    },

    # ===== TEMPLATE 4: SMS dijalog =====
    4: {
        "osoba_A": [
            "majka", "kćerka", "najbolja prijateljica", "sestra",
            "muž", "bivši partner", "kolega sa posla", "brat"
        ],
        "osoba_B": [
            "kćerka na fakultetu", "majka", "prijateljica iz djetinjstva",
            "bivša prijateljica", "žena", "dijete", "šef", "susjeda"
        ],
        "zavrsetak": [
            "topla pouka o tome koliko rijetko zaista slušamo jedni druge",
            "humorističan obrt gdje se otkrije da je sve bio nesporazum",
            "katarza u obliku nepovratnog ali zdravog rastanka",
            "pomirenje poslije godina šutnje",
            "neočekivana rečenica koja promijeni sve",
        ],
    },

    # ===== TEMPLATE 5: Pismo redakciji =====
    5: {
        "situacija": [
            "snaha čija svekrva dolazi nenajavljena i kritikuje joj način vaspitanja djece",
            "prijateljstvo dvije žene koje se raspada nakon što je jedna dobila unapređenje",
            "majka tinejdžera koji je prestao pričati sa njom",
            "žena koja je shvatila da voli svoj posao više od braka",
            "otac koji ne zna kako da kaže sinu da ga nije ponosan na njegov izbor",
            "sestra koja se osjeća krivom što ne voli svoju drugu sestru",
        ],
        "pitanje": [
            "Da li da otvoreno kažem šta mislim ili da šutim radi mira?",
            "Je li kasno da počnem živjeti za sebe sa 48 godina?",
            "Kako da pomognem nekome ko ne priznaje da mu treba pomoć?",
            "Kako da oprostim nekome ko se nikad nije izvinio?",
            "Da li sam sebična ako prvo biram sebe?",
        ],
        "savjet_tip": [
            "poziva na samorefleksiju umjesto direktne akcije",
            "ohrabruje postavljanje zdravih granica",
            "predlaže razgovor sa trećom stranom (terapeut, svećenik, iskusniji član porodice)",
            "podsjeća da nemamo sve odgovore i to je u redu",
            "ukazuje na snagu male, konzistentne promjene",
        ],
    },

    # ===== TEMPLATE 6: Generacijska drama =====
    6: {
        "mladi": [
            "kći (28) koja ne želi svadbu na tradicionalan način",
            "sin (35) koji ne želi djecu",
            "unuka (22) koja ne ide u crkvu/džamiju",
            "snaha (30) koja radi iz kuće i bakama izgleda kao da 'ne radi ništa'",
            "unuk (19) koji hoće da studira umjetnost umjesto prava",
        ],
        "stariji": [
            "majka (62)",
            "baka (75)",
            "svekar (70)",
            "tetka (68)",
            "otac (58)",
            "djed (80)",
        ],
        "tema": [
            "zašto mladi ne žele da se vjenčaju",
            "zašto niko ne želi da kuha sedam dana u sedmici",
            "zašto 'rad od kuće' nije pravi posao",
            "zašto je tradicija tradicija a ne glupost",
            "zašto više niko ne piše pisma",
            "zašto mladi sve snimaju telefonom umjesto da žive",
        ],
    },

    # ===== TEMPLATE 7: Godišnji =====
    7: {
        "destinacija": [
            "selo kod bake u Hercegovini",
            "izlet na Vlašić",
            "porodični put u Beč kod rodbine",
            "planinarenje na Bjelašnici",
            "stari grad Mostar",
            "selo u istočnoj Bosni",
            "Jahorina zimi",
            "Banja Vrućica - banjski oporavak",
            "Neum tokom ljeta",
            "Blagaj i vrelo Bune",
            "Boračko jezero",
            "Sarajevo kod rodbine",
        ],
        "sezona": [
            "kraj jula", "početak septembra", "oko Božića",
            "vjerski praznik u maju", "Bajram", "uskršnji vikend",
        ],
        "lik": [
            "samohrani otac koji pokušava da zabavi dvoje djece",
            "nedavno razvedena žena (42) na prvom samostalnom putovanju",
            "par koji pokušava da spasi brak",
            "student na prvom putovanju bez roditelja",
            "baka (74) sa unukom (12) na putu bez ostatka porodice",
        ],
        "tvist": [
            "slučajno sretne osobu iz prošlosti",
            "dobije informaciju koja mijenja sve",
            "mora da pomogne potpunom strancu",
            "izgubi nešto dragocjeno i nađe nešto vrijednije",
            "bude uhvaćena u situaciji koja zahtijeva hrabru odluku",
        ],
        "lekcija": [
            "najbolja putovanja su ona koja planove iznevjere",
            "ljudi koje susretneš kratko nekad ostave dublji trag",
            "ponekad se odmaramo tek kada se zaustavimo",
            "dom nije mjesto, nego osjećaj",
        ],
    },

    # ===== TEMPLATE 8: Svadbena drama =====
    8: {
        "narator": [
            "mladoženja", "majka mlade", "kum", "mlada",
            "djed mlade", "svekrva",
        ],
        "opis_svadbe": [
            "tradicionalna seoska svadba sa 400 zvanica",
            "moderna svadba u hotelu",
            "svadba u rodnom selu gdje mladenci prvi put dolaze",
            "svadba za koju su mjesecima planirali SVE do detalja",
            "povratna svadba poslije 30 godina braka",
            "svadba sa zaraćenim porodicama sa obje strane",
        ],
        "problem": [
            "kum je izgubio prstenove dan prije",
            "bivša svekrva je došla nepozvana",
            "klima u sali otkazala na 38 stepeni",
            "svirač je zamijenio datum i nije došao",
            "unuk je upravo saopštio da je i on zaljubljen i želi se ženiti",
            "pokvarila se limuzina i mlada je došla traktorom",
        ],
    },
}


def pick_variables(template_id: int) -> Dict[str, str]:
    """Random odabir varijabli za dati template."""
    pool = VARIABLE_POOL.get(template_id, {})
    return {key: random.choice(values) for key, values in pool.items()}
