// Kauppalehden osakesivua mukaileva teksti: nimi ja arvo samalla rivillä, rahamäärät
// "milj. €" -muodossa ja osakemäärä tuhaterottimin.

import { row, type ExtractionFixture } from "./types.ts";

export const kauppalehti: ExtractionFixture = {
  site: "Kauppalehti",
  company: { name: "Testikone Oyj", currency: "EUR", priceCurrency: null },
  text: [
    "Testikone Oyj (TKONE)",
    row("Kurssi", "8,652 €"),
    row("Muutos", "+1,2 %"),
    row("Vaihto", "3,4 milj. €"),
    "",
    "Perustiedot",
    row("Markkina-arvo", "1 523 milj. €"),
    row("Osakkeita", "176 024 000 kpl"),
    row("P/E-luku", "11,4"),
    row("Tulos/osake", "0,76 €"),
    row("Osinko/osake", "0,45 €"),
    row("Efektiivinen osinkotuotto", "5,2 %"),
    row("Oma pääoma/osake", "7,10 €"),
    row("P/B-luku", "1,22"),
  ].join("\n"),
  expected: [
    { id: "kurssi", value: 8.652 },
    { id: "markkina-arvo", value: 1.523e9 },
    { id: "osakkeiden-maara", value: 176_024_000 },
    { id: "pe", value: 11.4 },
    { id: "eps", value: 0.76 },
    { id: "osinko-per-osake", value: 0.45 },
    { id: "osinkotuotto", value: 5.2 },
    { id: "pb", value: 1.22 },
  ],
  response: {
    company: { name: "Testikone Oyj", ticker: "TKONE", currency: "EUR", priceCurrency: null },
    values: [
      { id: "kurssi", value: 8.652, period: "ttm", year: null, quote: "Kurssi 8,652 €" },
      {
        id: "markkina-arvo",
        value: 1.523e9,
        period: "ttm",
        year: null,
        quote: "Markkina-arvo 1 523 milj. €",
      },
      {
        id: "osakkeiden-maara",
        value: 176_024_000,
        period: "ttm",
        year: null,
        quote: "Osakkeita 176 024 000 kpl",
      },
      { id: "pe", value: 11.4, period: "ttm", year: null, quote: "P/E-luku 11,4" },
      { id: "eps", value: 0.76, period: "ttm", year: null, quote: "Tulos/osake 0,76 €" },
      {
        id: "osinko-per-osake",
        value: 0.45,
        period: "toteutunut",
        year: null,
        quote: "Osinko/osake 0,45 €",
      },
      {
        id: "osinkotuotto",
        value: 5.2,
        period: "ttm",
        year: null,
        quote: "Efektiivinen osinkotuotto 5,2 %",
      },
      { id: "pb", value: 1.22, period: "ttm", year: null, quote: "P/B-luku 1,22" },
      // Tahallinen virhe: kaksoiskappale, jossa on eri arvo.
      { id: "pe", value: 12.0, period: "ennuste", year: "2026", quote: "P/E-luku 11,4" },
    ],
    notes: [],
  },
};
