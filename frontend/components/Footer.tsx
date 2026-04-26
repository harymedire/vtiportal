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
        Priče objavljene u rubrikama &quot;Ispovijesti&quot;, &quot;Društvo&quot; i &quot;Lifestyle&quot;
        inspirisane su stvarnim životnim situacijama.
        Imena, likovi i detalji su izmijenjeni ili izmišljeni radi zaštite privatnosti.
      </div>
    </footer>
  );
}
