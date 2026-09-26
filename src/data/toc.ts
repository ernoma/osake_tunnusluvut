// Sivun alun sisällysluettelo: kaikki tunnusluvut aakkosjärjestyksessä. Lyhenne saa oman
// rivinsä, jos se ei näy nimessä, jotta pankin sovelluksesta tuttu "EPS" löytyy E:n kohdalta.

import type { Metric } from "./types.ts";

export interface TocEntry {
  /** Kortin id, johon rivi vie. */
  id: string;
  /** Luettelossa näkyvä teksti: nimi tai lyhenne. */
  label: string;
  /** Ruudunlukijan nimi lyhenneriville ("EPS, osakekohtainen tulos"). */
  accessibleName?: string;
}

const collator = new Intl.Collator("fi");

/** Rivit suomen aakkosjärjestyksessä (Å, Ä ja Ö lopussa). */
export function tocEntries(metrics: readonly Metric[]): TocEntry[] {
  const entries = metrics.flatMap((m): TocEntry[] => {
    const own = { id: m.id, label: m.name };
    if (!m.abbreviation || m.name.includes(m.abbreviation)) return [own];
    const abbreviation = {
      id: m.id,
      label: m.abbreviation,
      accessibleName: `${m.abbreviation}, ${m.name.toLocaleLowerCase("fi")}`,
    };
    return [own, abbreviation];
  });
  return entries.sort((a, b) => collator.compare(a.label, b.label));
}
