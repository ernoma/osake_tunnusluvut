// Koko sisällön tarkistus: skeemat, id:iden yksilöllisyys, rinnakkaisviittaukset ja sanastotermit.
// Virheet (errors) kaatavat testit. Varoitukset (warnings) kertovat "tulossa"-viittauksista.

import type { z } from "zod";
import { hasMalformedMarkup, termKeys } from "./richText.ts";
import { categorySchema, glossaryTermSchema, metricSchema, plannedMetricSchema } from "./schema.ts";
import { buildTermIndex } from "./terms.ts";
import {
  CATEGORY_IDS,
  type Category,
  type GlossaryTerm,
  type Metric,
  type PlannedMetric,
} from "./types.ts";

export interface Content {
  metrics: readonly Metric[];
  planned: readonly PlannedMetric[];
  categories: readonly Category[];
  glossary: readonly GlossaryTerm[];
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateContent(content: Content): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { metrics, planned, categories, glossary } = content;

  checkSchema(metricSchema, metrics, "tunnusluku", errors);
  checkSchema(plannedMetricSchema, planned, "tulossa", errors);
  checkSchema(categorySchema, categories, "kategoria", errors);
  checkSchema(glossaryTermSchema, glossary, "sanasto", errors);

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

  // Sanastotermit teksteissä
  const { index, collisions } = buildTermIndex(metrics, planned, glossary);
  for (const c of collisions) errors.push(`termi ${c}`);
  const texts = [
    ...metrics.flatMap((m) => [...walkStrings(m, m.id)]),
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
