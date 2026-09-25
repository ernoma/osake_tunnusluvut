// "Aloita tästä" -paneelin sisältö: suositeltu lukujärjestys ja suuntamerkkien selite.

import type { Direction } from "./types.ts";

/** Tunnuslukujen id:t siinä järjestyksessä, jossa aloittelijan kannattaa lukea ne. */
export const recommendedOrder: string[] = [
  "liikevaihto",
  "ebit",
  "ebit-prosentti",
  "eps",
  "pe",
  "omavaraisuusaste",
  "osinkotuotto",
  "osinkosuhde",
];

/** Suuntamerkkien selite: sama ikoni ja väri kuin korteilla, yleinen teksti. */
export const directionLegend: { direction: Direction; label: string }[] = [
  { direction: "higher", label: "Suurempi = yleensä parempi" },
  { direction: "lower", label: "Pienempi = yleensä halvempi" },
  { direction: "range", label: "Sopiva väli on paras" },
  { direction: "neutral", label: "Kertoo koosta, ei hyvä tai huono" },
];
