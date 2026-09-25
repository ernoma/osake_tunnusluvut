// Haku ja suodatus. Logiikka on puhtaina funktioina, jotta sen voi testata ilman käyttöliittymää.

import { useMemo } from "react";
import { categories } from "../data/categories.ts";
import { toPlainText } from "../data/richText.ts";
import type { CategoryId, Metric } from "../data/types.ts";

export interface Filters {
  /** Hakusana sellaisena kuin käyttäjä sen kirjoitti. */
  query: string;
  /** null = kaikki kategoriat. */
  category: CategoryId | null;
  showAdvanced: boolean;
}

export interface FilterResult {
  /** Näytettävät tunnusluvut. */
  visible: Metric[];
  /** Hakuun osuvat luvut, jotka kategoria- tai tasosuodatin piilottaa. */
  hiddenMatches: Metric[];
}

/**
 * Hakua varten: pienet kirjaimet, ä → a ja ö → o, välimerkit pois. Näin "paaoma" löytää
 * "pääoman", "pe" löytää "P/E":n ja "markkina arvo" löytää "markkina-arvon".
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLocaleLowerCase("fi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const categoriesById = new Map(categories.map((c) => [c.id, c]));

/**
 * Kentät, joista haetaan: nimi, lyhenne, synonyymit ja kysymys. Mukana on myös kategorian
 * kysymys, jotta aloittelijan arkinen sana ("halpa", "velka") löytää koko ryhmän.
 */
function searchText(m: Metric): string {
  const category = categoriesById.get(m.category);
  return normalizeForSearch(
    [
      m.name,
      m.abbreviation,
      m.abbreviationExpanded,
      ...m.aliases,
      toPlainText(m.question),
      category?.shortName,
      category?.question,
    ]
      .filter(Boolean)
      .join(" | "),
  );
}

const searchTexts = new WeakMap<Metric, string>();

/** Osuuko tunnusluku hakuun. Jokaisen hakusanan pitää löytyä jostakin kentästä. */
export function matchesQuery(m: Metric, query: string): boolean {
  const words = normalizeForSearch(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  let text = searchTexts.get(m);
  if (text === undefined) {
    text = searchText(m);
    searchTexts.set(m, text);
  }
  return words.every((w) => text.includes(w));
}

function passesFilters(m: Metric, { category, showAdvanced }: Filters): boolean {
  return (category === null || m.category === category) && (showAdvanced || m.level === "perus");
}

export function filterMetrics(metrics: readonly Metric[], filters: Filters): FilterResult {
  const visible: Metric[] = [];
  const hiddenMatches: Metric[] = [];
  for (const m of metrics) {
    if (!matchesQuery(m, filters.query)) continue;
    (passesFilters(m, filters) ? visible : hiddenMatches).push(m);
  }
  return { visible, hiddenMatches };
}

/**
 * Suodattimet, joilla tunnusluku tulee näkyviin. Vain se, mikä piilottaa luvun, nollataan:
 * esimerkiksi kategoria vaihtuu kaikkiin, mutta haku säilyy, jos luku osuu siihen.
 */
export function revealMetric(filters: Filters, m: Metric): Filters {
  return {
    query: matchesQuery(m, filters.query) ? filters.query : "",
    category:
      filters.category === null || filters.category === m.category ? filters.category : null,
    showAdvanced: filters.showAdvanced || m.level === "perus" ? filters.showAdvanced : true,
  };
}

export function useMetricFilter(metrics: readonly Metric[], filters: Filters): FilterResult {
  const { query, category, showAdvanced } = filters;
  return useMemo(
    () => filterMetrics(metrics, { query, category, showAdvanced }),
    [metrics, query, category, showAdvanced],
  );
}
