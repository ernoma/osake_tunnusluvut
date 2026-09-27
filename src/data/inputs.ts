// Lähtötiedot: luvut, joista tunnuslukuja lasketaan, mutta jotka eivät itse ole tunnuslukuja
// (suunnitelman kohta 11.4). Tunnusluvut (esim. markkina-arvo tai EBIT) ovat metrics.ts:ssä,
// ja kaavat, jotka yhdistävät nämä, ovat formulas.ts:ssä.
//
// Uusi lähtötieto lisätään tänne yhdellä rivillä. Tekoälyhaun kehote ja "Lisää luku" -haku
// käyttävät nimeä ja aliaksia, joten lisää aliaksiksi nimet, joilla luku esiintyy sivuilla.

import type { InputFigure } from "./types.ts";

export const inputs: InputFigure[] = [
  {
    id: "kurssi",
    name: "Osakkeen kurssi",
    unit: "€/osake",
    aliases: ["kurssi", "osakekurssi", "osakkeen hinta", "share price", "last price"],
    term: "pörssikurssi",
  },
  {
    id: "osakkeiden-maara",
    name: "Osakkeiden määrä",
    unit: "kpl",
    aliases: ["osakemäärä", "osakkeiden lukumäärä", "shares outstanding", "number of shares"],
    term: "osake",
  },
  {
    id: "nettotulos",
    name: "Nettotulos",
    unit: "€",
    aliases: ["tilikauden tulos", "tilikauden voitto", "katsauskauden tulos", "net income"],
    term: "nettotulos",
  },
  {
    id: "tulos-ennen-veroja",
    name: "Tulos ennen veroja",
    unit: "€",
    aliases: ["voitto ennen veroja", "pre-tax profit", "earnings before tax", "ebt"],
  },
  {
    id: "rahoituskulut",
    name: "Rahoituskulut",
    unit: "€",
    aliases: ["korkokulut", "financial expenses", "interest expense"],
    expense: true,
  },
  {
    id: "oma-paaoma",
    name: "Oma pääoma",
    unit: "€",
    aliases: ["oma pääoma yhteensä", "equity", "total equity", "shareholders' equity"],
    term: "oma pääoma",
  },
  {
    id: "taseen-loppusumma",
    name: "Taseen loppusumma",
    unit: "€",
    aliases: [
      "varat yhteensä",
      "taseen yhteismäärä",
      "vastaavaa yhteensä",
      "vastattavaa yhteensä",
      "oma pääoma ja velat yhteensä",
      "total assets",
      "total equity and liabilities",
    ],
    term: "tase",
  },
  {
    id: "saadut-ennakot",
    name: "Saadut ennakot",
    unit: "€",
    aliases: ["saadut ennakkomaksut", "advances received", "customer advances"],
    term: "saadut ennakot",
  },
  {
    id: "korolliset-velat",
    name: "Korolliset velat",
    unit: "€",
    aliases: ["korollinen vieras pääoma", "rahoitusvelat", "interest-bearing debt", "total debt"],
    term: "korollinen velka",
  },
  {
    id: "kassa",
    name: "Kassa",
    unit: "€",
    aliases: ["rahavarat", "rahat ja pankkisaamiset", "cash", "cash and equivalents"],
    term: "kassa",
  },
  {
    id: "nettovelka",
    name: "Nettovelka",
    unit: "€",
    aliases: ["korollinen nettovelka", "net debt"],
    term: "nettovelka",
  },
  {
    id: "poistot",
    name: "Poistot",
    unit: "€",
    aliases: ["poistot ja arvonalentumiset", "depreciation", "depreciation and amortization"],
    term: "poisto",
    expense: true,
  },
  {
    id: "investoinnit",
    name: "Investoinnit",
    unit: "€",
    aliases: ["bruttoinvestoinnit", "capex", "capital expenditure"],
    term: "investointi",
    expense: true,
  },
  {
    id: "liikevaihto-edellinen",
    name: "Edellisten 12 kk:n liikevaihto",
    unit: "€",
    aliases: ["vertailukauden liikevaihto", "liikevaihto vuotta aiemmin", "prior year revenue"],
  },
  {
    id: "tuloksen-kasvuennuste",
    name: "Tuloksen kasvuennuste",
    unit: "%",
    aliases: ["ennustettu tuloskasvu", "eps-kasvuennuste", "earnings growth forecast"],
    term: "ennuste",
  },
];
