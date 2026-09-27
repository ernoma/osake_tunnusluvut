// Lukujen valuutat (suunnitelman kohta 11.11, vaihe 11i). Rahamääräisellä luvulla voi olla oma
// valuutta, esimerkiksi kruunuissa noteeratun yhtiön kurssi, kun tilinpäätös on euroissa. Ennen
// laskentaa luvut muunnetaan analyysin (tilinpäätöksen) valuuttaan EKP:n kurssilla. Jos kurssia
// ei saada, eri valuutan lukua ei käytetä laskennassa. Puhtaita funktioita.

import { figuresById } from "./content.ts";
import { rateErrorText, type RateErrorReason, type RateState } from "./exchangeRates.ts";
import type { Conversion, KnownFigure, Period } from "./formulas.ts";

/** Valuutat valintalistoissa. */
export const CURRENCIES = ["EUR", "USD", "SEK", "NOK", "DKK", "GBP", "CHF"] as const;

export const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Valintalistan valuutat. Muu koodi (esim. osoitteesta) lisätään listaan. */
export function currencyOptions(selected: string): readonly string[] {
  return CURRENCIES.includes(selected as (typeof CURRENCIES)[number])
    ? CURRENCIES
    : [...CURRENCIES, selected];
}

/** Kurssiin sidotut rahamäärät, jotka ilmoitetaan usein pörssin valuutassa. */
export const PRICE_BOUND_IDS: ReadonlySet<string> = new Set(["kurssi", "markkina-arvo", "ev"]);

/** Onko luku rahamäärä. Vain rahamäärällä on valuutta. */
export function isMoney(id: string): boolean {
  const unit = figuresById.get(id)?.unit;
  return unit === "€" || unit === "€/osake";
}

interface FigureCurrency {
  id: string;
  /** Oma valuutta. Puuttuu, jos luku on analyysin valuutassa. */
  currency?: string;
}

/** Valuutta, jossa luku on: rahamäärän oma valuutta tai analyysin valuutta. */
export function currencyOf(figure: FigureCurrency, currency: string): string {
  return figure.currency && isMoney(figure.id) ? figure.currency : currency;
}

/** Onko luku eri valuutassa kuin analyysi, eli pitääkö se muuntaa. */
export function needsConversion(figure: FigureCurrency, currency: string): boolean {
  return currencyOf(figure, currency) !== currency;
}

/** Valuutat, joiden kurssi euroon tarvitaan lukujen muuntamiseen. Euroa ei tarvita. */
export function ratesNeeded(figures: readonly FigureCurrency[], currency: string): string[] {
  const foreign = figures.filter((f) => needsConversion(f, currency)).map((f) => f.currency!);
  if (foreign.length === 0) return [];
  return [...new Set([...foreign, currency])].filter((c) => c !== "EUR").sort();
}

/** Luku, jota ei voitu muuntaa analyysin valuuttaan, eikä sitä siksi käytetä laskennassa. */
export interface Unconverted {
  id: string;
  /** Luvun valuutta. */
  currency: string;
  /** haetaan = kurssin haku on kesken. */
  reason: RateErrorReason | "haetaan";
  /** Valuutta, jonka kurssia ei saatu (luvun tai analyysin valuutta). */
  failed: string;
}

interface InputFigure extends FigureCurrency {
  value: number;
  origin: "kayttaja" | "sivu";
  period?: Period;
}

type Rate =
  { rate: number; date: string } | { reason: RateErrorReason | "haetaan"; failed: string };

function eurRate(currency: string, rates: ReadonlyMap<string, RateState>): Rate {
  if (currency === "EUR") return { rate: 1, date: "" };
  const state = rates.get(currency);
  if (state?.status === "valmis") return { rate: state.rate.rate, date: state.rate.date };
  if (state?.status === "virhe") return { reason: state.reason, failed: currency };
  return { reason: "haetaan", failed: currency };
}

/**
 * Laskennan lähtöluvut analyysin valuutassa. Eri valuutan rahamäärä muunnetaan kurssien
 * euroon kautta: 1 € = 11,29 SEK ja 1 € = 1,14 USD antavat 1 USD = 9,90 SEK. Jos kurssia ei
 * saada tai haku on kesken, luku jätetään pois ja kerrotaan listassa unconverted.
 */
export function convertFigures(
  figures: readonly InputFigure[],
  currency: string,
  rates: ReadonlyMap<string, RateState>,
): { known: Map<string, KnownFigure>; unconverted: Unconverted[] } {
  const known = new Map<string, KnownFigure>();
  const unconverted: Unconverted[] = [];
  const target = eurRate(currency, rates);
  for (const f of figures) {
    const base = { value: f.value, origin: f.origin, period: f.period };
    if (!needsConversion(f, currency)) {
      known.set(f.id, base);
      continue;
    }
    const from = f.currency!;
    const source = eurRate(from, rates);
    if ("reason" in source) {
      unconverted.push({ id: f.id, currency: from, ...source });
      continue;
    }
    if ("reason" in target) {
      unconverted.push({ id: f.id, currency: from, ...target });
      continue;
    }
    const rate = source.rate / target.rate;
    const conversion: Conversion = {
      currency: from,
      original: f.value,
      rate,
      date: source.date || target.date,
    };
    known.set(f.id, { ...base, value: f.value / rate, conversion });
  }
  return { known, unconverted };
}

/** Miksi luku puuttuu laskennasta, esim. "Osakkeen kurssi on SEK-määräinen, …". */
export function unconvertedText(item: Unconverted, name: string, currency: string): string {
  if (item.reason === "haetaan") {
    return `${name} on ${item.currency}-määräinen. Haetaan valuuttakurssia sen muuntamiseksi valuuttaan ${currency}…`;
  }
  return (
    `${name} on ${item.currency}-määräinen, eikä sitä voitu muuntaa valuuttaan ${currency}, ` +
    `joten sitä ei käytetä laskennassa. ${rateErrorText(item.reason, item.failed)}`
  );
}
