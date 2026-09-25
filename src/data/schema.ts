// Zod-skeemat sisällön rakenteen ja pituusrajojen tarkistamiseen.
// Pituudet lasketaan käyttäjälle näkyvästä tekstistä (ilman [[ ]]-merkintöjä).
// Ristiviittausten tarkistus (companions, sanastotermit) on tiedostossa validate.ts.

import { z } from "zod";
import { toPlainText } from "./richText.ts";
import {
  CATEGORY_IDS,
  DIRECTIONS,
  LEVELS,
  TONES,
  UNITS,
  type Category,
  type GlossaryTerm,
  type Metric,
  type PlannedMetric,
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
  ranges: z
    .array(z.object({ label: plain, meaning: rich(LIMITS.listItem), tone: z.enum(TONES) }))
    .min(1)
    .optional(),
  rangesNote: rich(LIMITS.listItem).optional(),
  companions: z
    .array(z.object({ id: idSchema, reason: rich(LIMITS.companionReason) }))
    .min(1, "vähintään yksi rinnakkaistunnusluku"),
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

export const glossaryTermSchema: z.ZodType<GlossaryTerm> = z.object({
  id: idSchema,
  term: plain,
  forms: z.array(plain),
  definition: rich(LIMITS.glossaryDefinition),
  relatedMetricId: idSchema.optional(),
});
