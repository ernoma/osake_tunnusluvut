import { describe, expect, it } from "vitest";
import { metrics, metricsById } from "../data/content.ts";
import {
  filterMetrics,
  matchesQuery,
  normalizeForSearch,
  revealMetric,
  type Filters,
} from "./useMetricFilter.ts";

const all: Filters = { query: "", category: null, showAdvanced: true };
const ids = (query: string, filters: Partial<Filters> = {}) =>
  filterMetrics(metrics, { ...all, ...filters, query }).visible.map((m) => m.id);

function metric(id: string) {
  const m = metricsById.get(id);
  if (!m) throw new Error(`Tunnuslukua ${id} ei löytynyt`);
  return m;
}

describe("normalizeForSearch", () => {
  it("poistaa isot kirjaimet, ääkköset ja välimerkit", () => {
    expect(normalizeForSearch("  Oman PÄÄOMAN  tuotto ")).toBe("oman paaoman tuotto");
    expect(normalizeForSearch("P/E-luku")).toBe("peluku");
    expect(normalizeForSearch("Öljy-yhtiö")).toBe("oljyyhtio");
  });
});

describe("haku", () => {
  it("”velaton” löytää EV:n synonyymin kautta", () => {
    expect(ids("velaton")).toEqual(["ev"]);
  });

  it("löytää lyhenteellä, nimellä ja synonyymillä", () => {
    expect(ids("P/E")).toContain("pe");
    expect(ids("pe")).toContain("pe");
    expect(ids("osakekohtainen tulos")).toContain("eps");
    expect(ids("payout ratio")).toEqual(["osinkosuhde"]);
    expect(ids("gearing")).toEqual(["nettovelkaantumisaste"]);
  });

  it("löytää kortin kysymyksestä", () => {
    const question = metric("pe").question;
    expect(ids(question.replace(/\[\[|\]\]/g, "").slice(0, 25))).toContain("pe");
  });

  it("löytää kategorian kysymyksestä koko ryhmän", () => {
    const priceIds = metrics.filter((m) => m.category === "arvostus").map((m) => m.id);
    expect(ids("halpa")).toEqual(expect.arrayContaining(priceIds));
  });

  it("ei välitä isoista kirjaimista eikä ääkkösistä", () => {
    expect(ids("OMAVARAISUUS")).toEqual(["omavaraisuusaste"]);
    expect(ids("oman paaoman tuotto")).toEqual(ids("Oman pääoman tuotto"));
    expect(ids("oman paaoman tuotto")).toContain("roe");
  });

  it("vaatii jokaisen hakusanan, mutta järjestyksellä ei ole väliä", () => {
    expect(ids("tuotto oman")).toContain("roe");
    expect(ids("velaton xyz")).toEqual([]);
  });

  it("tyhjä haku näyttää kaiken", () => {
    expect(ids("   ")).toHaveLength(metrics.length);
    expect(matchesQuery(metric("pe"), "")).toBe(true);
  });
});

describe("suodatus", () => {
  it("kategoria rajaa tulokset", () => {
    const result = ids("", { category: "velka" });
    expect(result).toEqual(["omavaraisuusaste", "nettovelkaantumisaste"]);
  });

  it("syventävät voi piilottaa", () => {
    const result = filterMetrics(metrics, { ...all, showAdvanced: false }).visible;
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((m) => m.level === "perus")).toBe(true);
  });

  it("kertoo osumat, jotka suodatin piilottaa", () => {
    const result = filterMetrics(metrics, {
      query: "velaton",
      category: "koko",
      showAdvanced: false,
    });
    expect(result.visible).toEqual([]);
    expect(result.hiddenMatches.map((m) => m.id)).toEqual(["ev"]);
  });
});

describe("revealMetric", () => {
  it("nollaa vain sen, mikä piilottaa luvun", () => {
    const filters: Filters = { query: "velaton", category: "velka", showAdvanced: false };
    expect(revealMetric(filters, metric("ev"))).toEqual({
      query: "velaton",
      category: null,
      showAdvanced: true,
    });
    expect(revealMetric(filters, metric("omavaraisuusaste"))).toEqual({
      query: "",
      category: "velka",
      showAdvanced: false,
    });
  });

  it("ei muuta mitään, jos luku on jo näkyvissä", () => {
    const filters: Filters = { query: "pe", category: "arvostus", showAdvanced: true };
    expect(revealMetric(filters, metric("pe"))).toEqual(filters);
  });
});
