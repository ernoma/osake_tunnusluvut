// Esimerkkiyhtiön osoite (suunnitelman kohta 12.2). Testi kaatuu, jos tunnuslukujen tai
// kaavojen muutos hajottaa esimerkin niin, ettei se enää näytä sivun ominaisuuksia.

import { describe, expect, it } from "vitest";
import { decodeAnalysis, encodeAnalysis } from "../hooks/useAnalysisUrl.ts";
import { matchRange, missingInputs } from "./analysis.ts";
import { metrics } from "./content.ts";
import { convertFigures } from "./currency.ts";
import { EXAMPLE_NAME, EXAMPLE_SEARCH } from "./example.ts";
import { calculate } from "./formulas.ts";
import { evaluateInsights } from "./insights.ts";

const analysis = decodeAnalysis(EXAMPLE_SEARCH);
const { known, unconverted } = convertFigures(analysis.figures, analysis.currency, new Map());
const result = calculate(known);
const available = new Set(result.figures.keys());

describe("esimerkkiyhtiö", () => {
  it("osoitteen jokainen luku on tunnettu, ja osoite säilyy samana", () => {
    const params = [...new URLSearchParams(EXAMPLE_SEARCH).keys()].filter(
      (k) => !["sivu", "nimi", "val"].includes(k),
    );
    expect(analysis.figures.map((f) => f.id)).toEqual(params);
    expect(unconverted).toEqual([]);
    expect(encodeAnalysis(analysis)).toBe(EXAMPLE_SEARCH);
  });

  it("nimi kertoo, että yhtiö on esimerkki", () => {
    expect(analysis.name).toBe(EXAMPLE_NAME);
    expect(EXAMPLE_NAME).toMatch(/Esimerkki/);
  });

  it("analyysissä on ainakin yksi laskettu tunnusluku kaavoineen", () => {
    const calculated = metrics.filter((m) => result.figures.get(m.id)?.origin === "laskettu");
    expect(calculated.length).toBeGreaterThan(0);
    expect(result.figures.get("pe")?.calculation?.formula.id).toBe("pe");
  });

  it("analyysissä on puuttuva tunnusluku, jonka lähtötiedot voi lisätä", () => {
    const missing = metrics.filter((m) => !available.has(m.id) && !result.blocked.has(m.id));
    expect(missing.length).toBeGreaterThan(0);
    expect(missingInputs("peg", available)).toEqual(["tuloksen-kasvuennuste"]);
  });

  it("analyysissä on välien väliin osuva luku", () => {
    const between = metrics.filter((m) => {
      const figure = result.figures.get(m.id);
      return m.ranges && figure && matchRange(m.ranges, figure.value).kind === "between";
    });
    expect(between.map((m) => m.id)).toContain("ebit-prosentti");
  });

  it("analyysissä on ainakin yksi yhdistelmähuomio", () => {
    expect(evaluateInsights(result.figures).length).toBeGreaterThan(0);
  });

  it("kaikki luvut ovat samalta kaudelta", () => {
    for (const [id, figure] of result.figures) expect(figure.mixedPeriods, id).toBe(false);
  });
});
