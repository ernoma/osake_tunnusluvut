// Varsinaisen sisällön tarkistus. Tämä testi kaatuu, jos metrics.ts, glossary.ts,
// categories.ts tai planned.ts sisältää virheen. Virheilmoitus kertoo tarkan kohdan.

import { describe, expect, it } from "vitest";
import { categories } from "./categories.ts";
import { glossary } from "./glossary.ts";
import { inputs } from "./inputs.ts";
import { metrics } from "./metrics.ts";
import { planned } from "./planned.ts";
import { sources } from "./sources.ts";
import { validateContent } from "./validate.ts";

describe("sisältö", () => {
  const result = validateContent({ metrics, planned, categories, glossary, sources, inputs });

  it("läpäisee kaikki tarkistukset", () => {
    expect(result.errors).toEqual([]);
  });

  it("listaa varoitukset (tulossa-viittaukset ja huomiota kaipaavat linkit)", () => {
    if (result.warnings.length > 0) {
      console.info(`Varoituksia ${result.warnings.length}:\n  ${result.warnings.join("\n  ")}`);
    }
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("jokaisella tunnusluvulla on vähintään yksi lisälukemista-linkki", () => {
    for (const m of metrics) expect(m.links.length, m.id).toBeGreaterThan(0);
  });

  it("jokaisessa kategoriassa on vähintään yksi perustason tunnusluku", () => {
    for (const c of categories) {
      const basics = metrics.filter((m) => m.category === c.id && m.level === "perus");
      expect(basics.length, `kategoria ${c.id}`).toBeGreaterThan(0);
    }
  });

  it("jokainen esimerkki on laskutoimitus", () => {
    for (const m of metrics) expect(m.example, m.id).toMatch(/=/);
  });
});
