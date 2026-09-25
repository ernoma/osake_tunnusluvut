// Varsinaisen sisällön tarkistus. Tämä testi kaatuu, jos metrics.ts, glossary.ts,
// categories.ts tai planned.ts sisältää virheen. Virheilmoitus kertoo tarkan kohdan.

import { describe, expect, it } from "vitest";
import { categories } from "./categories.ts";
import { glossary } from "./glossary.ts";
import { metrics } from "./metrics.ts";
import { planned } from "./planned.ts";
import { validateContent } from "./validate.ts";

describe("sisältö", () => {
  const result = validateContent({ metrics, planned, categories, glossary });

  it("läpäisee kaikki tarkistukset", () => {
    expect(result.errors).toEqual([]);
  });

  it("listaa tulossa-viittaukset varoituksina", () => {
    if (result.warnings.length > 0) {
      console.info(
        `Tulossa-viittauksia ${result.warnings.length}:\n  ${result.warnings.join("\n  ")}`,
      );
    }
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("sisältää vähintään yhden tunnusluvun", () => {
    expect(metrics.length).toBeGreaterThan(0);
  });
});
