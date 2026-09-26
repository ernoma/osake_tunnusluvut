// Kaavat, joilla tunnusluvut lasketaan toisista luvuista, ja laskenta (suunnitelman kohta 11.4).
// Kaavan osat ovat tunnuslukuja (metrics.ts) tai lähtötietoja (inputs.ts), ja ne viitataan id:llä.
//
// Samalla kohteella voi olla useita kaavoja. Niistä käytetään ensimmäistä, jonka lähtöluvut ovat
// saatavilla. Kaavoja sovelletaan toistuvasti, kunnes uusia lukuja ei synny: kurssi ja osakemäärä
// antavat markkina-arvon, ja markkina-arvo ja liikevaihto antavat P/S:n.

export type Operator = "+" | "−" | "×" | "÷";

/** Laskutoimitus: luvun id, vakio tai kahden lausekkeen yhdistelmä. */
export type Expr = string | number | { op: Operator; left: Expr; right: Expr };

const add = (left: Expr, right: Expr): Expr => ({ op: "+", left, right });
const sub = (left: Expr, right: Expr): Expr => ({ op: "−", left, right });
const mul = (left: Expr, right: Expr): Expr => ({ op: "×", left, right });
const div = (left: Expr, right: Expr): Expr => ({ op: "÷", left, right });

export interface Formula {
  /** Yksilöivä tunniste. Kohteen ensisijaisella kaavalla sama kuin kohde. */
  id: string;
  /** Tunnusluvun tai lähtötiedon id, jonka kaava laskee. */
  target: string;
  expr: Expr;
  /** Tulos kerrotaan sadalla, koska prosentit tallennetaan prosentteina. */
  percent?: boolean;
  /**
   * Lähtöluvut, joiden pitää olla positiivisia, jotta tulos on mielekäs. Yleensä kertoimen
   * nimittäjä: tappiollisella yhtiöllä P/E:tä ei lasketa.
   */
  positive?: readonly string[];
  /** Näytetään laskelman yhteydessä, jos kaava on likiarvo. */
  note?: string;
}

export const formulas: readonly Formula[] = [
  { id: "markkina-arvo", target: "markkina-arvo", expr: mul("kurssi", "osakkeiden-maara") },
  { id: "nettovelka", target: "nettovelka", expr: sub("korolliset-velat", "kassa") },
  { id: "ev", target: "ev", expr: add("markkina-arvo", "nettovelka") },
  { id: "ebitda", target: "ebitda", expr: add("ebit", "poistot") },
  {
    id: "ebit-prosentti",
    target: "ebit-prosentti",
    expr: div("ebit", "liikevaihto"),
    percent: true,
    positive: ["liikevaihto"],
  },
  {
    id: "ttm-kasvu",
    target: "ttm-kasvu",
    expr: sub(div("liikevaihto", "liikevaihto-edellinen"), 1),
    percent: true,
    positive: ["liikevaihto-edellinen"],
  },
  {
    id: "eps",
    target: "eps",
    expr: div("nettotulos", "osakkeiden-maara"),
    positive: ["osakkeiden-maara"],
  },
  {
    id: "roe",
    target: "roe",
    expr: div("nettotulos", "oma-paaoma"),
    percent: true,
    positive: ["oma-paaoma"],
  },
  {
    id: "roi",
    target: "roi",
    expr: div(add("tulos-ennen-veroja", "rahoituskulut"), add("oma-paaoma", "korolliset-velat")),
    percent: true,
  },
  {
    id: "vapaa-kassavirta",
    target: "vapaa-kassavirta",
    expr: sub("liiketoiminnan-kassavirta", "investoinnit"),
  },
  {
    id: "osinkotuotto",
    target: "osinkotuotto",
    expr: div("osinko-per-osake", "kurssi"),
    percent: true,
    positive: ["kurssi"],
  },
  {
    id: "osinkosuhde",
    target: "osinkosuhde",
    expr: div("osinko-per-osake", "eps"),
    percent: true,
    positive: ["eps"],
  },
  {
    id: "omavaraisuusaste",
    target: "omavaraisuusaste",
    expr: div("oma-paaoma", sub("taseen-loppusumma", "saadut-ennakot")),
    percent: true,
  },
  {
    id: "omavaraisuusaste-ilman-ennakoita",
    target: "omavaraisuusaste",
    expr: div("oma-paaoma", "taseen-loppusumma"),
    percent: true,
    positive: ["taseen-loppusumma"],
    note: "Saadut ennakot puuttuvat, joten ne on jätetty pois. Jos yhtiöllä on ennakoita, oikea luku on hieman suurempi.",
  },
  {
    id: "nettovelkaantumisaste",
    target: "nettovelkaantumisaste",
    expr: div("nettovelka", "oma-paaoma"),
    percent: true,
    positive: ["oma-paaoma"],
  },
  {
    id: "nettovelka-ebitda",
    target: "nettovelka-ebitda",
    expr: div("nettovelka", "ebitda"),
    positive: ["ebitda"],
  },
  { id: "pe", target: "pe", expr: div("kurssi", "eps"), positive: ["eps"] },
  {
    id: "pe-markkina-arvosta",
    target: "pe",
    expr: div("markkina-arvo", "nettotulos"),
    positive: ["nettotulos"],
  },
  { id: "pb", target: "pb", expr: div("markkina-arvo", "oma-paaoma"), positive: ["oma-paaoma"] },
  { id: "ps", target: "ps", expr: div("markkina-arvo", "liikevaihto"), positive: ["liikevaihto"] },
  {
    id: "peg",
    target: "peg",
    expr: div("pe", "tuloksen-kasvuennuste"),
    positive: ["pe", "tuloksen-kasvuennuste"],
  },
  { id: "ev-ebit", target: "ev-ebit", expr: div("ev", "ebit"), positive: ["ebit"] },
  { id: "ev-ebitda", target: "ev-ebitda", expr: div("ev", "ebitda"), positive: ["ebitda"] },
  { id: "ev-sales", target: "ev-sales", expr: div("ev", "liikevaihto"), positive: ["liikevaihto"] },
  {
    id: "kassavirtatuotto",
    target: "kassavirtatuotto",
    expr: div("vapaa-kassavirta", "markkina-arvo"),
    percent: true,
    positive: ["markkina-arvo"],
  },
  {
    id: "p-fcf",
    target: "p-fcf",
    expr: div("markkina-arvo", "vapaa-kassavirta"),
    positive: ["vapaa-kassavirta"],
  },
];

/** Kaavan lähtöluvut esiintymisjärjestyksessä, kukin kerran. */
export function formulaInputs(formula: Formula): string[] {
  const ids: string[] = [];
  const walk = (e: Expr) => {
    if (typeof e === "string") {
      if (!ids.includes(e)) ids.push(e);
    } else if (typeof e === "object") {
      walk(e.left);
      walk(e.right);
    }
  };
  walk(formula.expr);
  return ids;
}

/** Laskee kaavan arvon. Prosenttikaavan tulos on prosentteina. */
export function evaluate(formula: Formula, valueOf: (id: string) => number): number {
  const ev = (e: Expr): number => {
    if (typeof e === "number") return e;
    if (typeof e === "string") return valueOf(e);
    const [l, r] = [ev(e.left), ev(e.right)];
    switch (e.op) {
      case "+":
        return l + r;
      case "−":
        return l - r;
      case "×":
        return l * r;
      case "÷":
        return l / r;
    }
  };
  const value = ev(formula.expr);
  return formula.percent ? value * 100 : value;
}

const PRECEDENCE: Record<Operator, number> = { "+": 1, "−": 1, "×": 2, "÷": 2 };

/**
 * Kaava tekstinä, esim. "(tulos ennen veroja + rahoituskulut) ÷ (oma pääoma + korolliset velat)".
 * label muuttaa id:n näytettäväksi tekstiksi, esimerkiksi nimeksi ja arvoksi: "markkina-arvo 20 mrd. €".
 */
export function describeFormula(formula: Formula, label: (id: string) => string): string {
  const show = (e: Expr, parentPrec = 0, rightSide = false): string => {
    if (typeof e === "number") return String(e).replace(".", ",");
    if (typeof e === "string") return label(e);
    const prec = PRECEDENCE[e.op];
    const text = `${show(e.left, prec)} ${e.op} ${show(e.right, prec, true)}`;
    const needsParens =
      prec < parentPrec || (rightSide && prec === parentPrec && (e.op === "−" || e.op === "÷"));
    return needsParens ? `(${text})` : text;
  };
  const text = show(formula.expr);
  if (!formula.percent) return text;
  return typeof formula.expr === "object" && PRECEDENCE[formula.expr.op] === 1
    ? `(${text}) × 100 %`
    : `${text} × 100 %`;
}

// Laskenta

export const PERIODS = ["toteutunut", "ttm", "ennuste"] as const;
export type Period = (typeof PERIODS)[number];

/** Käyttäjän syöttämä tai sivulta poimittu luku. */
export interface KnownFigure {
  value: number;
  origin: "kayttaja" | "sivu";
  period?: Period;
}

export interface Calculation {
  formula: Formula;
  value: number;
  /** Lähtöluvut ja niiden arvot kaavan järjestyksessä. */
  inputs: { id: string; value: number }[];
  /** Lähtöluvut ovat eri kausilta, esimerkiksi toteutunut ja ennuste. */
  mixedPeriods: boolean;
  /** Lähtölukujen yhteinen kausi, jos se on tiedossa ja sama kaikille. */
  period?: Period;
}

export interface ResolvedFigure {
  value: number;
  origin: "kayttaja" | "sivu" | "laskettu";
  period?: Period;
  mixedPeriods: boolean;
  /**
   * Lasketulla luvulla laskelma, josta se syntyi. Syötetyllä tai poimitulla luvulla omista
   * luvuista laskettu vertailuarvo, jos lähtöluvut riittävät (ks. differsNotably).
   */
  calculation?: Calculation;
}

export interface BlockedFigure {
  formula: Formula;
  /** Lähtöluvut, jotka ovat nolla tai negatiivisia. */
  nonPositive: string[];
}

export interface CalculationResult {
  figures: Map<string, ResolvedFigure>;
  /** Kohteet, joita ei laskettu, koska jokin lähtöluku on nolla tai negatiivinen. */
  blocked: Map<string, BlockedFigure>;
}

/**
 * Laskee kaikki luvut, jotka annetuista luvuista voi laskea. Annettu luku on aina etusijalla:
 * laskettu arvo ei korvaa sitä, vaan se tallentuu vertailuarvoksi.
 */
export function calculate(
  known: ReadonlyMap<string, KnownFigure>,
  formulaList: readonly Formula[] = formulas,
): CalculationResult {
  const figures = new Map<string, ResolvedFigure>();
  for (const [id, k] of known) {
    figures.set(id, { value: k.value, origin: k.origin, period: k.period, mixedPeriods: false });
  }
  const blocked = new Map<string, BlockedFigure>();
  const targets = [...new Set(formulaList.map((f) => f.target))];

  const attempt = (target: string): Calculation | BlockedFigure | undefined => {
    let firstBlocked: BlockedFigure | undefined;
    for (const formula of formulaList) {
      if (formula.target !== target) continue;
      const ids = formulaInputs(formula);
      if (!ids.every((id) => figures.has(id))) continue;
      const nonPositive = (formula.positive ?? []).filter((id) => figures.get(id)!.value <= 0);
      if (nonPositive.length > 0) {
        firstBlocked ??= { formula, nonPositive };
        continue;
      }
      const value = evaluate(formula, (id) => figures.get(id)!.value);
      if (!Number.isFinite(value)) continue;
      const used = ids.map((id) => figures.get(id)!);
      const periods = new Set(used.flatMap((f) => (f.period ? [f.period] : [])));
      const mixedPeriods = periods.size > 1 || used.some((f) => f.mixedPeriods);
      return {
        formula,
        value,
        inputs: ids.map((id) => ({ id, value: figures.get(id)!.value })),
        mixedPeriods,
        period: !mixedPeriods && periods.size === 1 ? [...periods][0] : undefined,
      };
    }
    return firstBlocked;
  };

  for (let changed = true; changed;) {
    changed = false;
    for (const target of targets) {
      if (figures.has(target)) continue;
      const outcome = attempt(target);
      if (outcome && "value" in outcome) {
        figures.set(target, {
          value: outcome.value,
          origin: "laskettu",
          period: outcome.period,
          mixedPeriods: outcome.mixedPeriods,
          calculation: outcome,
        });
        blocked.delete(target);
        changed = true;
      } else if (outcome) {
        blocked.set(target, outcome);
      }
    }
  }

  for (const [id, figure] of figures) {
    if (figure.origin === "laskettu") continue;
    const outcome = attempt(id);
    if (outcome && "value" in outcome) figure.calculation = outcome;
  }

  return { figures, blocked };
}

/** Näin suuri suhteellinen ero sivun luvun ja omista luvuista lasketun välillä huomautetaan. */
export const NOTABLE_DIFFERENCE = 0.1;

/** Eroavatko luvut yli 10 %. Ero johtuu yleensä eri kaudesta tai oikaistuista luvuista. */
export function differsNotably(a: number, b: number): boolean {
  return Math.abs(a - b) > NOTABLE_DIFFERENCE * Math.max(Math.abs(a), Math.abs(b));
}
