import { describe, expect, it } from "vitest";
import { figureCatalog } from "../data/content.ts";
import {
  decodeAnalysis,
  encodeAnalysis,
  formatDate,
  RESERVED_PARAMS,
  today,
  type Analysis,
} from "./useAnalysisUrl.ts";

const vonovia: Analysis = {
  name: "Vonovia SE",
  currency: "EUR",
  date: "2026-09-26",
  figures: [
    { id: "pe", value: 12.4, period: "toteutunut", year: "2025", origin: "sivu" },
    { id: "markkina-arvo", value: 20e9, period: "ttm", year: "Q2/2026, 12 kk", origin: "kayttaja" },
    { id: "kurssi", value: -0.5, period: undefined, year: "", origin: "kayttaja" },
  ],
};

describe("encodeAnalysis", () => {
  it("tuottaa suunnitelman muotoisen osoitteen", () => {
    expect(
      encodeAnalysis({
        name: "Vonovia",
        currency: "EUR",
        date: "2026-09-26",
        figures: [{ id: "pe", value: 12.4, period: "toteutunut", year: "2025", origin: "sivu" }],
      }),
    ).toBe("?sivu=tutki&nimi=Vonovia&val=EUR&pvm=2026-09-26&pe=12.4~t~2025~s");
  });

  it("jättää tyhjän nimen ja päivämäärän pois", () => {
    expect(encodeAnalysis({ name: " ", currency: "USD", date: "", figures: [] })).toBe(
      "?sivu=tutki&val=USD",
    );
  });

  it("poistaa vuodesta erottimen", () => {
    const search = encodeAnalysis({
      ...vonovia,
      figures: [{ id: "pe", value: 1, year: "2025~x", origin: "kayttaja" }],
    });
    expect(decodeAnalysis(search).figures[0]?.year).toBe("2025x");
  });
});

describe("decodeAnalysis", () => {
  it("toimii koodauksen kanssa edestakaisin", () => {
    expect(decodeAnalysis(encodeAnalysis(vonovia))).toEqual(vonovia);
  });

  it("lukee myös koodatun erottimen ja välilyönnit", () => {
    const decoded = decodeAnalysis("?nimi=A+B&pe=12.4%7Ee%7E2027%7Ek");
    expect(decoded.name).toBe("A B");
    expect(decoded.figures).toEqual([
      { id: "pe", value: 12.4, period: "ennuste", year: "2027", origin: "kayttaja" },
    ]);
  });

  it("ohittaa tuntemattomat id:t, virheelliset arvot ja kaksoiskappaleet", () => {
    const decoded = decodeAnalysis("?q=velka&tuntematon=1~t~~s&pe=abc&eps=~t~~s&pb=2~t~~s&pb=3");
    expect(decoded.figures).toEqual([
      { id: "pb", value: 2, period: "toteutunut", year: "", origin: "sivu" },
    ]);
  });

  it("käyttää oletuksia puuttuville ja virheellisille tiedoille", () => {
    expect(decodeAnalysis("?val=euro&pvm=eilen&roe=15")).toEqual({
      name: "",
      currency: "EUR",
      date: "",
      figures: [{ id: "roe", value: 15, period: undefined, year: "", origin: "kayttaja" }],
    });
  });

  it("hyväksyy muun valuutan koodina", () => {
    expect(decodeAnalysis("?val=usd").currency).toBe("USD");
  });

  it("luvun valuutta säilyy edestakaisin, ja virheellinen ohitetaan", () => {
    const sek: Analysis = {
      ...vonovia,
      figures: [
        { id: "kurssi", value: 118.4, period: "ttm", year: "", origin: "sivu", currency: "SEK" },
        { id: "eps", value: 0.96, period: "toteutunut", year: "2025", origin: "sivu" },
      ],
    };
    const search = encodeAnalysis(sek);
    expect(search).toContain("&kurssi=118.4~ttm~~s~SEK&eps=0.96~t~2025~s");
    expect(decodeAnalysis(search)).toEqual(sek);

    const own = (query: string) => decodeAnalysis(query).figures[0]?.currency;
    expect(own("?val=EUR&kurssi=1~t~~s~kruunu")).toBeUndefined();
    expect(own("?val=EUR&kurssi=1~t~~s~sek")).toBe("SEK");
    // Sama kuin analyysin valuutta, tai luku ei ole rahamäärä.
    expect(own("?val=EUR&kurssi=1~t~~s~EUR")).toBeUndefined();
    expect(own("?val=EUR&pe=1~t~~s~SEK")).toBeUndefined();
  });

  it("vaiheen 11h hval antaa kurssiin sidottujen lukujen valuutan", () => {
    const decoded = decodeAnalysis(
      "?val=EUR&hval=SEK&kurssi=1~t~~s&markkina-arvo=2~t~~s~USD&eps=3~t~~s",
    );
    expect(decoded.figures.map((f) => f.currency)).toEqual(["SEK", "USD", undefined]);
    expect(encodeAnalysis(decoded)).not.toContain("hval");
  });
});

describe("parametrit", () => {
  it("yksikään tunnusluvun tai lähtötiedon id ei ole varattu parametri", () => {
    const reserved: readonly string[] = [...RESERVED_PARAMS, "q", "k"];
    expect(figureCatalog.filter((f) => reserved.includes(f.id))).toEqual([]);
  });
});

describe("päivämäärät", () => {
  it("muotoilee päivämäärän suomalaisittain", () => {
    expect(formatDate("2026-09-06")).toBe("6.9.2026");
    expect(formatDate("")).toBe("");
  });

  it("tämä päivä paikallisen ajan mukaan", () => {
    expect(today(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
