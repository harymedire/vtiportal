import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uslovi korištenja",
  description: "Uslovi korištenja — VTIportal.com",
};

export default function UsloviPage() {
  return (
    <div className="static-page">
      <h1>Uslovi korištenja</h1>
      <p>
        Pristupom i korištenjem portala VTIportal.com pristajete na ove uslove
        korištenja. Ako se ne slažete sa bilo kojim dijelom ovih uslova, molimo
        vas da ne koristite portal.
      </p>

      <h2>Priroda sadržaja</h2>
      <p>
        Priče objavljene na portalu u rubrikama <em>Ispovijesti</em>,{" "}
        <em>Komšiluk</em> i <em>Lifestyle</em> jesu fiktivne pripovijetke inspirisane stvarnim
        životnim situacijama. Imena, likovi, gradovi i detalji su izmijenjeni
        ili izmišljeni. Svaka sličnost sa stvarnim osobama ili događajima je
        slučajna.
      </p>
      <p>
        Sadržaj je namijenjen zabavi i refleksiji — ne predstavlja
        profesionalni savjet (pravni, medicinski, psihološki ili finansijski).
      </p>

      <h2>Intelektualna svojina</h2>
      <p>
        Svi tekstovi, slike i ostali materijali na portalu su vlasništvo
        VTIportal.com, osim ako nije drugačije naznačeno. Zabranjeno je
        kopiranje, distribucija ili reprodukcija sadržaja bez pismene
        saglasnosti.
      </p>

      <h2>Ograničenje odgovornosti</h2>
      <p>
        Portal se pruža &quot;kakav jeste&quot;, bez ikakvih garancija.
        VTIportal.com ne snosi odgovornost za eventualnu štetu nastalu
        korištenjem portala ili oslanjanjem na njegov sadržaj.
      </p>

      <h2>Izmjene uslova</h2>
      <p>
        Zadržavamo pravo izmjene ovih uslova u bilo koje vrijeme. Nastavak
        korištenja portala nakon izmjena smatra se prihvatanjem novih uslova.
      </p>

      <h2>Kontakt</h2>
      <p>
        Za sva pitanja kontaktirajte nas na{" "}
        <a href="mailto:kontakt@vtiportal.com">kontakt@vtiportal.com</a>.
      </p>
    </div>
  );
}
