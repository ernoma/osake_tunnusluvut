import { describe, expect, it } from "vitest";
import { figureCatalog } from "./content.ts";
import { parseFigureValue, searchFigures } from "./figureEntry.ts";
import { formatForInput, parseNumber } from "./numberFormat.ts";

describe("searchFigures", () => {
  it("löytää tunnusluvut ja lähtötiedot nimellä, lyhenteellä ja aliaksella", () => {
    expect(searchFigures("pe")[0]?.id).toBe("pe");
    expect(searchFigures("oma pääoma").map((f) => f.id)).toContain("oma-paaoma");
    expect(searchFigures("share price").map((f) => f.id)).toEqual(["kurssi"]);
    expect(searchFigures("PAAOMA").map((f) => f.id)).toContain("oma-paaoma");
  });

  it("jättää pois jo lisätyt", () => {
    expect(searchFigures("", new Set(["pe"])).map((f) => f.id)).not.toContain("pe");
    expect(searchFigures("")).toHaveLength(figureCatalog.length);
  });

  it("täsmälleen osuva nimi tai lyhenne on ensin", () => {
    expect(searchFigures("ev")[0]?.id).toBe("ev");
    expect(searchFigures("kassa")[0]?.id).toBe("kassa");
  });

  it("nimen alusta osuva on ennen osumaa sanan keskellä tai aliaksessa", () => {
    expect(searchFigures("oma")[0]?.id).toBe("oma-paaoma");
    expect(searchFigures("osinko")[0]?.name).toMatch(/^Osinko/);
    expect(searchFigures("tulos")[0]?.name).toMatch(/^Tulos/);
  });
});

describe("parseFigureValue", () => {
  it("hyväksyy suomalaisen ja englantilaisen muodon", () => {
    expect(parseFigureValue("1,2 mrd", "€")).toEqual({ value: 1.2e9 });
    expect(parseFigureValue("12 %", "%")).toEqual({ value: 12 });
    expect(parseFigureValue("12", "%")).toEqual({ value: 12 });
    expect(parseFigureValue("2.4B", "€")).toEqual({ value: 2.4e9 });
  });

  it("kertoo virheestä", () => {
    expect(parseFigureValue("paljon", "€")).toHaveProperty("error");
    expect(parseFigureValue("", "x")).toHaveProperty("error");
    expect(parseFigureValue("12 %", "x")).toEqual({ error: "Tämä luku ei ole prosentteja." });
  });
});

describe("formatForInput", () => {
  it("tuottaa tarkan luvun, jonka jäsennys lukee takaisin", () => {
    for (const value of [0, 12.4, -0.5, 1234, 1_234_567_890, 0.0012, -2_500_000]) {
      const text = formatForInput(value);
      expect(parseNumber(text)?.value, text).toBe(value);
    }
    expect(formatForInput(1_234_567.5)).toBe("1 234 567,5");
    expect(formatForInput(-3)).toBe("-3");
  });
});
