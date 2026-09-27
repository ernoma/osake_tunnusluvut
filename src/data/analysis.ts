// Analyysinäkymän tulkinta (suunnitelman kohdat 11.4 ja 11.5): mihin nyrkkisääntöväliin arvo
// osuu, mitä lähtötietoja puuttuvan tunnusluvun laskemiseen tarvitaan ja miksi estettyä lukua
// ei laskettu. Puhtaita funktioita, jotta ne voi testata ilman käyttöliittymää.

import { displayName, figuresById } from "./content.ts";
import {
  formulas as allFormulas,
  describeFormula,
  formulaInputs,
  type Calculation,
  type Conversion,
  type Formula,
} from "./formulas.ts";
import { formatNumber, formatRate, type NumberUnit } from "./numberFormat.ts";
import type { Metric, MetricRange } from "./types.ts";

/** "Osakkeen kurssi" → "osakkeen kurssi" lauseen keskelle. */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "osakkeen kurssi ja osakekohtainen tulos (EPS)" */
export function joinNames(ids: readonly string[]): string {
  const names = ids.map((id) => {
    const info = figuresById.get(id);
    return info ? lowerFirst(displayName(info)) : id;
  });
  return names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} ja ${names.at(-1)}`;
}

/**
 * Valuuttamuunnos tekstinä: "12,6 mrd. SEK ≈ 1,12 mrd. € (1 € = 11,29 SEK)". Arvo on analyysin
 * valuutassa (kohta 11.11).
 */
export function describeConversion(
  value: number,
  unit: NumberUnit,
  conversion: Conversion,
  currency: string,
): string {
  const original = formatNumber(conversion.original, unit, conversion.currency);
  const converted = formatNumber(value, unit, currency);
  return `${original} ≈ ${converted} (${formatRate(conversion.rate, conversion.currency, currency)})`;
}

/**
 * Laskelma käyttäjän omilla luvuilla, esimerkiksi
 * "Markkina-arvo 20 mrd. € ÷ vapaa kassavirta 1,1 mrd. €". Nimet kirjoitetaan auki, koska
 * lyhenteet (FCF, EPS) eivät ole aloittelijalle tuttuja. Toisesta valuutasta muunnettu luku
 * näytetään alkuperäisenä ja muunnettuna kurssin kanssa:
 * "markkina-arvo 120 mrd. SEK ≈ 10,6 mrd. € (1 € = 11,29 SEK)".
 */
export function describeCalculation(calculation: Calculation, currency: string): string {
  const inputs = new Map(calculation.inputs.map((i) => [i.id, i]));
  const text = describeFormula(calculation.formula, (id) => {
    const info = figuresById.get(id);
    const input = inputs.get(id);
    if (!info || input === undefined) return id;
    const shown = input.conversion
      ? describeConversion(input.value, info.unit, input.conversion, currency)
      : formatNumber(input.value, info.unit, currency);
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
