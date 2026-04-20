import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktirajte redakciju VTIportal.com",
};

export default function KontaktPage() {
  return (
    <div className="static-page">
      <h1>Kontakt</h1>
      <p>Za sva pitanja, prijedloge, primjedbe ili saradnju, kontaktirajte nas:</p>
      <h2>Redakcija</h2>
      <p>
        E-mail:{" "}
        <a href="mailto:kontakt@vtiportal.com">kontakt@vtiportal.com</a>
      </p>
      <h2>Oglašavanje</h2>
      <p>
        E-mail:{" "}
        <a href="mailto:marketing@vtiportal.com">marketing@vtiportal.com</a>
      </p>
      <p>
        Više informacija o oglašavanju možete pronaći na stranici{" "}
        <a href="/oglasavanje">Oglašavanje</a>.
      </p>
      <h2>Podijelite svoju priču</h2>
      <p>
        Imate zanimljivu životnu priču koju želite da ispričate? Pošaljite je na
        našu mail adresu. Svi podaci se tretiraju povjerljivo i nijedno ime neće
        biti objavljeno bez vaše izričite saglasnosti.
      </p>
    </div>
  );
}
