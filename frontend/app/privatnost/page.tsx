import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Politika privatnosti — VTIportal.com",
};

export default function PrivatnostPage() {
  return (
    <div className="static-page">
      <h1>Politika privatnosti</h1>
      <p>
        Ova politika privatnosti opisuje kako VTIportal.com (&quot;mi&quot;,
        &quot;naš&quot;) prikuplja, koristi i štiti informacije koje nam pružate
        prilikom posjete našem portalu.
      </p>

      <h2>Podaci koje prikupljamo</h2>
      <p>
        Automatski prikupljamo osnovne tehničke informacije (IP adresa, tip
        pretraživača, operativni sistem, stranice koje posjećujete, vrijeme
        posjete) radi analitike i poboljšanja servisa.
      </p>

      <h2>Kolačići (cookies)</h2>
      <p>
        Koristimo kolačiće za funkcionisanje portala, analitiku (Google
        Analytics) i prikazivanje personalizovanih oglasa (Google AdSense).
        Posjetom portala prihvatate upotrebu kolačića u skladu sa ovom
        politikom.
      </p>
      <p>
        Google AdSense koristi &quot;DoubleClick DART&quot; kolačić za
        prikazivanje oglasa zasnovanih na vašim interesovanjima. Više
        informacija i opciju isključivanja možete pronaći na{" "}
        <a
          href="https://policies.google.com/technologies/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Ads politika
        </a>
        .
      </p>

      <h2>Oglašivači treće strane</h2>
      <p>
        Koristimo Google AdSense za prikaz oglasa. Google kao vendor treće
        strane koristi kolačiće za prikazivanje oglasa na našem portalu.
        Korisnici mogu isključiti upotrebu ovih kolačića posjetom{" "}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Ads Settings
        </a>
        .
      </p>

      <h2>Linkovi ka drugim stranicama</h2>
      <p>
        Naš portal može sadržavati linkove ka drugim stranicama. Nismo
        odgovorni za politiku privatnosti ili sadržaj takvih stranica.
      </p>

      <h2>Vaša prava</h2>
      <p>
        Imate pravo da zatražite pristup, ispravku ili brisanje vaših podataka.
        Za bilo kakav zahtjev kontaktirajte nas na{" "}
        <a href="mailto:kontakt@vtiportal.com">kontakt@vtiportal.com</a>.
      </p>

      <h2>Izmjene politike</h2>
      <p>
        Zadržavamo pravo da ažuriramo ovu politiku u bilo koje vrijeme.
        Posljednje ažuriranje: {new Date().toLocaleDateString("bs-BA")}.
      </p>
    </div>
  );
}
