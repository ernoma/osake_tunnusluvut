// Zod-skeemat sisällön rakenteen ja pituusrajojen tarkistamiseen.
// Pituudet lasketaan käyttäjälle näkyvästä tekstistä (ilman [[ ]]-merkintöjä).
// Ristiviittausten tarkistus (companions, sanastotermit) on tiedostossa validate.ts.

import { z } from "zod";
import { toPlainText } from "./richText.ts";
import {
  CATEGORY_IDS,
  DIRECTIONS,
  INPUT_UNITS,
  LEVELS,
  LINK_KINDS,
  LINK_LANGUAGES,
  SOURCE_TYPES,
  TONES,
  UNITS,
  type Category,
  type ExternalLink,
  type GlossaryTerm,
  type InputFigure,
  type Metric,
  type MetricRange,
  type PlannedMetric,
  type Source,
} from "./types.ts";

/** Pituusrajat pitävät kortit tiiviinä. Muuta vain harkiten. */
export const LIMITS = {
  question: 90,
  summary: 160,
  analogy: 220,
  example: 160,
  directionLabel: 40,
  rule: 120,
  maxRules: 3,
  commonMistake: 140,
  listItem: 220,
  companionReason: 120,
  glossaryDefinition: 220,
  linkTitle: 70,
  maxLinks: 3,
} as const;

const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id: vain pieniä kirjaimia a–z, numeroita ja väliviivoja");

const plain = z.string().trim().min(1, "ei saa olla tyhjä");

/** Teksti, jossa voi olla [[termi]]-merkintöjä ja jonka näkyvä pituus on rajattu. */
function rich(max: number) {
  return plain.refine((s) => toPlainText(s).length <= max, {
    message: `näkyvä teksti saa olla enintään ${max} merkkiä`,
  });
}

/** Päivämäärä muodossa VVVV-KK-PP, ja sen pitää olla oikea kalenteripäivä. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "päivämäärän muoto on VVVV-KK-PP")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, "päivämäärä ei ole kelvollinen");

export const externalLinkSchema: z.ZodType<ExternalLink> = z.object({
  title: plain.max(LIMITS.linkTitle),
  url: z
    .string()
    .url("osoite ei ole kelvollinen")
    .refine((s) => s.startsWith("https://"), "osoitteen pitää alkaa https://"),
  sourceId: idSchema,
  language: z.enum(LINK_LANGUAGES),
  kind: z.enum(LINK_KINDS),
  checkedAt: isoDate,
});

export const sourceSchema: z.ZodType<Source> = z.object({
  id: idSchema,
  name: plain,
  domain: z
    .string()
    .regex(
      /^[a-z0-9-]+(\.[a-z0-9-]+)+$/,
      "verkkotunnus ilman https:// ja polkua, esim. example.fi",
    ),
  type: z.enum(SOURCE_TYPES),
});

const bound = z.number().finite().optional();

export const rangeSchema: z.ZodType<MetricRange> = z
  .object({
    label: plain,
    meaning: rich(LIMITS.listItem),
    tone: z.enum(TONES),
    min: bound,
    max: bound,
  })
  .refine((r) => r.min !== undefined || r.max !== undefined, "välillä pitää olla min tai max")
  .refine(
    (r) => r.min === undefined || r.max === undefined || r.min <= r.max,
    "min ei saa olla suurempi kuin max",
  );

/**
 * Välit ovat nousevassa järjestyksessä eivätkä mene päällekkäin. Vain ensimmäiseltä riviltä saa
 * puuttua alaraja ja vain viimeiseltä yläraja.
 */
const rangesSchema = z
  .array(rangeSchema)
  .min(1)
  .superRefine((ranges, ctx) => {
    ranges.forEach((r, i) => {
      const issue = (message: string) =>
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i],
          message: `"${r.label}": ${message}`,
        });
      if (i > 0 && r.min === undefined) issue("vain ensimmäiseltä väliltä saa puuttua min");
      if (i < ranges.length - 1 && r.max === undefined)
        issue("vain viimeiseltä väliltä saa puuttua max");
      const prev = ranges[i - 1];
      if (prev?.max !== undefined && r.min !== undefined && r.min < prev.max)
        issue(`alkaa ennen kuin edellinen väli "${prev.label}" päättyy`);
    });
  });

export const metricSchema: z.ZodType<Metric> = z.object({
  id: idSchema,
  name: plain,
  abbreviation: plain.optional(),
  abbreviationExpanded: plain.optional(),
  aliases: z.array(plain),
  category: z.enum(CATEGORY_IDS),
  level: z.enum(LEVELS),
  question: rich(LIMITS.question).refine(
    (s) => s.endsWith("?"),
    "kysymyksen pitää päättyä ?-merkkiin",
  ),
  summary: rich(LIMITS.summary),
  analogy: rich(LIMITS.analogy),
  formula: z.object({
    words: plain,
    symbols: plain.optional(),
    note: rich(LIMITS.listItem).optional(),
  }),
  example: rich(LIMITS.example),
  unit: z.enum(UNITS),
  direction: z.enum(DIRECTIONS),
  directionLabel: plain.max(LIMITS.directionLabel),
  rules: z
    .array(rich(LIMITS.rule))
    .min(1, "vähintään yksi tulkintasääntö")
    .max(LIMITS.maxRules, `enintään ${LIMITS.maxRules} tulkintasääntöä`),
  commonMistake: rich(LIMITS.commonMistake),
  factors: z.array(rich(LIMITS.listItem)),
  pitfalls: z.array(rich(LIMITS.listItem)),
  ranges: rangesSchema.optional(),
  rangesNote: rich(LIMITS.listItem).optional(),
  companions: z
    .array(z.object({ id: idSchema, reason: rich(LIMITS.companionReason) }))
    .min(1, "vähintään yksi rinnakkaistunnusluku"),
  links: z
    .array(externalLinkSchema)
    .max(LIMITS.maxLinks, `enintään ${LIMITS.maxLinks} lisälukemista-linkkiä`),
});

export const plannedMetricSchema: z.ZodType<PlannedMetric> = z.object({
  id: idSchema,
  name: plain,
  abbreviation: plain.optional(),
  category: z.enum(CATEGORY_IDS),
});

export const categorySchema: z.ZodType<Category> = z.object({
  id: z.enum(CATEGORY_IDS),
  shortName: plain.max(16),
  question: plain.refine((s) => s.endsWith("?"), "kysymyksen pitää päättyä ?-merkkiin"),
  description: plain,
  order: z.number().int(),
});

export const inputFigureSchema: z.ZodType<InputFigure> = z.object({
  id: idSchema,
  name: plain,
  unit: z.enum(INPUT_UNITS),
  aliases: z.array(plain),
  term: plain.optional(),
  expense: z.literal(true).optional(),
});

export const glossaryTermSchema: z.ZodType<GlossaryTerm> = z.object({
  id: idSchema,
  term: plain,
  forms: z.array(plain),
  definition: rich(LIMITS.glossaryDefinition),
  relatedMetricId: idSchema.optional(),
});
