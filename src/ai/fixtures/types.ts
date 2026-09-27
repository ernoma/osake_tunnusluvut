// Tekoälyhaun testiaineisto (suunnitelman kohta 11.9). Tekstit on kirjoitettu itse eri
// sivustojen rakennetta mukaillen. Sivustojen tekstiä ei ole kopioitu sellaisenaan, ja yhtiöt
// ja luvut ovat keksittyjä.

import type { Period } from "../../data/formulas.ts";
import type { ExtractionResult } from "../schema.ts";

export interface ExtractionFixture {
  /** Sivusto, jonka rakennetta teksti mukailee. */
  site: string;
  /** Liitetty teksti. */
  text: string;
  company: {
    name: string;
    currency: string;
    /** Kurssin valuutta, jos se eroaa tilinpäätöksen valuutasta (kohta 11.11). */
    priceCurrency: string | null;
  };
  /** Luvut, jotka tekoälyn pitää poimia tekstistä (npm run eval-extract). */
  expected: {
    id: string;
    value: number;
    period?: Period;
    /** Rahamäärän valuutta, jos se eroaa tilinpäätöksen valuutasta (kohta 11.11). */
    currency?: string;
  }[];
  /**
   * Valmis mallin vastaus yksikkötesteihin. Siinä on odotetut luvut ja lisäksi tahallisia
   * virheitä (merkitty kommentilla), joiden käsittely testataan (verify.test.ts).
   */
  response: ExtractionResult;
}

/** Taulukon rivi sarkaimin erotettuna, kuten selaimesta kopioitu taulukko. */
export const row = (...cells: string[]) => cells.join("\t");
