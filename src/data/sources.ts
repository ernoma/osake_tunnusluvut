// Sivustot, joille lisälukemista-linkit osoittavat. Uusi sivusto = uusi rivi.
// Valintaperiaatteet: TOTEUTUSSUUNNITELMA.md, kohta 6.7. Neutraalit lähteet ensin.
// Kaupallisilta sivustoilta (pankit, välittäjät, analyysitalot) vain opetussivuja.

import type { Source } from "./types.ts";

export const sources: Source[] = [
  { id: "porssisaatio", name: "Pörssisäätiö", domain: "porssisaatio.fi", type: "neutraali" },
  { id: "wikipedia-fi", name: "Wikipedia", domain: "fi.wikipedia.org", type: "neutraali" },
  { id: "investopedia", name: "Investopedia", domain: "investopedia.com", type: "neutraali" },
  { id: "inderes", name: "Inderes", domain: "inderes.fi", type: "kaupallinen" },
  { id: "nordnet", name: "Nordnet", domain: "nordnet.fi", type: "kaupallinen" },
];
