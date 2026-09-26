// Nyrkkisääntövälien numeeriset rajat (suunnitelman kohta 11.5): skeema ja otsikon vastaavuus.

import { describe, expect, it } from "vitest";
import { metrics } from "./metrics.ts";
import { parseNumber } from "./numberFormat.ts";
import { metricSchema } from "./schema.ts";
import type { Metric, MetricRange } from "./types.ts";

interface Bounds {
  min?: number;
  max?: number;
}

const num = (text: string) => {
  const parsed = parseNumber(text);
  if (!parsed) throw new Error(`ei luku: "${text}"`);
  return parsed.value;
};

/**
 * Rajat, jotka otsikko ilmaisee, tai null, jos otsikon muotoa ei tunneta. Alle X -rivin alaraja
 * riippuu edellisestä rivistä (Negatiivinen, Alle 5 % → 0–5 %), joten sitä ei tarkisteta.
 */
function boundsFromLabel(label: string): (Bounds & { checkMin: boolean }) | null {
  let m: RegExpExecArray | null;
  if (label === "Negatiivinen") return { max: 0, checkMin: true };
  if ((m = /^Alle (.+)$/.exec(label))) return { max: num(m[1]!), checkMin: false };
  if ((m = /^(?:Yli|Vähintään) (.+)$/.exec(label))) return { min: num(m[1]!), checkMin: true };
  if ((m = /^(.+?)\s*–\s*(.+)$/.exec(label)))
    return { min: num(m[1]!), max: num(m[2]!), checkMin: true };
  const single = parseNumber(label);
  if (single) return { min: single.value, max: single.value, checkMin: true };
  return null;
}

describe("nyrkkisääntövälien rajat", () => {
  const withRanges = metrics.filter((m) => m.ranges);

  it("jokaisella välillä on ainakin toinen raja", () => {
    for (const m of withRanges) {
      for (const r of m.ranges!) {
        expect(r.min !== undefined || r.max !== undefined, `${m.id} "${r.label}"`).toBe(true);
      }
    }
  });

  it("rajat vastaavat otsikkoa", () => {
    const unchecked: string[] = [];
    for (const m of withRanges) {
      for (const r of m.ranges!) {
        const expected = boundsFromLabel(r.label);
        if (!expected) {
          unchecked.push(`${m.id} "${r.label}"`);
          continue;
        }
        const where = `${m.id} "${r.label}"`;
        expect(r.max, `${where}: max`).toBe(expected.max);
        if (expected.checkMin) expect(r.min, `${where}: min`).toBe(expected.min);
      }
    }
    // Muut otsikot tarkistetaan käsin. Tällä hetkellä kaikki otsikot ovat tunnettua muotoa.
    expect(unchecked).toEqual([]);
  });

  it("negatiivisen välin jälkeinen Alle X -väli alkaa nollasta", () => {
    for (const m of withRanges) {
      m.ranges!.forEach((r, i) => {
        if (r.label.startsWith("Alle") && m.ranges![i - 1]?.label === "Negatiivinen")
          expect(r.min, `${m.id} "${r.label}"`).toBe(0);
      });
    }
  });
});

describe("välien skeema", () => {
  const base = metrics.find((m) => m.id === "pe")!;
  const errorsFor = (ranges: MetricRange[]) => {
    const result = metricSchema.safeParse({ ...base, ranges } satisfies Metric);
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };
  const r = (label: string, b: Bounds): MetricRange => ({
    label,
    meaning: "Selitys.",
    tone: "neutral",
    ...b,
  });

  it("hyväksyy nousevat välit, aukot ja yhden luvun välin", () => {
    expect(
      errorsFor([
        r("Alle 0", { max: 0 }),
        r("0", { min: 0, max: 0 }),
        r("2–5", { min: 2, max: 5 }),
        r("Yli 8", { min: 8 }),
      ]),
    ).toEqual([]);
  });

  it("vaatii ainakin toisen rajan", () => {
    expect(errorsFor([r("Jotain", {})]).join()).toMatch(/min tai max/);
  });

  it("hylkää välin, jonka min on suurempi kuin max", () => {
    expect(errorsFor([r("5–3", { min: 5, max: 3 })]).join()).toMatch(/suurempi/);
  });

  it("hylkää päällekkäiset välit ja väärän järjestyksen", () => {
    expect(errorsFor([r("Alle 10", { max: 10 }), r("5–20", { min: 5, max: 20 })]).join()).toMatch(
      /edellinen väli/,
    );
    expect(errorsFor([r("10–20", { min: 10, max: 20 }), r("Alle 10", { max: 10 })]).join()).toMatch(
      /vain ensimmäiseltä/,
    );
  });

  it("vain viimeiseltä väliltä saa puuttua yläraja", () => {
    expect(errorsFor([r("Yli 10", { min: 10 }), r("Yli 20", { min: 20 })]).join()).toMatch(
      /vain viimeiseltä/,
    );
  });
});
