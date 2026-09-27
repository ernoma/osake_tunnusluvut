import { describe, expect, it } from "vitest";
import {
  currenciesDiffer,
  currencyMixWarning,
  describeCalculation,
  figureCurrency,
  matchRange,
  missingInputs,
  mixesCurrencies,
  nonPositiveRule,
} from "./analysis.ts";
import { metricsById } from "./content.ts";
import { calculate, type KnownFigure } from "./formulas.ts";
import type { MetricRange } from "./types.ts";

const range = (min?: number, max?: number): MetricRange => ({
  label: `${min ?? ""}–${max ?? ""}`,
  meaning: "",
  tone: "neutral",
  min,
  max,
});

describe("matchRange", () => {
  // Kuten EBIT-%: aukko välien 3–5 ja 10–15 välissä.
  const ranges = [range(undefined, 0), range(0, 5), range(10, 15), range(15)];

  it("alaraja kuuluu väliin, yläraja ei", () => {
    expect(matchRange(ranges, -1)).toEqual({ kind: "in", index: 0 });
    expect(matchRange(ranges, 0)).toEqual({ kind: "in", index: 1 });
    expect(matchRange(ranges, 10)).toEqual({ kind: "in", index: 2 });
    expect(matchRange(ranges, 15)).toEqual({ kind: "in", index: 3 });
  });

  it("välien väliin osuva arvo ei osu kumpaankaan", () => {
    expect(matchRange(ranges, 7)).toEqual({ kind: "between", lower: 1 });
    expect(matchRange(ranges, 5)).toEqual({ kind: "between", lower: 1 });
  });

  it("yhden luvun väli ja välien ulkopuolelle jäävä arvo", () => {
    const dividend = [range(0, 0), range(2, 5), range(8)];
    expect(matchRange(dividend, 0)).toEqual({ kind: "in", index: 0 });
    expect(matchRange(dividend, 1)).toEqual({ kind: "between", lower: 0 });
    expect(matchRange(dividend, -1)).toEqual({ kind: "below" });
    expect(matchRange([range(0, 10)], 12)).toEqual({ kind: "above" });
  });

  it("P/E 12,4 osuu väliin 10–20", () => {
    const pe = metricsById.get("pe")!.ranges!;
    const match = matchRange(pe, 12.4);
    expect(match.kind === "in" && pe[match.index]!.label).toBe("10–20");
  });
});

describe("missingInputs", () => {
  const known = (...ids: string[]) => new Set(ids);

  it("tiedossa olevaan lukuun ei tarvita mitään", () => {
    expect(missingInputs("pe", known("pe"))).toEqual([]);
  });

  it("valitsee vaihtoehdon, jossa syötettävää on vähiten", () => {
    // P/E = kurssi ÷ EPS, kun kurssi on jo tiedossa.
    expect(missingInputs("pe", known("kurssi"))).toEqual(["eps"]);
    // P/E = markkina-arvo ÷ nettotulos, kun markkina-arvo on tiedossa.
    expect(missingInputs("pe", known("markkina-arvo"))).toEqual(["nettotulos"]);
  });

  it("välivaiheen luku lasketaan jo syötetyistä luvuista, jos se on yhtä helppoa", () => {
    // EV/EBIT: markkina-arvo on tiedossa, joten EV:hen puuttuu vain nettovelka.
    expect(missingInputs("ev-ebit", known("markkina-arvo"))).toEqual(["nettovelka", "ebit"]);
    // Kurssi ja osakemäärä antavat markkina-arvon.
    expect(missingInputs("p-fcf", known("kurssi", "osakkeiden-maara"))).toEqual([
      "vapaa-kassavirta",
    ]);
  });

  it("luku, jolle ei ole kaavaa, syötetään itse", () => {
    expect(missingInputs("liikevaihto", known())).toEqual(["liikevaihto"]);
  });
});

describe("P/FCF ja laskelman kuvaus", () => {
  it("P/FCF lasketaan markkina-arvosta ja vapaasta kassavirrasta", () => {
    const known = new Map<string, KnownFigure>([
      ["markkina-arvo", { value: 20e9, origin: "sivu" }],
      ["vapaa-kassavirta", { value: 1.1e9, origin: "sivu" }],
    ]);
    const pfcf = calculate(known).figures.get("p-fcf")!;
    expect(pfcf.origin).toBe("laskettu");
    expect(pfcf.value).toBeCloseTo(18.18, 2);
    expect(describeCalculation(pfcf.calculation!, "EUR")).toBe(
      "Markkina-arvo 20 mrd. € ÷ vapaa kassavirta 1,1 mrd. €",
    );
  });

  it("nimet kirjoitetaan auki lyhenteen sijaan", () => {
    const known = new Map<string, KnownFigure>([
      ["kurssi", { value: 20, origin: "kayttaja" }],
      ["eps", { value: 2, origin: "kayttaja" }],
    ]);
    const pe = calculate(known).figures.get("pe")!;
    expect(describeCalculation(pe.calculation!, "EUR")).toBe(
      "Osakkeen kurssi 20,00 € ÷ osakekohtainen tulos 2,00 €",
    );
  });
});

describe("valuuttojen sekoittuminen", () => {
  const sek = (entries: [string, number][]) =>
    calculate(
      new Map<string, KnownFigure>(entries.map(([id, value]) => [id, { value, origin: "sivu" }])),
    ).figures;

  it("kurssiin sidotut luvut ovat kurssin valuutassa", () => {
    expect(figureCurrency("kurssi", "EUR", "SEK")).toBe("SEK");
    expect(figureCurrency("markkina-arvo", "EUR", "SEK")).toBe("SEK");
    expect(figureCurrency("ev", "EUR", "SEK")).toBe("SEK");
    expect(figureCurrency("nettotulos", "EUR", "SEK")).toBe("EUR");
    expect(figureCurrency("kurssi", "EUR")).toBe("EUR");
  });

  it("kurssin ja tilinpäätösluvun yhdistäminen sekoittaa valuutat", () => {
    const figures = sek([
      ["kurssi", 118.4],
      ["osakkeiden-maara", 106.4e6],
      ["eps", 0.96],
      ["oma-paaoma", 741.3e6],
      ["nettovelka", 200e6],
      ["ebit", 142.7e6],
      ["osinko-per-osake", 0.5],
      ["tuloksen-kasvuennuste", 8],
    ]);
    const mixed = (id: string) => mixesCurrencies(figures.get(id)?.calculation, figures);
    // Kurssi × osakemäärä ei sekoita: osakemäärä ei ole rahamäärä.
    expect(mixed("markkina-arvo")).toBe(false);
    expect(mixed("pe")).toBe(true);
    expect(mixed("pb")).toBe(true);
    expect(mixed("osinkotuotto")).toBe(true);
    expect(mixed("ev")).toBe(true);
    expect(mixed("ev-ebit")).toBe(true);
    // PEG ei yhdistä rahamääriä, mutta sen P/E on laskettu sekoittamalla.
    expect(mixed("peg")).toBe(true);
    // Pelkät tilinpäätösluvut eivät sekoitu.
    expect(mixed("osinkosuhde")).toBe(false);
  });

  it("laskelma näyttää kurssiin sidotut luvut kurssin valuutassa", () => {
    const figures = sek([
      ["kurssi", 118.4],
      ["eps", 0.96],
    ]);
    expect(describeCalculation(figures.get("pe")!.calculation!, "EUR", "SEK")).toMatch(
      /^Osakkeen kurssi 118,40\sSEK ÷ osakekohtainen tulos 0,96\s€$/,
    );
  });

  it("varoitus nimeää molemmat valuutat", () => {
    expect(currenciesDiffer("EUR", "SEK")).toBe(true);
    expect(currenciesDiffer("EUR", "EUR")).toBe(false);
    expect(currenciesDiffer("EUR", "")).toBe(false);
    expect(currencyMixWarning("EUR", "SEK")).toMatch(
      /^Kurssi ja markkina-arvo ovat SEK-määräisiä, mutta tilinpäätösluvut EUR-määräisiä\./,
    );
  });
});

describe("nonPositiveRule", () => {
  it("löytää kortin säännön tappiolliselle yhtiölle", () => {
    expect(nonPositiveRule(metricsById.get("pe")!)).toMatch(/tappiota.*P\/E/);
    expect(nonPositiveRule(metricsById.get("p-fcf")!)).toMatch(/negatiivinen/);
  });
});
