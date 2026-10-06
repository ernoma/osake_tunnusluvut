import { describe, expect, it } from "vitest";
import { fixtures } from "./fixtures/index.ts";
import { inderes } from "./fixtures/inderes.ts";
import { kauppalehti } from "./fixtures/kauppalehti.ts";
import { nordnet } from "./fixtures/nordnet.ts";
import { tilinpaatos } from "./fixtures/tilinpaatos.ts";
import { yahoo } from "./fixtures/yahoo.ts";
import {
  normalizeText,
  quoteFound,
  quoteMatchesValue,
  scalesIn,
  verifyExtraction,
} from "./verify.ts";

describe("lainauksen haku tekstistä", () => {
  it("löytää lainauksen, vaikka välilyönnit, viivat ja kirjainkoko eroavat", () => {
    const text = normalizeText("Markkina-arvo\t4,21 mrd EUR\nP/E−luku  14,2");
    expect(quoteFound("markkina-arvo 4,21 mrd EUR", text)).toBe(true);
    expect(quoteFound("P/E-luku 14,2", text)).toBe(true);
  });

  it("ei hyväksy keksittyä tai tyhjää lainausta", () => {
    const text = normalizeText("P/E 14,2");
    expect(quoteFound("P/E 14,3", text)).toBe(false);
    expect(quoteFound("   ", text)).toBe(false);
  });
});

describe("lainauksen luku ja arvo", () => {
  it.each([
    ["P/E 14,2", 14.2],
    ["Market Cap 52.34B", 52.34e9],
    ["Markkina-arvo 1 523 milj. €", 1.523e9],
    ["Markkina-arvo 4,21 mrd EUR", 4.21e9],
    ["Liikevaihto 350 MEUR", 350e6],
    ["Osakkeita 176 024 000 kpl", 176_024_000],
    ["Shares Outstanding 407.5M", 407.5e6],
    ["Liikevaihto 812,4 865,0 910,2", 865e6],
    ["Liikevaihto 245 318 231 004", 231_004_000],
    ["Nettotulos (1 234)", -1_234_000],
    ["EBIT -12,5 milj. €", -12.5e6],
  ])("%s = %d", (quote, value) => {
    expect(quoteMatchesValue(quote, value, { contextScales: [1e3, 1e6] })).toBe(true);
  });

  it("luvun perässä oleva kerroin on ainoa oikea: 350 MEUR ei ole 350", () => {
    expect(quoteMatchesValue("Liikevaihto 350 MEUR", 350)).toBe(false);
    expect(quoteMatchesValue("Liikevaihto 1,2 mrd", 1.2e6)).toBe(false);
  });

  it("taulukon otsikon kerroin tulee muualta tekstistä", () => {
    expect(scalesIn("KONSERNIN TULOSLASKELMA (1 000 euroa)")).toEqual([1e3]);
    expect(scalesIn(row("MEUR", "2024", "2025"))).toEqual([1e6]);
    expect(scalesIn("EURm (except for percentage and personnel data) 2025 2024")).toEqual([1e6]);
    expect(scalesIn("USD bn")).toEqual([1e9]);
    expect(scalesIn("SEKbn")).toEqual([1e9]);
    expect(scalesIn("Revenue, eur")).toEqual([]);
    expect(quoteMatchesValue("Liikevaihto 865,0", 865e6)).toBe(false);
    expect(quoteMatchesValue("Liikevaihto 865,0", 865e6, { contextScales: [1e6] })).toBe(true);
  });

  it("miinusmerkki erottaa negatiivisen luvun, paitsi kuluilla", () => {
    expect(quoteMatchesValue("Liikevoitto -12 450", 12_450)).toBe(false);
    expect(quoteMatchesValue("Liikevoitto -12 450", -12_450)).toBe(true);
    expect(quoteMatchesValue("Poistot -12 450", 12_450, { expense: true })).toBe(true);
    // Ajatusviiva voi olla välin merkki, joten luku kelpaa kummin päin tahansa.
    expect(quoteMatchesValue("P/E 10–15", 15)).toBe(true);
  });

  it("prosentin voi ilmoittaa osuutena", () => {
    expect(quoteMatchesValue("ROE 0,123", 12.3, { percent: true })).toBe(true);
    expect(quoteMatchesValue("P/E 0,123", 12.3)).toBe(false);
  });

  it("väärä luku ei täsmää", () => {
    expect(quoteMatchesValue("P/E 14,2", 14.3)).toBe(false);
    expect(quoteMatchesValue("Osinkotuotto 4,8 %", 48)).toBe(false);
  });
});

function row(...cells: string[]) {
  return cells.join("\t");
}

describe("testiaineisto", () => {
  it.each(fixtures.map((f) => [f.site, f] as const))(
    "%s: odotetut luvut läpäisevät tarkistuksen",
    (_site, fixture) => {
      const result = verifyExtraction(fixture.response, fixture.text);
      for (const expected of fixture.expected) {
        const found = result.values.find((v) => v.id === expected.id);
        // Tahallisesti väärä arvo merkitään tarkistettavaksi.
        if (found && found.value !== expected.value) {
          expect(found.check, expected.id).toBe("tarkista");
          continue;
        }
        expect(found, expected.id).toBeDefined();
        expect(found?.check, `${expected.id}: ${found?.warning}`).toBe("ok");
        expect(found?.currency, `${expected.id}: valuutta`).toBe(expected.currency);
      }
      expect(result.company.name).toBe(fixture.company.name);
      expect(result.company.currency).toBe(fixture.company.currency);
      expect(result.company.priceCurrency).toBe(fixture.company.priceCurrency);
    },
  );

  it("kurssin valuutta jää tyhjäksi, jos se on sama kuin tilinpäätöksen", () => {
    const result = verifyExtraction(
      {
        company: { name: null, ticker: null, currency: "EUR", priceCurrency: " eur" },
        values: [],
        notes: [],
      },
      "",
    );
    expect(result.company.priceCurrency).toBeNull();
  });

  it("luvun valuutta: oma, kurssin valuutta tai ei mitään", () => {
    const value = (id: string, currency: string | null) => ({
      id,
      value: 1,
      period: "ttm" as const,
      year: null,
      quote: "x 1",
      currency,
    });
    const result = verifyExtraction(
      {
        company: { name: null, ticker: null, currency: "EUR", priceCurrency: "SEK" },
        values: [
          value("kurssi", null),
          value("markkina-arvo", "usd"),
          value("eps", "EUR"),
          value("nettotulos", "SEK"),
          value("pe", "SEK"),
        ],
        notes: [],
      },
      "x 1",
    );
    const currencies = Object.fromEntries(result.values.map((v) => [v.id, v.currency]));
    // Kurssiin sidottu luku saa kurssin valuutan, ellei sillä ole omaa.
    expect(currencies).toEqual({
      kurssi: "SEK",
      "markkina-arvo": "USD",
      eps: undefined,
      nettotulos: "SEK",
      // Kertoimella ei ole valuuttaa.
      pe: undefined,
    });
  });

  it("tuntematon id hylätään", () => {
    const result = verifyExtraction(nordnet.response, nordnet.text);
    expect(result.rejected).toEqual([
      expect.objectContaining({ id: "beta", reason: "tuntematon" }),
    ]);
    expect(result.values.map((v) => v.id)).not.toContain("beta");
  });

  it("keksitty lainaus hylätään", () => {
    const result = verifyExtraction(inderes.response, inderes.text);
    expect(result.rejected).toEqual([expect.objectContaining({ id: "roe", reason: "lainaus" })]);
    expect(result.notes).toHaveLength(1);
  });

  it("kaksoiskappale hylätään, ja ensimmäinen jää", () => {
    const result = verifyExtraction(kauppalehti.response, kauppalehti.text);
    expect(result.rejected).toEqual([
      expect.objectContaining({ id: "pe", reason: "kaksoiskappale", value: 12 }),
    ]);
    expect(result.values.find((v) => v.id === "pe")?.value).toBe(11.4);
  });

  it("valuuttakoodi muutetaan isoiksi kirjaimiksi, ja vuosi tyhjäksi, jos sitä ei ole", () => {
    const result = verifyExtraction(yahoo.response, yahoo.text);
    expect(result.company.currency).toBe("USD");
    expect(result.values[0]?.year).toBe("");
  });

  it("liian pieni rahamäärä ja väärä rivi merkitään tarkistettaviksi", () => {
    const result = verifyExtraction(tilinpaatos.response, tilinpaatos.text);
    const byId = new Map(result.values.map((v) => [v.id, v]));
    expect(byId.get("saadut-ennakot")).toMatchObject({
      check: "tarkista",
      warning: expect.stringContaining("epätavallisen pieni"),
    });
    expect(byId.get("osinko-per-osake")).toMatchObject({
      check: "tarkista",
      warning: expect.stringContaining("ei vastaa"),
    });
    expect(result.values.filter((v) => v.check === "tarkista")).toHaveLength(2);
  });

  it("tuntematon valuutta jää tyhjäksi", () => {
    const result = verifyExtraction(
      {
        company: { name: null, ticker: null, currency: "euro", priceCurrency: "SEK" },
        values: [],
        notes: [" ", "x"],
      },
      "",
    );
    // Kurssin valuutta ei kerro mitään, jos tilinpäätöksen valuuttaa ei tiedetä.
    expect(result.company).toEqual({ name: "", currency: null, priceCurrency: null });
    expect(result.notes).toEqual(["x"]);
  });
});
