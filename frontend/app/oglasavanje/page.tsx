import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oglašavanje",
  description: "Oglasite se na VTIportal.com",
};

export default function OglasavanjePage() {
  return (
    <div className="static-page">
      <h1>Oglašavanje</h1>
      <p>
        VTIportal.com svakodnevno posjećuju čitatelji iz Bosne i Hercegovine i
        regije. Ako želite da dopremate svoju poruku publici koja traži
        autentičan, zanimljiv sadržaj, oglašavanje na našem portalu je pravi
        izbor.
      </p>

      <h2>Šta nudimo</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        <li>Display banner oglasi (Google AdSense i direktno)</li>
        <li>Sponzorisane priče i native sadržaj</li>
        <li>Oglasi u mail newsletter-u</li>
        <li>Custom paketi prilagođeni vašim potrebama</li>
      </ul>

      <h2>Kontakt</h2>
      <p>
        Za informacije o cijenama i dostupnim terminima, javite nam se na:{" "}
        <a href="mailto:marketing@vtiportal.com">marketing@vtiportal.com</a>
      </p>
    </div>
  );
}
