// Tekoälyhaun vastauksen rakenne (suunnitelman kohta 11.2). Sama skeema rajaa mallin vastauksen
// (rakenteinen vastaus) ja tarkistaa sen sovelluksessa. Clauden kirjaston Zod-apu käyttää
// Zod 4:n rajapintaa, joka on Zod 3.25:ssä polussa "zod/v4".

import * as z from "zod/v4";
import { PERIODS } from "../data/formulas.ts";

export const extractedValueSchema = z.object({
  /** Tunnusluvun (metrics.ts) tai lähtötiedon (inputs.ts) id. */
  id: z.string(),
  /** Perusyksikössä: euroina (ei miljoonina), prosentteina tai kertoimena. */
  value: z.number(),
  period: z.enum(PERIODS),
  /** "2025" tai "Q2/2026, 12 kk". */
  year: z.string().nullable(),
  /** Tekstin kohta, josta luku löytyi, sellaisenaan. */
  quote: z.string(),
  /**
   * Rahamäärän valuutta, jos se eroaa tilinpäätöslukujen valuutasta (company.currency), esim.
   * SEK-määräinen kurssi, kun tilinpäätös on euroissa (kohta 11.11). Muuten null.
   */
  currency: z.string().nullable(),
});

export const extractionSchema = z.object({
  company: z.object({
    name: z.string().nullable(),
    ticker: z.string().nullable(),
    /** Tilinpäätöslukujen valuutta. */
    currency: z.string().nullable(),
    /**
     * Kurssin ja markkina-arvon valuutta, jos se eroaa tilinpäätöslukujen valuutasta, esim. SEK,
     * kun tilinpäätös on euroissa (kohta 11.11). Muuten null.
     */
    priceCurrency: z.string().nullable(),
  }),
  values: z.array(extractedValueSchema),
  /** Esim. "Tekstissä on kaksi eri P/E-lukua: toteutunut ja ennuste". */
  notes: z.array(z.string()),
});

export type ExtractedValue = z.infer<typeof extractedValueSchema>;
export type ExtractionResult = z.infer<typeof extractionSchema>;
