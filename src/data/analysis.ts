// Analyysinäkymän tulkinta (suunnitelman kohdat 11.4 ja 11.5): mihin nyrkkisääntöväliin arvo
// osuu, mitä lähtötietoja puuttuvan tunnusluvun laskemiseen tarvitaan ja miksi estettyä lukua
// ei laskettu. Puhtaita funktioita, jotta ne voi testata ilman käyttöliittymää.

import { figuresById } from "./content.ts";
import {
  formulas as allFormulas,
  describeFormula,
  formulaInputs,
  type Calculation,
  type Formula,
  type ResolvedFigure,
} from "./formulas.ts";
import { formatNumber } from "./numberFormat.ts";
import type { Metric, MetricRange } from "./types.ts";

/** "Osakkeen kurssi" → "osakkeen kurssi" lauseen keskelle. */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// Valuuttojen sekoittuminen (kohta 11.11)

/** Kurssiin sidotut rahamäärät, jotka ilmoitetaan kurssin valuutassa. */
export const PRICE_BOUND_IDS: ReadonlySet<string> = new Set(["kurssi", "markkina-arvo", "ev"]);

/**
 * Luvun valuutta: kurssiin sidotulla luvulla kurssin valuutta, jos se on annettu, muuten
 * analyysin (tilinpäätöksen) valuutta.
 */
export function figureCurrency(id: string, currency: string, priceCurrency = ""): string {
  return priceCurrency && PRICE_BOUND_IDS.has(id) ? priceCurrency : currency;
}

/** Ovatko kurssi ja tilinpäätösluvut eri valuutoissa. */
export function currenciesDiffer(currency: string, priceCurrency: string): boolean {
  return priceCurrency !== "" && priceCurrency !== currency;
}

/** Varoitus, kun kurssi ja tilinpäätösluvut ovat eri valuutoissa. */
export function currencyMixWarning(currency: string, priceCurrency: string): string {
  return (
    `Kurssi ja markkina-arvo ovat ${priceCurrency}-määräisiä, mutta tilinpäätösluvut ` +
    `${currency}-määräisiä. Tunnusluvut, joissa ne yhdistetään (esim. P/E ja P/B), menevät ` +
    "väärin. Muunna kurssi ja markkina-arvo samaan valuuttaan tai jätä ne pois."
  );
}

const isMoney = (id: string) => {
  const unit = figuresById.get(id)?.unit;
  return unit === "€" || unit === "€/osake";
};

/**
 * Yhdistääkö laskelma kurssiin sidotun rahamäärän (kurssi, markkina-arvo, EV) tilinpäätöksen
 * rahamäärään. Myös laskelma, jonka lähtöluku on itse laskettu sekoittamalla, on sekoittunut:
 * EV/EBIT sekoittuu, jos EV on laskettu markkina-arvosta ja nettovelasta.
 */
export function mixesCurrencies(
  calculation: Calculation | undefined,
  figures: ReadonlyMap<string, ResolvedFigure>,
): boolean {
  if (!calculation) return false;
  let price = false;
  let statement = false;
  for (const { id } of calculation.inputs) {
    const input = figures.get(id);
    if (input?.origin === "laskettu" && mixesCurrencies(input.calculation, figures)) return true;
    if (!isMoney(id)) continue;
    if (PRICE_BOUND_IDS.has(id)) price = true;
    else statement = true;
  }
  return price && statement;
}

/**
 * Laskelma käyttäjän omilla luvuilla, esimerkiksi
 * "Markkina-arvo 20 mrd. € ÷ vapaa kassavirta 1,1 mrd. €". Nimet kirjoitetaan auki, koska
 * lyhenteet (FCF, EPS) eivät ole aloittelijalle tuttuja. Kurssiin sidotut luvut näytetään
 * kurssin valuutassa (priceCurrency), jos se on annettu.
 */
export function describeCalculation(
  calculation: Calculation,
  currency: string,
  priceCurrency = "",
): string {
  const values = new Map(calculation.inputs.map((i) => [i.id, i.value]));
  const text = describeFormula(calculation.formula, (id) => {
    const info = figuresById.get(id);
    const value = values.get(id);
    if (!info || value === undefined) return id;
    const shown = formatNumber(value, info.unit, figureCurrency(id, currency, priceCurrency));
    return `${lowerFirst(info.name)} ${shown}`;
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type RangeMatch =
  /** Arvo osuu riville index. */
  | { kind: "in"; index: number }
  /** Arvo on rivien lower ja lower + 1 välissä, eli se ei osu kumpaankaan. */
  | { kind: "between"; lower: number }
  /** Arvo on pienempi kuin ensimmäisen rivin alaraja. */
  | { kind: "below" }
  /** Arvo on vähintään viimeisen rivin yläraja. */
  | { kind: "above" };

/** Osuuko arvo väliin. Alaraja kuuluu väliin, yläraja ei. Yhden luvun välillä min = max. */
export function inRange(range: MetricRange, value: number): boolean {
  if (range.min !== undefined && range.min === range.max) return value === range.min;
  return (
    (range.min === undefined || value >= range.min) &&
    (range.max === undefined || value < range.max)
  );
}

/** Mihin nousevassa järjestyksessä olevista väleistä arvo osuu. */
export function matchRange(ranges: readonly MetricRange[], value: number): RangeMatch {
  const index = ranges.findIndex((r) => inRange(r, value));
  if (index !== -1) return { kind: "in", index };
  const first = ranges[0];
  if (first?.min !== undefined && value < first.min) return { kind: "below" };
  for (let i = 0; i < ranges.length - 1; i++) {
    const next = ranges[i + 1]!;
    if (next.min === undefined || value < next.min) return { kind: "between", lower: i };
  }
  return { kind: "above" };
}

/**
 * Lähtöluvut, jotka käyttäjän pitää syöttää, jotta tunnusluvun voi laskea. Vaihtoehdoista
 * valitaan se, jossa syötettäviä on vähiten. Välivaiheen luvun (esim. nettovelka) voi syöttää
 * suoraan tai laskea sen omista lähtöluvuista (korolliset velat ja kassa). Tasatilanteessa
 * kaava voittaa, koska silloin käytetään jo syötettyjä lukuja.
 *
 * Palauttaa tyhjän listan, jos luku on jo tiedossa, ja listan [id], jos lukua ei voi laskea
 * minkään kaavan avulla (se pitää syöttää itse).
 */
export function missingInputs(
  id: string,
  known: ReadonlySet<string>,
  formulaList: readonly Formula[] = allFormulas,
): string[] {
  const solve = (target: string, visiting: ReadonlySet<string>, top: boolean): string[] | null => {
    if (known.has(target)) return [];
    if (visiting.has(target)) return null;
    const next = new Set(visiting).add(target);
    let best: string[] | null = null;
    for (const formula of formulaList) {
      if (formula.target !== target) continue;
      const leaves = new Set<string>();
      let possible = true;
      for (const input of formulaInputs(formula)) {
        const sub = solve(input, next, false);
        if (sub === null) {
          possible = false;
          break;
        }
        sub.forEach((leaf) => leaves.add(leaf));
      }
      if (possible && (best === null || leaves.size < best.length)) best = [...leaves];
    }
    if (top) return best ?? [target];
    return best !== null && best.length <= 1 ? best : [target];
  };
  return solve(id, new Set(), true) ?? [id];
}

const NOT_USABLE = /negatiivi|tappio/i;

/**
 * Kortin sääntö, joka kertoo, miksi tunnuslukua ei voi käyttää, kun nimittäjä on nolla tai
 * negatiivinen, esim. "Jos yhtiö tekee tappiota, P/E:tä ei voi käyttää."
 */
export function nonPositiveRule(metric: Metric): string | undefined {
  return [...metric.rules, ...metric.pitfalls, ...metric.factors].find(
    (text) => NOT_USABLE.test(text) && /ei voi|ei toimi|ei kerro|mieletön/i.test(text),
  );
}
