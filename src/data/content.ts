// Käyttöliittymän hakemistot: sisältö koottuna kerran, jotta komponentit löytävät
// termit, tunnusluvut ja sivustot id:n perusteella.

import { categories } from "./categories.ts";
import { glossary } from "./glossary.ts";
import { inputs } from "./inputs.ts";
import { metrics } from "./metrics.ts";
import { planned } from "./planned.ts";
import { normalizeKey } from "./richText.ts";
import { sources } from "./sources.ts";
import { buildTermIndex, type TermTarget } from "./terms.ts";
import type {
  Category,
  GlossaryTerm,
  InputFigure,
  InputUnit,
  Metric,
  PlannedMetric,
  Source,
  Unit,
} from "./types.ts";

export { categories, glossary, inputs, metrics, planned, sources };

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]));

export const metricsById: ReadonlyMap<string, Metric> = byId(metrics);
export const plannedById: ReadonlyMap<string, PlannedMetric> = byId(planned);
export const glossaryById: ReadonlyMap<string, GlossaryTerm> = byId(glossary);
export const sourcesById: ReadonlyMap<string, Source> = byId(sources);
export const inputsById: ReadonlyMap<string, InputFigure> = byId(inputs);

const { index: termIndex } = buildTermIndex(metrics, planned, glossary);

/** Mihin [[termi]] osoittaa. Undefined, jos termiä ei tunneta (validointi estää tämän). */
export function resolveTerm(key: string): TermTarget | undefined {
  return termIndex.get(normalizeKey(key));
}

/** Tunnusluvun lyhyt nimi merkinnöissä: lyhenne, jos sellainen on, muuten nimi. */
export function shortMetricName(m: { name: string; abbreviation?: string }): string {
  return m.abbreviation ?? m.name;
}

/** "Yritysarvo (EV)", mutta "P/E-luku" eikä "P/E-luku (P/E)". */
export function displayName(m: { name: string; abbreviation?: string }): string {
  return m.abbreviation && !m.name.includes(m.abbreviation)
    ? `${m.name} (${m.abbreviation})`
    : m.name;
}

export interface CategoryGroup {
  category: Category;
  metrics: Metric[];
}

/**
 * Tunnusluvut kategorioittain kategorioiden järjestyksessä. Kategorian sisällä perustason
 * luvut ovat ensin, muuten järjestys on sama kuin metrics.ts:ssä. Tyhjät kategoriat jätetään pois.
 */
export function groupByCategory(items: readonly Metric[]): CategoryGroup[] {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const inCategory = items.filter((m) => m.category === category.id);
      return {
        category,
        metrics: [
          ...inCategory.filter((m) => m.level === "perus"),
          ...inCategory.filter((m) => m.level !== "perus"),
        ],
      };
    })
    .filter((group) => group.metrics.length > 0);
}

/** Luku, jonka voi syöttää Tutki osaketta -sivulla: tunnusluku tai lähtötieto. */
export interface FigureInfo {
  id: string;
  name: string;
  abbreviation?: string;
  aliases: readonly string[];
  unit: Unit | InputUnit;
  kind: "tunnusluku" | "lahtotieto";
  /** Kulu, joka ilmoitetaan positiivisena (ks. InputFigure.expense). */
  expense?: true;
}

const collator = new Intl.Collator("fi");

/** Tunnusluvut ja lähtötiedot suomen aakkosjärjestyksessä. */
export const figureCatalog: readonly FigureInfo[] = [
  ...metrics.map((m): FigureInfo => ({
    id: m.id,
    name: m.name,
    abbreviation: m.abbreviation,
    aliases: m.aliases,
    unit: m.unit,
    kind: "tunnusluku",
  })),
  ...inputs.map((i): FigureInfo => ({
    id: i.id,
    name: i.name,
    aliases: i.aliases,
    unit: i.unit,
    expense: i.expense,
    kind: "lahtotieto",
  })),
].sort((a, b) => collator.compare(a.name, b.name));

export const figuresById: ReadonlyMap<string, FigureInfo> = byId(figureCatalog);
