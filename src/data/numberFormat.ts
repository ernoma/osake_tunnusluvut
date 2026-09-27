// Lukujen jäsennys ja muotoilu Tutki osaketta -sivulle (suunnitelman kohdat 11.4 ja 11.6).
// Jäsennys hyväksyy sekä suomalaisen että englantilaisen muodon ("1 234,5", "1,234.5",
// "1,2 mrd", "12 %", "2.4B"), ja muotoilu tuottaa suomalaisen muodon ("1,2 mrd. €").

import type { InputUnit, Unit } from "./types.ts";

export type NumberUnit = Unit | InputUnit;

export interface ParsedNumber {
  /** Perusyksikössä: "1,2 mrd" = 1 200 000 000 ja "12 %" = 12. */
  value: number;
  /** Tekstissä oli %-merkki. */
  percent: boolean;
}

/** Kerroinsanat. Pidemmät ensin, jotta "miljoonaa" ei jää "milj":n eikä "milj" "m":n alle. */
const SCALES: [RegExp, number][] = [
  [/^(miljardi[a-zä]*|mrd|bn|b)\.?/, 1e9],
  [/^(miljoon[a-zä]*|milj|mn|m)\.?/, 1e6],
  [/^(tuhat[a-zä]*|t|k)\.?/, 1e3],
];

/** Yksiköt ja valuutat, jotka saavat seurata lukua. Ne eivät muuta arvoa. */
const UNIT_WORDS =
  /^(€|eur|euroa?|\$|usd|sek|nok|dkk|kr|kpl|osaketta|x|krt|kertaa|%|€\/osake|€ \/ osake)$/;

const MINUS = /^[-\u2212–]/;

/**
 * Jäsentää käyttäjän syöttämän tai sivulta kopioidun luvun. Palauttaa null, jos teksti ei ole luku.
 *
 * Erottimet: jos tekstissä on sekä pilkku että piste, jälkimmäinen on desimaalierotin. Jos vain
 * toista esiintyy useasti, se on tuhaterotin. Yksittäinen pilkku tai piste on desimaalierotin,
 * joten "1,234" on suomalaisittain 1,234 eikä 1234.
 */
export function parseNumber(text: string): ParsedNumber | null {
  let s = text
    .replace(/[\u00a0\u202f\u2009\u2007]/g, " ")
    .trim()
    .toLowerCase();
  let sign = 1;
  if (MINUS.test(s)) {
    sign = -1;
    s = s.slice(1).trimStart();
  } else if (s.startsWith("+")) {
    s = s.slice(1).trimStart();
  }
  // Valuuttamerkki voi olla myös luvun edessä: "€ 12" tai "$12".
  s = s.replace(/^[€$]\s*/, "");

  const match = /^(\d{1,3}(?:[ ']\d{3})+(?:[.,]\d+)?|\d[\d.,]*)(.*)$/.exec(s);
  if (!match) return null;
  const [, numberPart = "", restPart = ""] = match;
  const digits = normalizeDigits(numberPart.replace(/[ ']/g, "").replace(/[.,]$/, ""));
  if (digits === null) return null;

  let rest = restPart.trim();
  let scale = 1;
  if (!UNIT_WORDS.test(rest) && rest !== "") {
    const found = SCALES.find(([re]) => re.test(rest));
    if (!found) return null;
    scale = found[1];
    rest = rest.replace(found[0], "").trim();
    if (rest !== "" && !UNIT_WORDS.test(rest)) return null;
  }

  const value = sign * Number(digits) * scale;
  if (!Number.isFinite(value)) return null;
  return { value: roundFloat(value), percent: rest === "%" };
}

/** "1.234,5" → "1234.5". Null, jos erottimia ei voi tulkita. */
function normalizeDigits(s: string): string | null {
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    const decimal = lastComma > lastDot ? "," : ".";
    const group = decimal === "," ? "." : ",";
    const [whole = "", fraction = "", ...extra] = s.split(decimal);
    if (extra.length > 0 || fraction.includes(group)) return null;
    return `${whole.split(group).join("")}.${fraction}`;
  }
  const sep = lastComma !== -1 ? "," : lastDot !== -1 ? "." : null;
  if (sep === null) return s;
  const parts = s.split(sep);
  if (parts.length === 2) return parts.join(".");
  // Toistuva erotin on tuhaterotin: jokaisessa ryhmässä pitää olla kolme numeroa.
  return parts.slice(1).every((p) => p.length === 3) ? parts.join("") : null;
}

/** Poistaa liukulukuvirheen, esim. 1,1 × 1e9 = 1100000000.0000002. */
function roundFloat(n: number): number {
  return Number(n.toPrecision(12));
}

const NBSP = "\u00a0";

function fi(options: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("fi-FI", options);
}

const plain = fi({ maximumFractionDigits: 2 });
const oneDecimal = fi({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDecimals = fi({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const scaled = fi({ maximumSignificantDigits: 3 });

/** "1,1 mrd." tai "300 000": suuret määrät lyhennetään. */
function formatAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${scaled.format(value / 1e9)}${NBSP}mrd.`;
  if (abs >= 1e6) return `${scaled.format(value / 1e6)}${NBSP}milj.`;
  return plain.format(value);
}

/** Valuutan merkki: euro on €, muut valuutat koodina ("USD"). */
function currencySymbol(currency: string): string {
  return currency === "EUR" ? "€" : currency;
}

/**
 * Muotoilee luvun suomalaisittain yksikön mukaan:
 * € → "1,1 mrd. €", % → "12,3 %", x → "18,0", €/osake → "2,50 €", kpl → "5 milj. kpl".
 * Kertoimelle ei lisätä yksikköä, koska kortitkin kirjoittavat "P/E = 10".
 * Rahamäärät näytetään annetussa valuutassa, esimerkiksi "1,1 mrd. USD".
 */
export function formatNumber(value: number, unit: NumberUnit, currency = "EUR"): string {
  const symbol = currencySymbol(currency);
  switch (unit) {
    case "€":
      return `${formatAmount(value)}${NBSP}${symbol}`;
    case "kpl":
      return `${formatAmount(value)}${NBSP}kpl`;
    case "€/osake":
      return `${twoDecimals.format(value)}${NBSP}${symbol}`;
    case "%":
      return `${oneDecimal.format(value)}${NBSP}%`;
    case "x":
      return oneDecimal.format(value);
  }
}

const rateFormat = fi({ maximumFractionDigits: 4 });

/** Valuuttakurssi euroon: "1 € = 7,4755 DKK". */
export function formatEurRate(rate: number, currency: string): string {
  return `1${NBSP}€ = ${rateFormat.format(rate)}${NBSP}${currency}`;
}

/** Yksikön nimi syöttökentän vieressä: "€", "USD", "€/osake", "%", "kpl" tai "kerroin". */
export function unitLabel(unit: NumberUnit, currency = "EUR"): string {
  const symbol = currencySymbol(currency);
  switch (unit) {
    case "€":
      return symbol;
    case "€/osake":
      return `${symbol}/osake`;
    case "x":
      return "kerroin";
    default:
      return unit;
  }
}

const exact = fi({ maximumFractionDigits: 10, useGrouping: true });

/**
 * Luku muokattavaksi kenttään tarkkana ja ilman kerroinsanoja: 1 234 567 890 eikä "1,23 mrd.".
 * parseNumber lukee tuloksen takaisin samaksi luvuksi. Intl:n sitovat välilyönnit ja
 * miinusmerkki (−) vaihdetaan tavallisiksi, jotta niitä on helppo muokata.
 */
export function formatForInput(value: number): string {
  return exact
    .format(value)
    .replace(/\s/g, " ")
    .replace(/^\p{Sm}/u, "-");
}
