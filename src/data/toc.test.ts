import { describe, expect, it } from "vitest";
import { metrics, metricsById } from "./content.ts";
import { tocEntries } from "./toc.ts";
import type { Metric } from "./types.ts";

describe("tocEntries", () => {
  const entries = tocEntries(metrics);

  it("sisältää jokaisen tunnusluvun nimellä ja lyhenteen, jos se puuttuu nimestä", () => {
    for (const m of metrics) {
      expect(entries).toContainEqual({ id: m.id, label: m.name });
    }
    const abbreviations = entries.filter((e) => e.accessibleName).map((e) => e.label);
    expect(abbreviations.sort()).toEqual(["EBIT", "EBIT-%", "EBITDA", "EPS", "EV", "ROE"]);
    expect(abbreviations).not.toContain("P/E");
  });

  it("jokainen rivi vie olemassa olevaan korttiin", () => {
    for (const e of entries) expect(metricsById.has(e.id)).toBe(true);
  });

  it("lyhennerivin saavutettava nimi kertoo, mistä luvusta on kyse", () => {
    expect(entries.find((e) => e.label === "EPS")?.accessibleName).toBe(
      "EPS, osakekohtainen tulos",
    );
    const names = entries.map((e) => e.accessibleName ?? e.label);
    expect(new Set(names).size).toBe(names.length);
  });

  it("järjestää suomen aakkosten mukaan", () => {
    const labels = entries.map((e) => e.label);
    expect(labels.slice(0, 9)).toEqual([
      "EBIT",
      "EBIT-%",
      "EBITDA",
      "EPS",
      "EV",
      "EV/EBIT-luku",
      "EV/Sales-luku",
      "Käyttökate",
      "Liikevaihto",
    ]);
    expect(labels.at(-1)).toBe("Yritysarvo");

    const fake = (id: string, name: string) => ({ id, name }) as Metric;
    const sorted = tocEntries([
      fake("o", "Öljy"),
      fake("a", "Ääni"),
      fake("z", "Zeta"),
      fake("b", "Aalto"),
    ]);
    expect(sorted.map((e) => e.label)).toEqual(["Aalto", "Zeta", "Ääni", "Öljy"]);
  });
});
