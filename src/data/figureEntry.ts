// Lukujen käsin syöttö Tutki osaketta -sivulla (suunnitelman kohta 11.6): "Lisää luku" -haku
// ja kenttään kirjoitetun arvon tarkistus.

import { normalizeForSearch } from "../hooks/useMetricFilter.ts";
import { figureCatalog, type FigureInfo } from "./content.ts";
import { parseNumber, type NumberUnit } from "./numberFormat.ts";

/** Jäsentää kenttään kirjoitetun arvon. Palauttaa luvun tai virheilmoituksen. */
export function parseFigureValue(
  text: string,
  unit: NumberUnit,
): { value: number } | { error: string } {
  const parsed = parseNumber(text);
  if (!parsed) return { error: "Kirjoita luku, esimerkiksi 1 234,5 tai 1,2 mrd." };
  if (parsed.percent && unit !== "%") return { error: "Tämä luku ei ole prosentteja." };
  return { value: parsed.value };
}

const searchTexts = new Map(
  figureCatalog.map((f) => [
    f.id,
    normalizeForSearch([f.name, f.abbreviation, ...f.aliases].join(" | ")),
  ]),
);

/**
 * Kuinka hyvin nimi tai lyhenne vastaa hakua: 0 = täsmälleen, 1 = alkaa hakusanalla,
 * 2 = jokin sana alkaa hakusanalla, 3 = osuma vain muualla (esim. aliaksessa tai sanan keskellä).
 */
function rank(f: FigureInfo, q: string): number {
  const names = [f.name, f.abbreviation].flatMap((n) => (n ? [normalizeForSearch(n)] : []));
  if (names.some((n) => n === q)) return 0;
  if (names.some((n) => n.startsWith(q))) return 1;
  if (names.some((n) => n.split(" ").some((word) => word.startsWith(q)))) return 2;
  return 3;
}

/**
 * Tunnusluvut ja lähtötiedot, jotka osuvat hakuun nimellä, lyhenteellä tai aliaksella.
 * Parhaiten osuvat ovat ensin, jotta "pe" ja Enter valitsee P/E:n ja "oma" oman pääoman
 * eikä korollisia velkoja (alias "korollinen vieras pääoma"). Muuten järjestys on aakkosellinen.
 */
export function searchFigures(
  query: string,
  exclude: ReadonlySet<string> = new Set(),
): FigureInfo[] {
  const words = normalizeForSearch(query).split(" ").filter(Boolean);
  const available = figureCatalog.filter((f) => !exclude.has(f.id));
  if (words.length === 0) return available;
  const q = words.join(" ");
  return available
    .filter((f) => words.every((w) => searchTexts.get(f.id)?.includes(w)))
    .map((f) => ({ f, rank: rank(f, q) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ f }) => f);
}
