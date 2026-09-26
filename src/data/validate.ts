// Koko sisällön tarkistus: skeemat, id:iden yksilöllisyys, rinnakkaisviittaukset, sanastotermit
// ja lisälukemista-linkit. Virheet (errors) kaatavat testit. Varoitukset (warnings) kertovat
// "tulossa"-viittauksista ja linkeistä, jotka kaipaavat huomiota.

import type { z } from "zod";
import { hasMalformedMarkup, normalizeKey, termKeys } from "./richText.ts";
import {
  categorySchema,
  glossaryTermSchema,
  inputFigureSchema,
  metricSchema,
  plannedMetricSchema,
  sourceSchema,
} from "./schema.ts";
import { buildTermIndex } from "./terms.ts";
import {
  CATEGORY_IDS,
  type Category,
  type GlossaryTerm,
  type InputFigure,
  type Metric,
  type PlannedMetric,
  type Source,
} from "./types.ts";

export interface Content {
  metrics: readonly Metric[];
  planned: readonly PlannedMetric[];
  categories: readonly Category[];
  glossary: readonly GlossaryTerm[];
  sources: readonly Source[];
  /** Lähtötiedot (inputs.ts). */
  inputs: readonly InputFigure[];
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ValidateOptions {
  /** Päivä, johon linkkien checkedAt-päiviä verrataan. Oletuksena tämä päivä. */
  today?: Date;
}

/** Näin monen kuukauden jälkeen linkin sisältö pitää lukea uudelleen. */
export const LINK_RECHECK_MONTHS = 12;

export function validateContent(
  content: Content,
  { today = new Date() }: ValidateOptions = {},
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { metrics, planned, categories, glossary, sources, inputs } = content;

  checkSchema(metricSchema, metrics, "tunnusluku", errors);
  checkSchema(plannedMetricSchema, planned, "tulossa", errors);
  checkSchema(categorySchema, categories, "kategoria", errors);
  checkSchema(glossaryTermSchema, glossary, "sanasto", errors);
  checkSchema(sourceSchema, sources, "sivusto", errors);
  checkSchema(inputFigureSchema, inputs, "lähtötieto", errors);

  // Yksilöllisyys
  for (const id of duplicates(metrics.map((m) => m.id)))
    errors.push(`tunnusluvun id "${id}" on käytössä useasti`);
  for (const id of duplicates(planned.map((p) => p.id)))
    errors.push(`tulossa-listan id "${id}" on käytössä useasti`);
  for (const id of duplicates(glossary.map((g) => g.id)))
    errors.push(`sanaston id "${id}" on käytössä useasti`);
  const metricIds = new Set(metrics.map((m) => m.id));
  const plannedIds = new Set(planned.map((p) => p.id));
  for (const id of plannedIds) {
    if (metricIds.has(id))
      errors.push(`"${id}" on jo kirjoitettu tunnusluku: poista se tulossa-listalta (planned.ts)`);
  }

  // Lähtötiedot: id:t ja nimet eivät saa sekoittua tunnuslukuihin, koska tekoälyhaku ja
  // "Lisää luku" -haku tunnistavat luvut niiden perusteella.
  for (const id of duplicates(inputs.map((i) => i.id)))
    errors.push(`lähtötiedon id "${id}" on käytössä useasti`);
  for (const i of inputs) {
    if (metricIds.has(i.id) || plannedIds.has(i.id))
      errors.push(`lähtötiedon id "${i.id}" on jo tunnusluvun id`);
  }
  const figureNames = new Map<string, string>();
  const addName = (name: string, owner: string) => {
    const key = normalizeKey(name);
    const existing = figureNames.get(key);
    if (existing && existing !== owner)
      errors.push(`nimi "${name}" kuuluu sekä luvulle ${existing} että ${owner}`);
    else figureNames.set(key, owner);
  };
  for (const m of metrics) {
    for (const name of [m.name, ...(m.abbreviation ? [m.abbreviation] : []), ...m.aliases])
      addName(name, `tunnusluku ${m.id}`);
  }
  for (const i of inputs) {
    for (const name of [i.name, ...i.aliases]) addName(name, `lähtötieto ${i.id}`);
  }

  // Kategoriat: jokainen CategoryId täsmälleen kerran, järjestysnumerot yksilöllisiä
  for (const id of duplicates(categories.map((c) => c.id)))
    errors.push(`kategoria "${id}" on määritelty useasti`);
  for (const id of CATEGORY_IDS) {
    if (!categories.some((c) => c.id === id))
      errors.push(`kategoria "${id}" puuttuu tiedostosta categories.ts`);
  }
  for (const order of duplicates(categories.map((c) => String(c.order)))) {
    errors.push(`kategorioilla on sama järjestysnumero ${order}`);
  }

  // Rinnakkaistunnusluvut
  for (const m of metrics) {
    for (const id of duplicates(m.companions.map((c) => c.id))) {
      errors.push(`${m.id}: rinnakkaistunnusluku "${id}" on listattu useasti`);
    }
    for (const c of m.companions) {
      if (c.id === m.id) errors.push(`${m.id}: tunnusluku ei voi viitata itseensä`);
      else if (plannedIds.has(c.id))
        warnings.push(`${m.id} → ${c.id}: näytetään "tulossa"-tilassa`);
      else if (!metricIds.has(c.id))
        errors.push(`${m.id} → ${c.id}: tuntematon rinnakkaistunnusluku`);
    }
  }

  // Sanaston tunnuslukulinkit
  for (const g of glossary) {
    if (
      g.relatedMetricId &&
      !metricIds.has(g.relatedMetricId) &&
      !plannedIds.has(g.relatedMetricId)
    ) {
      errors.push(`sanasto ${g.id}: tuntematon relatedMetricId "${g.relatedMetricId}"`);
    }
  }

  // Lisälukemista-linkit
  for (const id of duplicates(sources.map((s) => s.id)))
    errors.push(`sivuston id "${id}" on käytössä useasti (sources.ts)`);
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const todayStr = toIsoDate(today);
  const recheckLimit = new Date(today);
  recheckLimit.setUTCMonth(recheckLimit.getUTCMonth() - LINK_RECHECK_MONTHS);
  const recheckStr = toIsoDate(recheckLimit);
  for (const m of metrics) {
    if (m.links.length === 0) {
      warnings.push(`${m.id}: ei yhtään lisälukemista-linkkiä`);
      continue;
    }
    if (!m.links.some((l) => l.language === "fi"))
      warnings.push(`${m.id}: ei yhtään suomenkielistä lisälukemista-linkkiä`);
    const firstForeign = m.links.findIndex((l) => l.language !== "fi");
    if (firstForeign !== -1 && m.links.slice(firstForeign).some((l) => l.language === "fi"))
      errors.push(`${m.id}: suomenkieliset linkit kuuluvat listassa ensin`);
    for (const url of duplicates(m.links.map((l) => l.url)))
      errors.push(`${m.id}: linkki ${url} on listattu useasti`);
    m.links.forEach((link, i) => {
      const path = `${m.id}.links[${i}]`;
      const source = sourceById.get(link.sourceId);
      if (!source) {
        errors.push(`${path}: tuntematon sivusto "${link.sourceId}" (lisää se sources.ts:ään)`);
      } else if (!hostMatches(link.url, source.domain)) {
        errors.push(`${path}: osoite ${link.url} ei ole sivuston ${source.domain} osoite`);
      }
      if (link.checkedAt > todayStr) {
        errors.push(`${path}: checkedAt ${link.checkedAt} on tulevaisuudessa`);
      } else if (link.checkedAt < recheckStr) {
        warnings.push(`${path}: luettu viimeksi ${link.checkedAt}, lue sisältö uudelleen`);
      }
    });
  }

  // Sanastotermit teksteissä (linkkien otsikoissa ei käytetä [[ ]]-merkintöjä)
  const { index, collisions } = buildTermIndex(metrics, planned, glossary);
  for (const c of collisions) errors.push(`termi ${c}`);
  for (const i of inputs) {
    if (i.term && !index.has(normalizeKey(i.term)))
      errors.push(`lähtötieto ${i.id}: termiä "${i.term}" ei löydy sanastosta eikä tunnusluvuista`);
  }
  const texts = [
    ...metrics.flatMap((m) => [...walkStrings({ ...m, links: undefined }, m.id)]),
    ...glossary.flatMap((g) => [...walkStrings(g, `sanasto ${g.id}`)]),
  ];
  for (const { path, text } of texts) {
    if (hasMalformedMarkup(text)) errors.push(`${path}: rikkinäinen [[ ]]-merkintä: "${text}"`);
    for (const key of termKeys(text)) {
      if (!index.has(key)) {
        errors.push(
          `${path}: termiä [[${key}]] ei löydy sanastosta (glossary.ts) eikä tunnusluvuista`,
        );
      }
    }
  }

  return { errors, warnings };
}

function checkSchema<T>(
  schema: z.ZodType<T>,
  items: readonly T[],
  label: string,
  errors: string[],
) {
  items.forEach((item, i) => {
    const result = schema.safeParse(item);
    if (result.success) return;
    const name = (item as { id?: unknown }).id ?? `#${i}`;
    for (const issue of result.error.issues) {
      errors.push(`${label} ${String(name)}.${issue.path.join(".")}: ${issue.message}`);
    }
  });
}

/** Osoitteen verkkotunnus on domain itse tai sen alitunnus (esim. www.domain). */
export function hostMatches(url: string, domain: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return host === domain || host.endsWith(`.${domain}`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) (seen.has(v) ? dup : seen).add(v);
  return [...dup];
}

function* walkStrings(value: unknown, path: string): Generator<{ path: string; text: string }> {
  if (typeof value === "string") {
    yield { path, text: value };
  } else if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* walkStrings(item, `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) yield* walkStrings(item, `${path}.${key}`);
  }
}
