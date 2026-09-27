import { describe, expect, it } from "vitest";
import { describeCalculation } from "./analysis.ts";
import {
  convertFigures,
  currencyOf,
  needsConversion,
  ratesNeeded,
  unconvertedText,
} from "./currency.ts";
import type { RateState } from "./exchangeRates.ts";
import { calculate } from "./formulas.ts";

const ready = (currency: string, rate: number): [string, RateState] => [
  currency,
  { status: "valmis", rate: { currency, rate, date: "2026-09-25" } },
];

/** Ruotsalainen yhtiö: kurssi kruunuina, tilinpäätös euroina. */
const sekFigures = [
  { id: "kurssi", value: 118.4, origin: "sivu" as const, currency: "SEK" },
  { id: "eps", value: 0.96, origin: "sivu" as const, period: "toteutunut" as const },
  { id: "osakkeiden-maara", value: 106.4e6, origin: "sivu" as const },
];

describe("luvun valuutta", () => {
  it("vain rahamäärällä on oma valuutta", () => {
    expect(currencyOf({ id: "kurssi", currency: "SEK" }, "EUR")).toBe("SEK");
    expect(currencyOf({ id: "kurssi" }, "EUR")).toBe("EUR");
    expect(currencyOf({ id: "pe", currency: "SEK" }, "EUR")).toBe("EUR");
    expect(needsConversion({ id: "kurssi", currency: "EUR" }, "EUR")).toBe(false);
  });

  it("kurssit tarvitaan luvun ja analyysin valuutalle, ei eurolle", () => {
    expect(ratesNeeded(sekFigures, "EUR")).toEqual(["SEK"]);
    expect(ratesNeeded(sekFigures, "USD")).toEqual(["SEK", "USD"]);
    expect(ratesNeeded([{ id: "kurssi" }], "USD")).toEqual([]);
    expect(ratesNeeded([{ id: "kurssi", currency: "EUR" }], "USD")).toEqual(["USD"]);
  });
});

describe("convertFigures", () => {
  it("muuntaa kruunut euroiksi, ja P/E lasketaan oikein", () => {
    const { known, unconverted } = convertFigures(
      sekFigures,
      "EUR",
      new Map([ready("SEK", 11.29)]),
    );
    expect(unconverted).toEqual([]);
    const price = known.get("kurssi")!;
    expect(price.value).toBeCloseTo(118.4 / 11.29, 10);
    expect(price.conversion).toEqual({
      currency: "SEK",
      original: 118.4,
      rate: 11.29,
      date: "2026-09-25",
    });
    expect(known.get("eps")).toEqual({ value: 0.96, origin: "sivu", period: "toteutunut" });

    const pe = calculate(known).figures.get("pe")!;
    // 118,40 SEK ≈ 10,49 € ja 10,49 € ÷ 0,96 € ≈ 10,9. Ilman muunnosta tulos olisi 123.
    expect(pe.value).toBeCloseTo(118.4 / 11.29 / 0.96, 10);
    expect(describeCalculation(pe.calculation!, "EUR")).toMatch(
      /^Osakkeen kurssi 118,40\sSEK ≈ 10,49\s€ \(1\s€ = 11,29\sSEK\) ÷ osakekohtainen tulos 0,96\s€$/,
    );
    // Markkina-arvo lasketaan muunnetusta kurssista.
    const cap = calculate(known).figures.get("markkina-arvo")!;
    expect(cap.value).toBeCloseTo((118.4 / 11.29) * 106.4e6, 0);
  });

  it("ristikurssi euron kautta, kun analyysi ei ole euroissa", () => {
    const rates = new Map([ready("SEK", 11.29), ready("USD", 1.14)]);
    const { known } = convertFigures(sekFigures, "USD", rates);
    const conversion = known.get("kurssi")!.conversion!;
    expect(conversion.rate).toBeCloseTo(11.29 / 1.14, 10);
    expect(known.get("kurssi")!.value).toBeCloseTo((118.4 / 11.29) * 1.14, 10);
    expect(describeCalculation(calculate(known).figures.get("pe")!.calculation!, "USD")).toMatch(
      /\(1\sUSD = 9,9035\sSEK\)/,
    );
  });

  it("kun kurssia ei saada, eri valuutan lukua ei käytetä", () => {
    const failed = new Map<string, RateState>([["SEK", { status: "virhe", reason: "verkko" }]]);
    const { known, unconverted } = convertFigures(sekFigures, "EUR", failed);
    expect(known.has("kurssi")).toBe(false);
    expect(known.has("eps")).toBe(true);
    expect(unconverted).toEqual([
      { id: "kurssi", currency: "SEK", reason: "verkko", failed: "SEK" },
    ]);
    expect(calculate(known).figures.has("pe")).toBe(false);
    expect(unconvertedText(unconverted[0]!, "Osakkeen kurssi", "EUR")).toBe(
      "Osakkeen kurssi on SEK-määräinen, eikä sitä voitu muuntaa valuuttaan EUR, joten sitä ei " +
        "käytetä laskennassa. Valuuttakurssin haku ei onnistunut. Tarkista verkkoyhteys.",
    );
  });

  it("analyysin valuutan kurssin puuttuminen estää muunnoksen", () => {
    const rates = new Map<string, RateState>([
      ready("SEK", 11.29),
      ["XYZ", { status: "virhe", reason: "valuutta" }],
    ]);
    const { unconverted } = convertFigures(sekFigures, "XYZ", rates);
    expect(unconverted).toEqual([
      { id: "kurssi", currency: "SEK", reason: "valuutta", failed: "XYZ" },
    ]);
  });

  it("haun aikana luku odottaa", () => {
    const { known, unconverted } = convertFigures(sekFigures, "EUR", new Map());
    expect(known.has("kurssi")).toBe(false);
    expect(unconverted[0]?.reason).toBe("haetaan");
  });
});
