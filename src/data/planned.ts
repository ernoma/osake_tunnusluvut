// Tunnusluvut, joihin saa jo viitata (companions, [[termi]]), mutta joita ei ole vielä kirjoitettu.
// Ne näytetään käyttöliittymässä "tulossa"-tilassa. Kun tunnusluku lisätään metrics.ts:ään,
// poista se täältä (testi muistuttaa).

import type { PlannedMetric } from "./types.ts";

export const planned: PlannedMetric[] = [
  { id: "markkina-arvo", name: "Markkina-arvo", category: "koko" },
  { id: "ev", name: "Yritysarvo", abbreviation: "EV", category: "koko" },
  { id: "liikevaihto", name: "Liikevaihto", category: "koko" },
  { id: "ebit", name: "Liikevoitto", abbreviation: "EBIT", category: "kannattavuus" },
  {
    id: "ebit-prosentti",
    name: "Liikevoittoprosentti",
    abbreviation: "EBIT-%",
    category: "kannattavuus",
  },
  { id: "roe", name: "Oman pääoman tuotto", abbreviation: "ROE", category: "kannattavuus" },
  { id: "eps", name: "Osakekohtainen tulos", abbreviation: "EPS", category: "osakekohtaiset" },
  { id: "osinko-per-osake", name: "Osinko/osake", category: "osakekohtaiset" },
  { id: "osinkotuotto", name: "Osinkotuotto", category: "osinko" },
  { id: "osinkosuhde", name: "Osinkosuhde", category: "osinko" },
  { id: "omavaraisuusaste", name: "Omavaraisuusaste", category: "velka" },
  { id: "nettovelkaantumisaste", name: "Nettovelkaantumisaste", category: "velka" },
  { id: "pb", name: "P/B-luku", abbreviation: "P/B", category: "arvostus" },
  { id: "ps", name: "P/S-luku", abbreviation: "P/S", category: "arvostus" },
  { id: "ev-ebit", name: "EV/EBIT-luku", abbreviation: "EV/EBIT", category: "arvostus" },
];
