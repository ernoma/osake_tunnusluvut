// Sovelluksen sisällön tyypit. Zod-skeemat (schema.ts) on sidottu näihin tyyppeihin,
// joten tyyppiin lisätty kenttä on lisättävä myös skeemaan.
//
// Tekstikentissä sanastotermi merkitään [[termi]] tai [[termi|taivutettu muoto]].

export const DIRECTIONS = ["higher", "lower", "range", "neutral"] as const;
/**
 * higher  = suurempi on yleensä parempi
 * lower   = pienempi tarkoittaa yleensä halvempaa osaketta
 * range   = järkevä vaihteluväli, liian suuri tai pieni on varoitusmerkki
 * neutral = kuvaa kokoa, ei itsessään hyvä tai huono
 */
export type Direction = (typeof DIRECTIONS)[number];

export const LEVELS = ["perus", "syventava"] as const;
export type Level = (typeof LEVELS)[number];

export const CATEGORY_IDS = [
  "koko",
  "kannattavuus",
  "osakekohtaiset",
  "osinko",
  "velka",
  "arvostus",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const UNITS = ["€", "%", "x", "€/osake"] as const;
export type Unit = (typeof UNITS)[number];

export const TONES = ["good", "neutral", "warning"] as const;
export type Tone = (typeof TONES)[number];

export interface MetricRange {
  /** "Alle 1" */
  label: string;
  /** "Kasvuun nähden edullinen" */
  meaning: string;
  tone: Tone;
}

export interface Companion {
  /** Viittaus toisen tunnusluvun id:hen (tai suunniteltuun, ks. planned.ts). */
  id: string;
  /** Miksi tämä kannattaa katsoa rinnalla. */
  reason: string;
}

export interface Metric {
  /** Yksilöivä tunniste, käytetään linkeissä (#pe). */
  id: string;
  /** "P/E-luku" */
  name: string;
  /** "P/E" */
  abbreviation?: string;
  /** "Price / Earnings = hinta suhteessa tulokseen" */
  abbreviationExpanded?: string;
  /** Hakua varten, esim. ["hinta-voittosuhde"]. */
  aliases: string[];
  category: CategoryId;
  level: Level;
  /** Arkikielinen kysymys, johon luku vastaa. */
  question: string;
  /** Selkokielinen selitys, näkyy kortilla aina. */
  summary: string;
  /** Arkinen vertaus. */
  analogy: string;
  formula: {
    /** "Osakkeen hinta ÷ osakekohtainen tulos" */
    words: string;
    /** "Kurssi ÷ EPS" */
    symbols?: string;
    note?: string;
  };
  /** Laskuesimerkki tasaluvuilla. */
  example: string;
  unit: Unit;
  direction: Direction;
  /** "Pienempi = yleensä halvempi" */
  directionLabel: string;
  /** 1–3 tärkeintä tulkintasääntöä, näkyvät kortilla aina. */
  rules: string[];
  /** Yleisin aloittelijan virhe, näkyy kortilla aina. */
  commonMistake: string;
  /** Tulkintaan vaikuttavat seikat ("Lisää"-osio). */
  factors: string[];
  /** Muut sudenkuopat ("Lisää"-osio). */
  pitfalls: string[];
  /** Suuntaa antava asteikko. */
  ranges?: MetricRange[];
  /** "Nyrkkisääntö, vaihtelee toimialoittain" */
  rangesNote?: string;
  companions: Companion[];
}

/** Tunnusluku, johon saa jo viitata, mutta jota ei ole vielä kirjoitettu. Näkyy "tulossa"-tilassa. */
export interface PlannedMetric {
  id: string;
  name: string;
  abbreviation?: string;
  category: CategoryId;
}

export interface Category {
  id: CategoryId;
  /** Suodattimen lyhyt nimi, esim. "Hinta". */
  shortName: string;
  /** Väliotsikko kysymyksenä, esim. "Onko osake halpa vai kallis?" */
  question: string;
  description: string;
  order: number;
}

export interface GlossaryTerm {
  id: string;
  /** Perusmuoto, jolla termiin viitataan: [[oma pääoma]]. */
  term: string;
  /** Muut perusmuodot, joilla termiin voi viitata, esim. ["kurssi"]. */
  forms: string[];
  /** Enintään kaksi lausetta arkikielellä. */
  definition: string;
  relatedMetricId?: string;
}
