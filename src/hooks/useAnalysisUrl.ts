// Tutki osaketta -sivun analyysi osoitteessa (suunnitelman kohta 11.7), esimerkiksi
// ?sivu=tutki&nimi=Vonovia&val=EUR&pvm=2026-09-26&pe=12.4~t~2025~s
//
// Jokainen luku on muodossa id=arvo~kausi~vuosi~lähde: kausi on t (toteutunut), ttm (12 kk) tai
// e (ennuste), ja lähde s (sivulta) tai k (käyttäjä). Laskettuja lukuja ei tallenneta, koska ne
// syntyvät uudelleen. Osoite päivitetään replaceState-kutsulla kuten useUrlState:ssa.
//
// Rahamäärällä, joka on eri valuutassa kuin analyysi (val), on viides kenttä: luvun valuutta,
// esimerkiksi val=EUR&kurssi=118.4~ttm~~s~SEK (kohta 11.11). Vaiheen 11h osoitteissa kurssin
// valuutta oli parametrissa hval. Se luetaan edelleen kurssiin sidottujen lukujen valuutaksi.

import { useCallback, useState } from "react";
import { CURRENCY_CODE, isMoney, PRICE_BOUND_IDS } from "../data/currency.ts";
import { figuresById } from "../data/content.ts";
import type { Period } from "../data/formulas.ts";
import { PAGE_PARAM } from "./usePage.ts";

export interface AnalysisFigure {
  /** Tunnusluvun (metrics.ts) tai lähtötiedon (inputs.ts) id. */
  id: string;
  /** Perusyksikössä: euroina, prosentteina tai kertoimena. */
  value: number;
  period?: Period;
  /** "2025" tai "Q2/2026, 12 kk". Tyhjä, jos ei tiedossa. */
  year: string;
  /** sivu = poimittu liitetystä tekstistä, kayttaja = syötetty tai korjattu käsin. */
  origin: "sivu" | "kayttaja";
  /**
   * Rahamäärän valuutta, jos se on eri kuin analyysin valuutta, esim. SEK-määräinen kurssi
   * EUR-määräisessä analyysissä. Puuttuu, kun luku on analyysin valuutassa.
   */
  currency?: string;
}

export interface Analysis {
  /** Yhtiön nimi. Tyhjä, jos ei annettu. */
  name: string;
  /**
   * Kolmikirjaiminen valuuttakoodi, esim. "EUR": tilinpäätöksen valuutta, johon eri valuutan
   * luvut muunnetaan ennen laskentaa.
   */
  currency: string;
  /** Päivä, jolloin luvut haettiin (vvvv-kk-pp). Tyhjä, jos ei annettu. */
  date: string;
  /** Luvut siinä järjestyksessä kuin ne lisättiin. Sama id esiintyy enintään kerran. */
  figures: AnalysisFigure[];
}

export const DEFAULT_CURRENCY = "EUR";

export const EMPTY_ANALYSIS: Analysis = {
  name: "",
  currency: DEFAULT_CURRENCY,
  date: "",
  figures: [],
};

/** Parametrit, joita ei voi käyttää luvun id:nä. */
export const RESERVED_PARAMS = [PAGE_PARAM, "nimi", "val", "pvm", "hval"] as const;
const [, NAME_PARAM, CURRENCY_PARAM, DATE_PARAM, PRICE_CURRENCY_PARAM] = RESERVED_PARAMS;

const PERIOD_CODES: Record<Period, string> = { toteutunut: "t", ttm: "ttm", ennuste: "e" };
const ORIGIN_CODES: Record<AnalysisFigure["origin"], string> = { sivu: "s", kayttaja: "k" };

const SEPARATOR = "~";

function decodeCode<T extends string>(codes: Record<T, string>, code: string): T | undefined {
  return (Object.keys(codes) as T[]).find((key) => codes[key] === code);
}

/** Onko analyysissa jotain, mitä ei saa hukata: nimi tai luku. */
export function hasContent(analysis: Analysis): boolean {
  return analysis.name.trim() !== "" || analysis.figures.length > 0;
}

/** Kyselyosa, esim. "?sivu=tutki&nimi=Vonovia&val=EUR&pe=12.4~t~2025~s". */
export function encodeAnalysis(analysis: Analysis): string {
  // "~" jätetään koodaamatta, jotta osoite pysyy luettavana. encodeURIComponent ei koodaa sitä.
  const parts: [string, string][] = [[PAGE_PARAM, "tutki"]];
  if (analysis.name.trim()) parts.push([NAME_PARAM, analysis.name.trim()]);
  parts.push([CURRENCY_PARAM, analysis.currency]);
  if (analysis.date) parts.push([DATE_PARAM, analysis.date]);
  for (const f of analysis.figures) {
    const fields = [
      String(f.value),
      f.period ? PERIOD_CODES[f.period] : "",
      f.year.replaceAll(SEPARATOR, "").trim(),
      ORIGIN_CODES[f.origin],
    ];
    if (f.currency && f.currency !== analysis.currency && isMoney(f.id)) fields.push(f.currency);
    parts.push([f.id, fields.join(SEPARATOR)]);
  }
  return "?" + parts.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

/** Purkaa osoitteen analyysiksi. Tuntemattomat parametrit ja virheelliset luvut ohitetaan. */
export function decodeAnalysis(search: string): Analysis {
  const params = new URLSearchParams(search);
  const currencyParam = params.get(CURRENCY_PARAM)?.toUpperCase() ?? "";
  const currency = CURRENCY_CODE.test(currencyParam) ? currencyParam : DEFAULT_CURRENCY;
  const priceCurrency = params.get(PRICE_CURRENCY_PARAM)?.toUpperCase() ?? "";
  const date = params.get(DATE_PARAM) ?? "";
  const figures: AnalysisFigure[] = [];
  for (const [id, raw] of params) {
    if (!figuresById.has(id) || figures.some((f) => f.id === id)) continue;
    const [valueText = "", periodCode = "", year = "", originCode = "", currencyField = ""] =
      raw.split(SEPARATOR);
    const value = Number(valueText);
    if (valueText.trim() === "" || !Number.isFinite(value)) continue;
    // Vaiheen 11h osoitteessa kurssiin sidottujen lukujen valuutta on parametrissa hval.
    const own = currencyField.toUpperCase() || (PRICE_BOUND_IDS.has(id) ? priceCurrency : "");
    figures.push({
      id,
      value,
      period: decodeCode(PERIOD_CODES, periodCode),
      year: year.trim(),
      origin: decodeCode(ORIGIN_CODES, originCode) ?? "kayttaja",
      ...(isMoney(id) && CURRENCY_CODE.test(own) && own !== currency ? { currency: own } : {}),
    });
  }
  return {
    name: params.get(NAME_PARAM)?.trim() ?? "",
    currency,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    figures,
  };
}

/** Tämä päivä muodossa vvvv-kk-pp paikallisen ajan mukaan. */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-09-26" → "26.9.2026". */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${Number(d)}.${Number(m)}.${y}`;
}

export function useAnalysisUrl(): [Analysis, (next: Analysis) => void] {
  const [analysis, setAnalysis] = useState(() => decodeAnalysis(window.location.search));

  const update = useCallback((next: Analysis) => {
    setAnalysis(next);
    const search = hasContent(next) ? encodeAnalysis(next) : `?${PAGE_PARAM}=tutki`;
    window.history.replaceState(window.history.state, "", window.location.pathname + search);
  }, []);

  return [analysis, update];
}
