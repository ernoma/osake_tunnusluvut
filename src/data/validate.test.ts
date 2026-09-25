// Varmistaa, että tarkistus löytää tyypilliset sisältövirheet. Käyttää omaa testiaineistoa.

import { describe, expect, it } from "vitest";
import { categories } from "./categories.ts";
import { LIMITS } from "./schema.ts";
import type { GlossaryTerm, Metric, PlannedMetric } from "./types.ts";
import { validateContent, type Content } from "./validate.ts";

function metric(overrides: Partial<Metric> = {}): Metric {
  return {
    id: "aa",
    name: "AA-luku",
    abbreviation: "AA",
    aliases: [],
    category: "arvostus",
    level: "perus",
    question: "Mitä AA kertoo?",
    summary: "Lyhyt selitys, jossa on [[termi]].",
    analogy: "Vertaus.",
    formula: { words: "A ÷ B" },
    example: "10 ÷ 2 = 5.",
    unit: "x",
    direction: "lower",
    directionLabel: "Pienempi = yleensä halvempi",
    rules: ["Sääntö."],
    commonMistake: "Virhe.",
    factors: [],
    pitfalls: [],
    companions: [{ id: "bb", reason: "Syy." }],
    ...overrides,
  };
}

const glossaryTerm: GlossaryTerm = {
  id: "termi",
  term: "termi",
  forms: [],
  definition: "Selitys.",
};

function content(overrides: Partial<Content> = {}): Content {
  return {
    metrics: [
      metric(),
      metric({
        id: "bb",
        name: "BB-luku",
        abbreviation: "BB",
        companions: [{ id: "aa", reason: "Syy." }],
      }),
    ],
    planned: [],
    categories,
    glossary: [glossaryTerm],
    ...overrides,
  };
}

function errorsOf(c: Content) {
  return validateContent(c).errors.join("\n");
}

describe("validateContent", () => {
  it("hyväksyy kelvollisen sisällön", () => {
    expect(validateContent(content())).toEqual({ errors: [], warnings: [] });
  });

  it("löytää päällekkäiset id:t", () => {
    expect(errorsOf(content({ metrics: [metric(), metric({ name: "Toinen" })] }))).toMatch(
      /id "aa" on käytössä useasti/,
    );
  });

  it("löytää tuntemattoman rinnakkaistunnusluvun ja itseviittauksen", () => {
    const errors = errorsOf(
      content({
        metrics: [
          metric({
            companions: [
              { id: "zz", reason: "x" },
              { id: "aa", reason: "x" },
            ],
          }),
        ],
      }),
    );
    expect(errors).toMatch(/aa → zz: tuntematon/);
    expect(errors).toMatch(/ei voi viitata itseensä/);
  });

  it("antaa varoituksen tulossa-viittauksesta", () => {
    const planned: PlannedMetric[] = [{ id: "bb", name: "BB-luku", category: "arvostus" }];
    const result = validateContent(content({ metrics: [metric()], planned }));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(['aa → bb: näytetään "tulossa"-tilassa']);
  });

  it("vaatii poistamaan kirjoitetun tunnusluvun tulossa-listalta", () => {
    const planned: PlannedMetric[] = [{ id: "bb", name: "BB-luku (vanha)", category: "arvostus" }];
    expect(errorsOf(content({ planned }))).toMatch(/"bb" on jo kirjoitettu tunnusluku/);
  });

  it("löytää tuntemattoman ja rikkinäisen sanastotermin", () => {
    const errors = errorsOf(
      content({ metrics: [metric({ summary: "[[tuntematon]] ja [[rikki", companions: [] })] }),
    );
    expect(errors).toMatch(/termiä \[\[tuntematon\]\] ei löydy/);
    expect(errors).toMatch(/rikkinäinen/);
  });

  it("tunnistaa tunnusluvun nimen ja lyhenteen termeiksi", () => {
    const m = metric({
      id: "bb",
      name: "BB-luku",
      abbreviation: "BB",
      summary: "Katso [[AA]] ja [[aa-luku]].",
      companions: [{ id: "aa", reason: "x" }],
    });
    expect(validateContent(content({ metrics: [metric(), m] })).errors).toEqual([]);
  });

  it("löytää termin, joka osoittaa kahteen kohteeseen", () => {
    const glossary = [glossaryTerm, { ...glossaryTerm, id: "toinen", term: "AA" }];
    expect(errorsOf(content({ glossary }))).toMatch(/"aa" viittaa sekä/);
  });

  it("valvoo pituusrajoja näkyvästä tekstistä", () => {
    const long = "a".repeat(LIMITS.summary + 1);
    expect(errorsOf(content({ metrics: [metric({ summary: long })] }))).toMatch(
      /aa\.summary: .*160/,
    );
    // Merkinnät eivät kasvata pituutta: 150 näkyvää merkkiä + [[termi|...]]-merkintä
    const ok = `${"a".repeat(150)}[[termi|b]]`;
    expect(errorsOf(content({ metrics: [metric({ summary: ok })] }))).not.toMatch(/summary/);
  });

  it("vaatii 1–3 tulkintasääntöä ja kysymysmerkin", () => {
    expect(errorsOf(content({ metrics: [metric({ rules: [] })] }))).toMatch(
      /vähintään yksi tulkintasääntö/,
    );
    expect(errorsOf(content({ metrics: [metric({ rules: ["1", "2", "3", "4"] })] }))).toMatch(
      /enintään 3 tulkintasääntöä/,
    );
    expect(errorsOf(content({ metrics: [metric({ question: "Ei kysymys." })] }))).toMatch(
      /\?-merkkiin/,
    );
  });

  it("löytää puuttuvan kategorian", () => {
    expect(errorsOf(content({ categories: categories.filter((c) => c.id !== "velka") }))).toMatch(
      /kategoria "velka" puuttuu/,
    );
  });

  it("tarkistaa sanaston tunnuslukulinkin", () => {
    const glossary = [{ ...glossaryTerm, relatedMetricId: "zz" }];
    expect(errorsOf(content({ glossary }))).toMatch(/tuntematon relatedMetricId "zz"/);
  });
});
