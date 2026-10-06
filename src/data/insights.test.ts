import { describe, expect, it } from "vitest";
import { figuresById, glossary, metrics, planned } from "./content.ts";
import { calculate, type KnownFigure, type Period, type ResolvedFigure } from "./formulas.ts";
import { evaluateInsights, insights } from "./insights.ts";
import { hasMalformedMarkup, termKeys, toPlainText } from "./richText.ts";
import { LIMITS } from "./schema.ts";
import { buildTermIndex } from "./terms.ts";

const figures = (values: Record<string, number>, period: Period = "toteutunut") =>
  new Map<string, ResolvedFigure>(
    Object.entries(values).map(([id, value]) => [
      id,
      { value, origin: "sivu", period, mixedPeriods: false },
    ]),
  );

const fired = (values: Record<string, number>) =>
  evaluateInsights(figures(values)).map((f) => f.insight.id);

/** Jokaiselle säännölle luvut, joilla se laukeaa, ja luvut, joilla se ei laukea. */
const examples: Record<string, { fires: Record<string, number>; quiet: Record<string, number> }> = {
  "osinko-yli-tuloksen": { fires: { osinkosuhde: 120 }, quiet: { osinkosuhde: 60 } },
  "osinko-yli-kassavirran": {
    fires: { "osinko-per-osake": 1, "osakkeiden-maara": 100e6, "vapaa-kassavirta": 80e6 },
    quiet: { "osinko-per-osake": 1, "osakkeiden-maara": 100e6, "vapaa-kassavirta": 150e6 },
  },
  "roe-velasta": { fires: { roe: 20, roi: 10 }, quiet: { roe: 12, roi: 10 } },
  "kassavirta-alle-tuloksen": {
    fires: { "liiketoiminnan-kassavirta": 50e6, nettotulos: 100e6 },
    quiet: { "liiketoiminnan-kassavirta": 120e6, nettotulos: 100e6 },
  },
  "investoinnit-yli-kassavirran": {
    fires: { ebitda: 200e6, "vapaa-kassavirta": -30e6 },
    quiet: { ebitda: 200e6, "vapaa-kassavirta": 30e6 },
  },
  "ev-ebit-yli-pe": { fires: { pe: 12, "ev-ebit": 14 }, quiet: { pe: 15, "ev-ebit": 11 } },
  "pe-paljon-yli-ev-ebit": {
    fires: { pe: 24, "ev-ebit": 10 },
    quiet: { pe: 15, "ev-ebit": 11 },
  },
  "velka-ja-osinko": {
    fires: { "nettovelka-ebitda": 4, osinkosuhde: 80 },
    quiet: { "nettovelka-ebitda": 2, osinkosuhde: 80 },
  },
  "velka-ja-korot": {
    fires: { "nettovelka-ebitda": 4, korkokate: 2 },
    quiet: { "nettovelka-ebitda": 4, korkokate: 5 },
  },
};

describe("yhdistelmähuomiot", () => {
  it("jokaisella säännöllä on testiesimerkki", () => {
    expect(Object.keys(examples).sort()).toEqual(insights.map((i) => i.id).sort());
  });

  for (const insight of insights) {
    describe(insight.id, () => {
      const example = examples[insight.id]!;

      it("laukeaa esimerkissään", () => {
        expect(fired(example.fires)).toContain(insight.id);
      });

      it("ei laukea, kun ehto ei täyty", () => {
        expect(fired(example.quiet)).not.toContain(insight.id);
      });

      it("ei laukea, kun jokin sen luvuista puuttuu", () => {
        for (const id of insight.figures) {
          const without = Object.fromEntries(
            Object.entries(example.fires).filter(([key]) => key !== id),
          );
          expect(fired(without), `ilman lukua ${id}`).not.toContain(insight.id);
        }
      });

      it("esimerkki käyttää vain säännön lukuja", () => {
        expect(Object.keys(example.fires).sort()).toEqual([...insight.figures].sort());
      });
    });
  }

  it("palauttaa luvut ja johdetun luvun", () => {
    const [result] = evaluateInsights(
      figures({ "osinko-per-osake": 1.5, "osakkeiden-maara": 100e6, "vapaa-kassavirta": 80e6 }),
    );
    expect(result?.values).toEqual([
      { id: "osinko-per-osake", value: 1.5 },
      { id: "osakkeiden-maara", value: 100e6 },
      { id: "vapaa-kassavirta", value: 80e6 },
    ]);
    expect(result?.derived).toBe(150e6);
    expect(result?.mixedPeriods).toBe(false);
  });

  it("merkitsee eri kausien luvut", () => {
    const values = new Map([
      ...figures({ roe: 20 }, "toteutunut"),
      ...figures({ roi: 10 }, "ennuste"),
    ]);
    expect(evaluateInsights(values)[0]?.mixedPeriods).toBe(true);
  });

  it("laukeaa myös lasketuista luvuista", () => {
    const known = new Map<string, KnownFigure>(
      Object.entries({ "osinko-per-osake": 1.2, eps: 1 }).map(([id, value]) => [
        id,
        { value, origin: "kayttaja", period: "toteutunut" },
      ]),
    );
    const { figures: resolved } = calculate(known);
    expect(evaluateInsights(resolved).map((f) => f.insight.id)).toEqual(["osinko-yli-tuloksen"]);
  });
});

describe("yhdistelmähuomioiden sisältö", () => {
  const { index } = buildTermIndex(metrics, planned, glossary);

  it("id:t ovat yksilöllisiä", () => {
    const ids = insights.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const insight of insights) {
    it(`${insight.id}: luvut, pituudet ja sanastoviittaukset`, () => {
      expect(insight.figures.length).toBeGreaterThan(0);
      for (const id of insight.figures) expect(figuresById.has(id), id).toBe(true);
      expect(insight.title.length).toBeLessThanOrEqual(LIMITS.question);
      expect(toPlainText(insight.text).length).toBeLessThanOrEqual(LIMITS.listItem);
      expect(hasMalformedMarkup(insight.text)).toBe(false);
      for (const key of termKeys(insight.text)) expect(index.has(key), key).toBe(true);
    });

    it(`${insight.id}: ei kehota ostamaan tai myymään`, () => {
      const text = `${insight.title} ${toPlainText(insight.text)}`;
      expect(text).not.toMatch(/\b(osta|ostaa|osto|myy|myydä|myynti)\w*/i);
    });
  }
});
