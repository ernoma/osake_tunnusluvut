// Euroopan keskuspankin (EKP) viitekurssi euroon avoimesta Frankfurter-rajapinnasta
// (suunnitelman kohta 11.10). Kurssilla muunnetaan muun valuutan markkina-arvo euroiksi, jotta
// sitä voi verrata euromääräisiin kokoluokkiin. Rajapinnalle lähtee vain päivä ja valuuttakoodi.

export const RATES_API = "https://api.frankfurter.dev/v1/";
export const RATES_STORAGE_KEY = "tunnusluvut.valuuttakurssit";
const MAX_STORED = 30;

export interface EurRate {
  currency: string;
  /** Montako valuutan yksikköä saa yhdellä eurolla: 1 € = rate DKK. */
  rate: number;
  /** Kurssin julkaisupäivä vvvv-kk-pp. Viikonloppuna edellinen julkaisupäivä. */
  date: string;
}

/** Miksi kurssia ei saatu: verkkovirhe, EKP ei julkaise valuutalle kurssia tai outo vastaus. */
export type RateErrorReason = "verkko" | "valuutta" | "vastaus";

export class RateError extends Error {
  constructor(readonly reason: RateErrorReason) {
    super(`Valuuttakurssia ei saatu (${reason})`);
    this.name = "RateError";
  }
}

/**
 * Pyydettävä päivä: analyysin hakupäivä tai viimeisin kurssi ("latest"), jos päivää ei ole tai
 * se on tulevaisuudessa. Rajapinta ei tunne tulevia päiviä.
 */
export function rateDay(date: string, today: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : "latest";
}

export function rateUrl(currency: string, day: string): string {
  return `${RATES_API}${day}?base=EUR&symbols=${encodeURIComponent(currency)}`;
}

interface Stored extends EurRate {
  /** Hakupäivä vvvv-kk-pp. */
  fetched: string;
}

type Store = Record<string, Stored>;

// Käytössä vain, jos selaimen tallennus ei toimi (esim. yksityinen ikkuna).
const memory: Store = {};

function readStore(): Store {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RATES_STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Store)
      : {};
  } catch {
    return memory;
  }
}

function writeStore(store: Store) {
  // Uusimmat säilyvät: lisäysjärjestyksessä viimeiset.
  const kept = Object.fromEntries(Object.entries(store).slice(-MAX_STORED));
  try {
    window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    Object.assign(memory, kept);
  }
}

function isStored(value: unknown): value is Stored {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.currency === "string" &&
    typeof s.rate === "number" &&
    s.rate > 0 &&
    typeof s.date === "string" &&
    typeof s.fetched === "string"
  );
}

/**
 * Mennyttä päivää koskeva kurssi ei enää muutu. Kuluvan päivän ja viimeisimmän kurssin
 * tallenne kelpaa saman päivän loppuun, koska EKP julkaisee päivän kurssin iltapäivällä.
 */
function isFresh(stored: Stored, day: string, today: string): boolean {
  return (day !== "latest" && day < today) || stored.fetched === today;
}

/**
 * Hakee kurssin euroon annetulle päivälle tai tallenteesta. Heittää RateErrorin, kun kurssia
 * ei saada, ja keskeytyksessä AbortErrorin sellaisenaan.
 */
export async function fetchEurRate(
  currency: string,
  date: string,
  { today, signal }: { today: string; signal?: AbortSignal },
): Promise<EurRate> {
  const day = rateDay(date, today);
  const key = `${day}:${currency}`;
  const stored = readStore()[key];
  if (isStored(stored) && isFresh(stored, day, today)) {
    return { currency: stored.currency, rate: stored.rate, date: stored.date };
  }

  let response: Response;
  try {
    response = await fetch(rateUrl(currency, day), { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new RateError("verkko");
  }
  // 404: tuntematon valuutta, 422: virheellinen pyyntö, esim. EUR euroon.
  if (response.status === 404 || response.status === 422) throw new RateError("valuutta");
  if (!response.ok) throw new RateError("vastaus");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RateError("vastaus");
  }
  const { date: rateDate, rates } = (body ?? {}) as { date?: unknown; rates?: unknown };
  const rate = (rates as Record<string, unknown> | undefined)?.[currency];
  if (typeof rate !== "number" || !(rate > 0) || typeof rateDate !== "string") {
    throw new RateError("vastaus");
  }

  const result: EurRate = { currency, rate, date: rateDate };
  const store = readStore();
  delete store[key];
  writeStore({ ...store, [key]: { ...result, fetched: today } });
  return result;
}
