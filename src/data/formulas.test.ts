import { describe, expect, it } from "vitest";
import { metricsById } from "./content.ts";
import {
  calculate,
  describeFormula,
  differsNotably,
  evaluate,
  formulaInputs,
  formulas,
  type KnownFigure,
} from "./formulas.ts";
import { inputs } from "./inputs.ts";
import { parseNumber } from "./numberFormat.ts";

const M = 1_000_000;

/**
 * Jokaisen kaavan lähtöluvut kortin tasalukuesimerkistä. Tulosta ei kirjoiteta tähän, vaan se
 * luetaan kortin esimerkistä (viimeisen =-merkin jälkeen), joten testi huomaa, jos kaava ja
 * kortti ovat ristiriidassa. Lähtötiedoille, joilla ei ole korttia, tulos annetaan tässä.
 */
const EXAMPLES: Record<string, { values: Record<string, number>; expected?: number }> = {
  // "Osakkeita on 10 miljoonaa ja yksi maksaa 5 €."
  "markkina-arvo": { values: { kurssi: 5, "osakkeiden-maara": 10 * M } },
  // Yritysarvon esimerkin velka ja kassa: 30 − 10 = 20 milj. €
  nettovelka: { values: { "korolliset-velat": 30 * M, kassa: 10 * M }, expected: 20 * M },
  ev: { values: { "markkina-arvo": 50 * M, nettovelka: 20 * M } },
  ebitda: { values: { ebit: 30_000, poistot: 20_000 } },
  "ebit-prosentti": { values: { ebit: 30_000, liikevaihto: 300_000 } },
  nettomarginaali: { values: { nettotulos: 15_000, liikevaihto: 300_000 } },
  "ttm-kasvu": { values: { liikevaihto: 110 * M, "liikevaihto-edellinen": 100 * M } },
  eps: { values: { nettotulos: 10 * M, "osakkeiden-maara": 5 * M } },
  roe: { values: { nettotulos: 10 * M, "oma-paaoma": 100 * M } },
  roi: {
    values: {
      "tulos-ennen-veroja": 8 * M,
      rahoituskulut: 2 * M,
      "oma-paaoma": 60 * M,
      "korolliset-velat": 40 * M,
    },
  },
  roa: { values: { nettotulos: 5 * M, "taseen-loppusumma": 100 * M } },
  "vapaa-kassavirta": { values: { "liiketoiminnan-kassavirta": 50 * M, investoinnit: 20 * M } },
  osinkotuotto: { values: { "osinko-per-osake": 1, kurssi: 25 } },
  osinkosuhde: { values: { "osinko-per-osake": 1, eps: 2 } },
  omavaraisuusaste: {
    values: { "oma-paaoma": 40 * M, "taseen-loppusumma": 100 * M, "saadut-ennakot": 0 },
  },
  "omavaraisuusaste-ilman-ennakoita": {
    values: { "oma-paaoma": 40 * M, "taseen-loppusumma": 100 * M },
  },
  // Velka 60, kassa 20 ja oma pääoma 80 milj. €
  nettovelkaantumisaste: { values: { nettovelka: 40 * M, "oma-paaoma": 80 * M } },
  "nettovelka-ebitda": { values: { nettovelka: 60 * M, ebitda: 30 * M } },
  korkokate: { values: { ebit: 30 * M, rahoituskulut: 5 * M } },
  pe: { values: { kurssi: 20, eps: 2 } },
  "pe-markkina-arvosta": { values: { "markkina-arvo": 200 * M, nettotulos: 20 * M } },
  // "Osake maksaa 20 € ja omaa pääomaa on 10 € osaketta kohden": 10 milj. osaketta
  pb: { values: { "markkina-arvo": 200 * M, "oma-paaoma": 100 * M } },
  ps: { values: { "markkina-arvo": 200 * M, liikevaihto: 100 * M } },
  peg: { values: { pe: 20, "tuloksen-kasvuennuste": 20 } },
  "ev-ebit": { values: { ev: 100 * M, ebit: 10 * M } },
  "ev-ebitda": { values: { ev: 240 * M, ebitda: 30 * M } },
  "ev-sales": { values: { ev: 300 * M, liikevaihto: 150 * M } },
  kassavirtatuotto: { values: { "vapaa-kassavirta": 15 * M, "markkina-arvo": 300 * M } },
  "p-fcf": { values: { "markkina-arvo": 2000 * M, "vapaa-kassavirta": 100 * M } },
};

/** Kortin esimerkin tulos: luku viimeisen =-merkin jälkeen, esim. "= 50 milj. €." → 50 000 000. */
function exampleResult(example: string): number {
  const tail = example.split("=").at(-1)!.trim();
  const match = /^[−-]?\d[\d ]*(?:,\d+)?(?:\s*(?:milj\.|mrd\.))?/.exec(tail);
  const parsed = match && parseNumber(match[0]);
  if (!parsed) throw new Error(`esimerkin tulosta ei voi lukea: "${example}"`);
  return parsed.value;
}

const known = (values: Record<string, number>, period?: KnownFigure["period"]) =>
  new Map(
    Object.entries(values).map(([id, value]) => [id, { value, origin: "sivu", period } as const]),
  );

const inputIds = new Set(inputs.map((i) => i.id));
const exists = (id: string) => metricsById.has(id) || inputIds.has(id);

describe("kaavat", () => {
  it("kaavojen id:t ovat yksilöllisiä", () => {
    const ids = formulas.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("jokainen kohde ja lähtöluku on olemassa tunnuslukuna tai lähtötietona", () => {
    for (const f of formulas) {
      expect(exists(f.target), `${f.id}: kohde ${f.target}`).toBe(true);
      for (const id of [...formulaInputs(f), ...(f.positive ?? [])]) {
        expect(exists(id), `${f.id}: ${id}`).toBe(true);
      }
      for (const id of f.positive ?? []) expect(formulaInputs(f), f.id).toContain(id);
    }
  });

  it("prosenttikaava laskee prosenttiyksikköistä tunnuslukua ja päinvastoin", () => {
    for (const f of formulas) {
      const unit = metricsById.get(f.target)?.unit ?? inputs.find((i) => i.id === f.target)?.unit;
      expect(unit === "%", f.id).toBe(Boolean(f.percent));
    }
  });

  it("kaavoissa ei ole kehää", () => {
    const deps = new Map<string, string[]>();
    for (const f of formulas)
      deps.set(f.target, [...(deps.get(f.target) ?? []), ...formulaInputs(f)]);
    const visit = (id: string, path: string[]): void => {
      expect(path, `kehä: ${[...path, id].join(" → ")}`).not.toContain(id);
      for (const dep of deps.get(id) ?? []) visit(dep, [...path, id]);
    };
    for (const target of deps.keys()) visit(target, []);
  });

  it("jokaiselle kaavalle on testiesimerkki", () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(formulas.map((f) => f.id).sort());
  });

  for (const f of formulas) {
    it(`${f.id} tuottaa kortin esimerkin tuloksen`, () => {
      const { values, expected } = EXAMPLES[f.id]!;
      const metric = metricsById.get(f.target);
      const target = expected ?? exampleResult(metric!.example);
      expect(evaluate(f, (id) => values[id]!)).toBeCloseTo(target, 6);
    });
  }
});

describe("describeFormula", () => {
  const byId = (id: string) => formulas.find((f) => f.id === id)!;

  it("näyttää kaavan nimillä ja sulkeilla", () => {
    expect(describeFormula(byId("p-fcf"), (id) => id)).toBe("markkina-arvo ÷ vapaa-kassavirta");
    expect(describeFormula(byId("roi"), (id) => id)).toBe(
      "(tulos-ennen-veroja + rahoituskulut) ÷ (oma-paaoma + korolliset-velat) × 100 %",
    );
    expect(describeFormula(byId("ttm-kasvu"), (id) => id)).toBe(
      "(liikevaihto ÷ liikevaihto-edellinen − 1) × 100 %",
    );
    expect(describeFormula(byId("omavaraisuusaste"), (id) => id)).toBe(
      "oma-paaoma ÷ (taseen-loppusumma − saadut-ennakot) × 100 %",
    );
  });
});

describe("calculate", () => {
  it("laskee ketjussa: kurssi ja osakemäärä → markkina-arvo → P/S", () => {
    const { figures } = calculate(
      known({ kurssi: 20, "osakkeiden-maara": 10 * M, liikevaihto: 100 * M }),
    );
    expect(figures.get("markkina-arvo")?.value).toBe(200 * M);
    expect(figures.get("ps")?.value).toBe(2);
    expect(figures.get("ps")?.origin).toBe("laskettu");
    expect(figures.get("ps")?.calculation?.inputs).toEqual([
      { id: "markkina-arvo", value: 200 * M },
      { id: "liikevaihto", value: 100 * M },
    ]);
  });

  it("laskee P/FCF:n markkina-arvosta ja vapaasta kassavirrasta", () => {
    const { figures } = calculate(
      known({
        "markkina-arvo": 20_000 * M,
        "liiketoiminnan-kassavirta": 1500 * M,
        investoinnit: 400 * M,
      }),
    );
    expect(figures.get("vapaa-kassavirta")?.value).toBe(1100 * M);
    expect(figures.get("p-fcf")?.value).toBeCloseTo(18.18, 2);
  });

  it("käyttää ensimmäistä kaavaa, jonka lähtöluvut ovat saatavilla", () => {
    const withEps = calculate(
      known({ kurssi: 20, eps: 2, "markkina-arvo": 300 * M, nettotulos: 20 * M }),
    );
    expect(withEps.figures.get("pe")?.calculation?.formula.id).toBe("pe");
    const withoutEps = calculate(known({ "markkina-arvo": 300 * M, nettotulos: 20 * M }));
    expect(withoutEps.figures.get("pe")?.value).toBe(15);
    expect(withoutEps.figures.get("pe")?.calculation?.formula.id).toBe("pe-markkina-arvosta");
  });

  it("omavaraisuusaste lasketaan ilman saatuja ennakoita, jos niitä ei ole annettu", () => {
    const { figures } = calculate(known({ "oma-paaoma": 40 * M, "taseen-loppusumma": 100 * M }));
    const calc = figures.get("omavaraisuusaste")?.calculation;
    expect(calc?.formula.id).toBe("omavaraisuusaste-ilman-ennakoita");
    expect(calc?.formula.note).toMatch(/Saadut ennakot puuttuvat/);
  });

  it("ei korvaa annettua lukua, vaan laskee sille vertailuarvon", () => {
    const { figures } = calculate(known({ pe: 12.4, kurssi: 20, eps: 1.42 }));
    const pe = figures.get("pe")!;
    expect(pe.value).toBe(12.4);
    expect(pe.origin).toBe("sivu");
    expect(pe.calculation?.value).toBeCloseTo(14.08, 2);
    expect(differsNotably(pe.value, pe.calculation!.value)).toBe(true);
  });

  it("ei laske kerrointa, jos nimittäjä on nolla tai negatiivinen", () => {
    const { figures, blocked } = calculate(
      known({ kurssi: 20, eps: -1, ev: 100 * M, ebit: 0, "tuloksen-kasvuennuste": 10 }),
    );
    expect(figures.has("pe")).toBe(false);
    expect(blocked.get("pe")?.nonPositive).toEqual(["eps"]);
    expect(blocked.get("ev-ebit")?.nonPositive).toEqual(["ebit"]);
    // PEG tarvitsee P/E:n, jota ei voitu laskea, joten se vain puuttuu.
    expect(blocked.has("peg")).toBe(false);
    expect(figures.has("peg")).toBe(false);
  });

  it("negatiivisen P/E:n PEG:iä ei lasketa", () => {
    const { blocked } = calculate(known({ pe: -8, "tuloksen-kasvuennuste": 10 }));
    expect(blocked.get("peg")?.nonPositive).toEqual(["pe"]);
  });

  it("vaihtoehtoinen kaava ohittaa estyneen", () => {
    const { figures, blocked } = calculate(
      known({ kurssi: 20, eps: 0, "markkina-arvo": 200 * M, nettotulos: 10 * M }),
    );
    expect(figures.get("pe")?.value).toBe(20);
    expect(blocked.has("pe")).toBe(false);
  });

  it("merkitsee eri kausien luvuista lasketun tuloksen", () => {
    const figures = new Map<string, KnownFigure>([
      ["kurssi", { value: 20, origin: "sivu", period: "toteutunut" }],
      ["eps", { value: 2, origin: "sivu", period: "ennuste" }],
      ["tuloksen-kasvuennuste", { value: 10, origin: "kayttaja", period: "ennuste" }],
    ]);
    const result = calculate(figures).figures;
    expect(result.get("pe")?.mixedPeriods).toBe(true);
    expect(result.get("pe")?.period).toBeUndefined();
    // Sekakausi periytyy lukuihin, jotka lasketaan sekakautisesta luvusta.
    expect(result.get("peg")?.mixedPeriods).toBe(true);

    const same = calculate(known({ kurssi: 20, eps: 2 }, "ttm")).figures.get("pe");
    expect(same?.mixedPeriods).toBe(false);
    expect(same?.period).toBe("ttm");
  });
});

describe("differsNotably", () => {
  it("huomauttaa yli 10 %:n erosta", () => {
    expect(differsNotably(12.4, 14.1)).toBe(true);
    expect(differsNotably(12.4, 13)).toBe(false);
    expect(differsNotably(-5, 5)).toBe(true);
  });
});
