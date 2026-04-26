import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/o-nama">O nama</Link>
        <Link href="/kontakt">Kontakt</Link>
        <Link href="/privatnost">Politika privatnosti</Link>
        <Link href="/uslovi">Uslovi korištenja</Link>
        <Link href="/oglasavanje">Oglašavanje</Link>
      </div>
      <div style={{ marginTop: 10 }}>
        © {new Date().getFullYear()} VTIportal.com · Sva prava zadržana
      </div>
      <div className="disclaimer">
        Napomena: Priče u rubrikama &quot;Ispovijesti&quot;, &quot;Društvo&quot; i &quot;Lifestyle&quot;
        su književne adaptacije inspirirane stvarnim životnim situacijama.
        Sva imena, lokacije i biografski detalji su izmijenjeni radi zaštite
        privatnosti. Sličnosti sa stvarnim osobama su slučajne. Sadržaj je
        namijenjen zabavi i razmišljanju, a ne kao izvor informacija o
        stvarnim događajima.
      </div>
    </footer>
  );
}
