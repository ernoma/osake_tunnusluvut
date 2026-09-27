// Tekoälyn vastauksen tarkistus ennen lukutaulukkoa (suunnitelman kohta 11.2). Puhdas funktio,
// joten sen voi testata ilman rajapintaa.
//
// 1. Tuntemattomat id:t ja saman id:n kaksoiskappaleet hylätään.
// 2. Lainauksen pitää löytyä liitetystä tekstistä, kun välilyönnit normalisoidaan. Muuten malli
//    on keksinyt lainauksen, ja rivi hylätään.
// 3. Lainauksen luvun pitää vastata arvoa, kun "mrd", "milj.", desimaalipilkku ja %-merkki
//    huomioidaan. Jos ei vastaa, rivi merkitään tarkistettavaksi, eikä sitä valita oletuksena.

import { figuresById } from "../data/content.ts";
import type { Period } from "../data/formulas.ts";
import { parseNumber } from "../data/numberFormat.ts";
import type { ExtractionResult } from "./schema.ts";

export interface CheckedValue {
  id: string;
  value: number;
  period: Period;
  /** Tyhjä, jos ei tiedossa. */
  year: string;
  quote: string;
  /** ok = lainauksen luku vastaa arvoa, tarkista = ei vastaa, käyttäjän pitää katsoa. */
  check: "ok" | "tarkista";
  /** Miksi luku pitää tarkistaa, esim. "lainauksen luku ei vastaa arvoa". */
  warning?: string;
}

/** Rahamäärä, jota pienempi on pörssiyhtiölle epätodennäköinen (euroina tai muuna valuuttana). */
const SMALL_AMOUNT = 100_000;

export interface RejectedValue {
  id: string;
  value: number;
  quote: string;
  reason: "tuntematon" | "kaksoiskappale" | "lainaus";
}

export interface VerifiedExtraction {
  company: {
    name: string;
    /** Tilinpäätöslukujen valuutta. */
    currency: string | null;
    /** Kurssin ja markkina-arvon valuutta, jos se on tiedossa ja eroaa currencystä. */
    priceCurrency: string | null;
  };
  values: CheckedValue[];
  rejected: RejectedValue[];
  notes: string[];
}

/** Välilyönnit, lainausmerkit ja viivat yhtenäisiksi ja pienet kirjaimet. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[‐-―−]/g, "-")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Löytyykö lainaus tekstistä. Tyhjä lainaus ei kelpaa. */
export function quoteFound(quote: string, normalizedText: string): boolean {
  const q = normalizeText(quote);
  return q.length > 0 && normalizedText.includes(q);
}

/** Kerroinsanat. Pidemmät ensin, jotta "miljoonaa" ei jää "m":n alle. */
const SCALE_WORDS: [string, number][] = [
  ["miljardi[a-zä]*|mrd|billions?|bn|b", 1e9],
  ["miljoon[a-zä]*|milj|millions?|meur|musd|msek|mnok|mdkk|m€|m\\$|mn|m", 1e6],
  ["1 ?000 (?:euroa|eur|€)|tuhat[a-zä]*|thousands?|teur|t€|k€|k", 1e3],
];

/** Kerroinsana heti luvun perässä: "350 milj.", "1,2 mrd", "12,5 MEUR", "2.4B". */
const SCALE_AFTER = SCALE_WORDS.map(
  ([words, scale]) => [new RegExp(`^\\s*(${words})(?![a-zä])`), scale] as const,
);
/** Kerroinsana muualla, esim. taulukon otsikossa: "Liikevaihto, MEUR" tai "(1 000 euroa)". */
const SCALE_ANYWHERE = SCALE_WORDS.map(
  ([words, scale]) => [new RegExp(`(?<![a-zä\\d])(${words})(?![a-zä])`), scale] as const,
);

/** Kertoimet, jotka tekstissä mainitaan, esim. taulukon otsikon "MEUR". */
export function scalesIn(text: string): number[] {
  const lower = text.normalize("NFKC").toLowerCase();
  return SCALE_ANYWHERE.filter(([re]) => re.test(lower)).map(([, s]) => s);
}

// Luku tuhaterottimina välilyönnein ("1 234 567,8") tai ilman ("1234,5", "1,234.5", "12").
const GROUPED = /\d{1,3}(?: \d{3})+(?:[.,]\d+)?/g;
const PLAIN = /\d+(?:[.,]\d+)*/g;

/**
 * Luvut, jotka välilyönnein erotettu jono voi tarkoittaa. Taulukon rivillä vierekkäiset luvut
 * ("245 318 231 004") näyttävät yhdeltä luvulta, joten kaikki peräkkäiset ryhmät kokeillaan:
 * 245, 245 318, 318 231 ja niin edelleen.
 */
function groupedCandidates(match: string): string[] {
  const parts = match.split(" ");
  const candidates: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i; j < parts.length; j++) candidates.push(parts.slice(i, j + 1).join(" "));
  }
  return candidates;
}

interface QuotedNumber {
  /** Luku kaikkine mahdollisine etumerkkeineen. */
  values: number[];
  /** Kertoimet, joilla luku voi olla ilmoitettu. */
  scales: number[];
}

interface MatchOptions {
  /** Prosenttiluvun saa ilmoittaa myös osuutena (0,123 = 12,3 %). */
  percent?: boolean;
  /** Kulu, joka näkyy tekstissä usein miinusmerkkisenä (InputFigure.expense). */
  expense?: boolean;
  /** Muualla tekstissä mainitut kertoimet (scalesIn), esim. taulukon otsikon "MEUR". */
  contextScales?: readonly number[];
}

/** Luvut lainauksessa ja kertoimet, joilla kukin voi olla ilmoitettu. */
function numbersIn(quote: string, options: MatchOptions): QuotedNumber[] {
  // NFKC muuttaa sitovat ja kapeat välilyönnit tavallisiksi.
  const text = quote.normalize("NFKC").toLowerCase();
  const elsewhere = [...scalesIn(text), ...(options.contextScales ?? [])];
  const found: QuotedNumber[] = [];
  for (const re of [GROUPED, PLAIN]) {
    for (const match of text.matchAll(re)) {
      const start = match.index;
      const before = text.slice(0, start).trimEnd().slice(-1);
      // Luvun perässä oleva kerroinsana on ainoa oikea kerroin: "350 MEUR" ei ole 350.
      const after = text.slice(start + match[0].length);
      const own = SCALE_AFTER.find(([re]) => re.test(after));
      const scales = own ? [own[1]] : [1, ...elsewhere, ...(options.percent ? [100] : [])];
      const texts = re === GROUPED ? groupedCandidates(match[0]) : [match[0]];
      for (const t of texts) {
        const parsed = parseNumber(t);
        if (!parsed) continue;
        const n = parsed.value;
        // "-" ja "−" ovat miinusmerkkejä. Ajatusviiva voi olla välin merkki ("10–15"), ja sulut
        // tarkoittavat tilinpäätöksessä negatiivista lukua, joten niistä hyväksytään kumpikin.
        // Kulut kelpaavat positiivisina, vaikka tekstissä olisi miinusmerkki.
        const negative = before === "-" || before === "−";
        const either = before === "–" || before === "(" || (negative && options.expense);
        const values = either ? [n, -n] : negative ? [-n] : [n];
        found.push({ values, scales });
      }
    }
  }
  return found;
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(b) * 1e-6, 1e-9);
}

/**
 * Vastaako lainauksessa oleva luku arvoa. Kerroinsanat ("milj.", "MEUR", "mrd") otetaan
 * huomioon lainauksesta ja muualta tekstistä (contextScales).
 */
export function quoteMatchesValue(
  quote: string,
  value: number,
  options: MatchOptions = {},
): boolean {
  return numbersIn(quote, options).some(({ values, scales }) =>
    values.some((n) => scales.some((s) => close(n * s, value))),
  );
}

const CURRENCY = /^[A-Z]{3}$/;

export function verifyExtraction(result: ExtractionResult, text: string): VerifiedExtraction {
  const normalized = normalizeText(text);
  const contextScales = scalesIn(text);
  const values: CheckedValue[] = [];
  const rejected: RejectedValue[] = [];
  const seen = new Set<string>();

  for (const v of result.values) {
    const reject = (reason: RejectedValue["reason"]) =>
      rejected.push({ id: v.id, value: v.value, quote: v.quote, reason });
    const info = figuresById.get(v.id);
    if (!info || !Number.isFinite(v.value)) {
      reject("tuntematon");
      continue;
    }
    if (seen.has(v.id)) {
      reject("kaksoiskappale");
      continue;
    }
    seen.add(v.id);
    if (!quoteFound(v.quote, normalized)) {
      reject("lainaus");
      continue;
    }
    const matches = quoteMatchesValue(v.quote, v.value, {
      percent: info.unit === "%",
      expense: info.expense,
      contextScales,
    });
    // Pörssiyhtiön rahamäärä alle 100 000 on lähes aina unohtunut "milj." tai "MEUR".
    const tooSmall = info.unit === "€" && v.value !== 0 && Math.abs(v.value) < SMALL_AMOUNT;
    values.push({
      id: v.id,
      value: v.value,
      period: v.period,
      year: v.year?.trim() ?? "",
      quote: v.quote.trim(),
      check: matches && !tooSmall ? "ok" : "tarkista",
      ...(!matches
        ? { warning: "lainauksen luku ei vastaa arvoa." }
        : tooSmall
          ? { warning: "rahamäärä on epätavallisen pieni. Onko yksikkö (milj., mrd) huomioitu?" }
          : {}),
    });
  }

  const code = (c: string | null) => {
    const upper = c?.trim().toUpperCase() ?? "";
    return CURRENCY.test(upper) ? upper : null;
  };
  const currency = code(result.company.currency);
  const priceCurrency = code(result.company.priceCurrency);
  return {
    company: {
      name: result.company.name?.trim() ?? "",
      currency,
      // Kurssin valuutasta on hyötyä vain, jos tilinpäätöksen valuutta on tiedossa ja eri.
      priceCurrency: currency && priceCurrency !== currency ? priceCurrency : null,
    },
    values,
    rejected,
    notes: result.notes.map((n) => n.trim()).filter(Boolean),
  };
}
