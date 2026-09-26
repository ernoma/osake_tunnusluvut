import { describe, expect, it } from "vitest";
import { formatNumber, parseNumber } from "./numberFormat.ts";

const value = (text: string) => parseNumber(text)?.value;

/** Intl käyttää sitovaa välilyöntiä ja oikeaa miinusmerkkiä. Testeissä verrataan tavallisiin. */
const plain = (s: string) => s.replace(/\u00a0/g, " ").replace(/\u2212/g, "-");

describe("parseNumber", () => {
  it("jäsentää suomalaisen muodon", () => {
    expect(value("12,4")).toBe(12.4);
    expect(value("1 234,5")).toBe(1234.5);
    expect(value("1\u00a0234\u00a0567")).toBe(1234567);
    expect(value("1.234,5")).toBe(1234.5);
  });

  it("jäsentää englantilaisen muodon", () => {
    expect(value("12.4")).toBe(12.4);
    expect(value("1,234.5")).toBe(1234.5);
    expect(value("1,234,567")).toBe(1234567);
  });

  it("tulkitsee yksittäisen pilkun desimaalipilkuksi", () => {
    expect(value("1,234")).toBe(1.234);
  });

  it("muuntaa kerroinsanat perusyksiköksi", () => {
    expect(value("1,2 mrd")).toBe(1_200_000_000);
    expect(value("1,2 mrd. €")).toBe(1_200_000_000);
    expect(value("150 milj. €")).toBe(150_000_000);
    expect(value("150 miljoonaa euroa")).toBe(150_000_000);
    expect(value("2 miljardia")).toBe(2_000_000_000);
    expect(value("350 M€")).toBe(350_000_000);
    expect(value("350 MEUR")).toBe(350_000_000);
    expect(value("2.4B")).toBe(2_400_000_000);
    expect(value("12 t€")).toBe(12_000);
    expect(value("1,1 mrd.")).toBe(1_100_000_000);
  });

  it("tunnistaa prosentit ja yksiköt", () => {
    expect(parseNumber("12 %")).toEqual({ value: 12, percent: true });
    expect(parseNumber("12,5%")).toEqual({ value: 12.5, percent: true });
    expect(parseNumber("25 €")).toEqual({ value: 25, percent: false });
    expect(value("€ 25")).toBe(25);
    expect(value("18,0x")).toBe(18);
    expect(value("5 milj. kpl")).toBe(5_000_000);
  });

  it("jäsentää negatiiviset luvut kaikilla miinusmerkeillä", () => {
    expect(value("-5")).toBe(-5);
    expect(value("\u22125,5")).toBe(-5.5);
    expect(value("– 120 milj. €")).toBe(-120_000_000);
  });

  it("hylkää tekstin, joka ei ole luku", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("12 omenaa")).toBeNull();
    expect(parseNumber("1,2,3")).toBeNull();
  });
});

describe("formatNumber", () => {
  it("lyhentää suuret euromäärät", () => {
    expect(plain(formatNumber(20_000_000_000, "€"))).toBe("20 mrd. €");
    expect(plain(formatNumber(1_100_000_000, "€"))).toBe("1,1 mrd. €");
    expect(plain(formatNumber(150_000_000, "€"))).toBe("150 milj. €");
    expect(plain(formatNumber(300_000, "€"))).toBe("300 000 €");
    expect(plain(formatNumber(-60_000_000, "€"))).toBe("-60 milj. €");
  });

  it("muotoilee prosentit, kertoimet ja osakekohtaiset luvut", () => {
    expect(plain(formatNumber(12.34, "%"))).toBe("12,3 %");
    expect(plain(formatNumber(18, "x"))).toBe("18,0");
    expect(plain(formatNumber(2.5, "€/osake"))).toBe("2,50 €");
    expect(plain(formatNumber(5_000_000, "kpl"))).toBe("5 milj. kpl");
  });

  it("muotoiltu luku jäsentyy takaisin samaksi", () => {
    for (const [n, unit] of [
      [1_100_000_000, "€"],
      [12.3, "%"],
      [2.5, "€/osake"],
      [300_000, "€"],
    ] as const) {
      expect(value(formatNumber(n, unit))).toBe(n);
    }
  });
});
