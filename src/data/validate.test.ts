// Varmistaa, että tarkistus löytää tyypilliset sisältövirheet. Käyttää omaa testiaineistoa.

import { describe, expect, it } from "vitest";
import { categories } from "./categories.ts";
import { LIMITS } from "./schema.ts";
import type { ExternalLink, GlossaryTerm, Metric, PlannedMetric, Source } from "./types.ts";
import { hostMatches, validateContent, type Content } from "./validate.ts";

const TODAY = new Date("2026-09-25T12:00:00Z");

function link(overrides: Partial<ExternalLink> = {}): ExternalLink {
  return {
    title: "Selitys ja laskuesimerkki",
    url: "https://www.esimerkki.fi/aa",
    sourceId: "esimerkki",
    language: "fi",
    kind: "selitys",
    checkedAt: "2026-09-01",
    ...overrides,
  };
}

const sources: Source[] = [
  { id: "esimerkki", name: "Esimerkki", domain: "esimerkki.fi", type: "neutraali" },
  { id: "english", name: "English", domain: "example.com", type: "kaupallinen" },
];

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
    links: [link()],
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
    sources,
    ...overrides,
  };
}

function validate(c: Content) {
  return validateContent(c, { today: TODAY });
}

function errorsOf(c: Content) {
  return validate(c).errors.join("\n");
}

/** Kelvollinen sisältö, jossa tunnusluvun aa linkit on korvattu. */
function withLinks(links: ExternalLink[]) {
  const c = content();
  return { ...c, metrics: [metric({ links }), ...c.metrics.slice(1)] };
}

describe("validateContent", () => {
  it("hyväksyy kelvollisen sisällön", () => {
    expect(validate(content())).toEqual({ errors: [], warnings: [] });
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
    const result = validate(content({ metrics: [metric()], planned }));
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
    expect(validate(content({ metrics: [metric(), m] })).errors).toEqual([]);
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

describe("lisälukemista-linkit", () => {
  it("vaatii https-osoitteen", () => {
    expect(errorsOf(withLinks([link({ url: "http://www.esimerkki.fi/aa" })]))).toMatch(
      /links\.0\.url: osoitteen pitää alkaa https:\/\//,
    );
    expect(errorsOf(withLinks([link({ url: "ei osoite" })]))).toMatch(/osoite ei ole kelvollinen/);
  });

  it("vaatii, että osoite kuuluu sivuston verkkotunnukseen", () => {
    expect(errorsOf(withLinks([link({ url: "https://huijaus-esimerkki.fi/aa" })]))).toMatch(
      /aa\.links\[0\]: osoite .* ei ole sivuston esimerkki\.fi osoite/,
    );
    expect(errorsOf(withLinks([link({ sourceId: "tuntematon" })]))).toMatch(
      /tuntematon sivusto "tuntematon"/,
    );
  });

  it("hyväksyy verkkotunnuksen ja sen alitunnukset", () => {
    expect(hostMatches("https://esimerkki.fi/a", "esimerkki.fi")).toBe(true);
    expect(hostMatches("https://www.esimerkki.fi/a", "esimerkki.fi")).toBe(true);
    expect(hostMatches("https://esimerkki.fi.huijaus.com/a", "esimerkki.fi")).toBe(false);
    expect(hostMatches("https://huijausesimerkki.fi/a", "esimerkki.fi")).toBe(false);
  });

  it("löytää saman osoitteen kahdesti ja liian monta linkkiä", () => {
    expect(errorsOf(withLinks([link(), link({ title: "Toinen" })]))).toMatch(
      /aa: linkki https:\/\/www\.esimerkki\.fi\/aa on listattu useasti/,
    );
    const four = [1, 2, 3, 4].map((n) => link({ url: `https://www.esimerkki.fi/${n}` }));
    expect(errorsOf(withLinks(four))).toMatch(/enintään 3 lisälukemista-linkkiä/);
  });

  it("vaatii suomenkieliset linkit ensin", () => {
    const en = link({ url: "https://example.com/aa", sourceId: "english", language: "en" });
    expect(errorsOf(withLinks([en, link()]))).toMatch(
      /suomenkieliset linkit kuuluvat listassa ensin/,
    );
    expect(errorsOf(withLinks([link(), en]))).toBe("");
  });

  it("tarkistaa checkedAt-päivämäärän", () => {
    expect(errorsOf(withLinks([link({ checkedAt: "2026-02-30" })]))).toMatch(
      /päivämäärä ei ole kelvollinen/,
    );
    expect(errorsOf(withLinks([link({ checkedAt: "25.9.2026" })]))).toMatch(/VVVV-KK-PP/);
    expect(errorsOf(withLinks([link({ checkedAt: "2026-09-26" })]))).toMatch(
      /checkedAt 2026-09-26 on tulevaisuudessa/,
    );
    expect(errorsOf(withLinks([link({ checkedAt: "2026-09-25" })]))).toBe("");
  });

  it("varoittaa vanhasta, puuttuvasta ja vain englanninkielisestä linkistä", () => {
    expect(validate(withLinks([link({ checkedAt: "2025-09-25" })])).warnings).toEqual([]);
    expect(validate(withLinks([link({ checkedAt: "2025-09-24" })])).warnings).toEqual([
      "aa.links[0]: luettu viimeksi 2025-09-24, lue sisältö uudelleen",
    ]);
    expect(validate(withLinks([])).warnings).toEqual(["aa: ei yhtään lisälukemista-linkkiä"]);
    const en = link({ url: "https://example.com/aa", sourceId: "english", language: "en" });
    expect(validate(withLinks([en])).warnings).toEqual([
      "aa: ei yhtään suomenkielistä lisälukemista-linkkiä",
    ]);
  });

  it("tarkistaa sivustojen rakenteen ja yksilöllisyyden", () => {
    const bad: Source = { id: "esimerkki", name: "X", domain: "https://x.fi/", type: "neutraali" };
    const errors = errorsOf(content({ sources: [...sources, bad] }));
    expect(errors).toMatch(/sivuston id "esimerkki" on käytössä useasti/);
    expect(errors).toMatch(/sivusto esimerkki\.domain: verkkotunnus ilman https/);
  });
});
