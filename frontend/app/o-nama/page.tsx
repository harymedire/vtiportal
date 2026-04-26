import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nama",
  description: "Ko smo i šta radimo — VTIportal.com",
};

export default function ONamaPage() {
  return (
    <div className="static-page">
      <h1>O nama</h1>
      <p>
        <strong>VTIportal.com</strong> je portal posvećen pričama iz svakodnevnog života
        — ispovijestima, komšijskim dramama, generacijskim nesporazumima, toplim
        porodičnim momentima i trenucima koji nas spajaju.
      </p>
      <p>
        Naš cilj je da čitatelj u svakoj priči pronađe makar djelić sebe — svoj
        smijeh, svoju suzu, svoju dilemu. Pišemo o ljudima onako kako jesu:
        složenim, ranjivim, smiješnim i dobrim.
      </p>

      <h2>Važna napomena</h2>
      <p>
        Priče objavljene na portalu u rubrikama <em>Ispovijesti</em>,
        <em> Društvo</em> i <em>Lifestyle</em> jesu fiktivne
        pripovijetke inspirisane stvarnim životnim situacijama. Imena, likovi, gradovi
        i detalji su izmijenjeni ili izmišljeni radi zaštite privatnosti.
      </p>
      <p>
        Ako želite da podijelite svoju priču sa nama, možete nas kontaktirati putem
        stranice <a href="/kontakt">Kontakt</a>.
      </p>
    </div>
  );
}
