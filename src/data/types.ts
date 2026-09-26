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
  /**
   * Välin alaraja, joka kuuluu väliin. Puuttuu vain ensimmäiseltä riviltä ("Alle 10").
   * Prosentit prosentteina (12,3 eikä 0,123) ja eurot euroina (150 milj. € = 150_000_000).
   */
  min?: number;
  /**
   * Välin yläraja, joka ei kuulu väliin. Puuttuu vain viimeiseltä riviltä ("Yli 25").
   * Jos min ja max ovat samat, väli on yksi luku, esimerkiksi "0 %".
   */
  max?: number;
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
  /** Lisälukemista muilla sivustoilla, 0–3 kpl. Suomenkieliset ensin. */
  links: ExternalLink[];
}

export const LINK_LANGUAGES = ["fi", "en"] as const;
export type LinkLanguage = (typeof LINK_LANGUAGES)[number];

export const LINK_KINDS = ["selitys", "esimerkki", "laskuri", "video"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export interface ExternalLink {
  /** Mitä sivulta löytyy: "Selitys ja laskuesimerkki". Ei pelkkä sivuston nimi. */
  title: string;
  /** Vain https. Verkkotunnuksen pitää kuulua sourceId:n sivustoon. */
  url: string;
  /** Viittaus sources.ts:n sivustoon. */
  sourceId: string;
  language: LinkLanguage;
  kind: LinkKind;
  /** "2026-09-25": milloin sisältö viimeksi luettu käsin. */
  checkedAt: string;
}

export const SOURCE_TYPES = ["neutraali", "kaupallinen"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Sivusto, jolle lisälukemista-linkit osoittavat. */
export interface Source {
  id: string;
  /** "Pörssisäätiö" */
  name: string;
  /** "porssisaatio.fi". Kattaa myös alitunnukset, esim. www.porssisaatio.fi. */
  domain: string;
  /** kaupallinen = pankki, välittäjä, analyysitalo tms. */
  type: SourceType;
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

export const INPUT_UNITS = ["€", "€/osake", "kpl", "%"] as const;
export type InputUnit = (typeof INPUT_UNITS)[number];

/**
 * Lähtötieto: luku, josta tunnuslukuja lasketaan, mutta joka ei itse ole tunnusluku,
 * esimerkiksi osakkeen kurssi tai oma pääoma (Tutki osaketta -sivu, suunnitelman kohta 11.4).
 */
export interface InputFigure {
  /** Yksilöivä tunniste. Ei saa olla sama kuin minkään tunnusluvun id. */
  id: string;
  /** "Osakkeen kurssi" */
  name: string;
  unit: InputUnit;
  /** Muut nimet, joilla luku esiintyy sivuilla. Tekoälyhaku ja "Lisää luku" -haku käyttävät näitä. */
  aliases: string[];
  /** Sanastotermi, joka selittää luvun, esim. "pörssikurssi". */
  term?: string;
  /**
   * Kulu tai meno, jota kaavat käyttävät positiivisena, vaikka sivulla se näkyy usein
   * miinusmerkkisenä (poistot "−12 450"). Tekoälyhaku palauttaa sen positiivisena.
   */
  expense?: true;
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
