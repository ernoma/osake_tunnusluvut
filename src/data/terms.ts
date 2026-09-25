// Termihakemisto: mihin [[termi]]-merkintä osoittaa.
// Tunnuslukujen id, nimi ja lyhenne toimivat automaattisesti termeinä.

import { normalizeKey } from "./richText.ts";
import type { GlossaryTerm, Metric, PlannedMetric } from "./types.ts";

export type TermTarget =
  | { kind: "glossary"; id: string }
  | { kind: "metric"; id: string }
  | { kind: "planned"; id: string };

export interface TermIndex {
  index: Map<string, TermTarget>;
  /** Avaimet, jotka osoittavat kahteen eri kohteeseen. Nämä ovat sisältövirheitä. */
  collisions: string[];
}

export function buildTermIndex(
  metrics: readonly Metric[],
  planned: readonly PlannedMetric[],
  glossary: readonly GlossaryTerm[],
): TermIndex {
  const index = new Map<string, TermTarget>();
  const collisions: string[] = [];

  const add = (key: string | undefined, target: TermTarget) => {
    if (!key) return;
    const k = normalizeKey(key);
    const existing = index.get(k);
    if (existing && (existing.kind !== target.kind || existing.id !== target.id)) {
      collisions.push(
        `"${k}" viittaa sekä kohteeseen ${describe(existing)} että ${describe(target)}`,
      );
      return;
    }
    index.set(k, target);
  };

  for (const m of metrics) {
    const target = { kind: "metric", id: m.id } as const;
    add(m.id, target);
    add(m.name, target);
    add(m.abbreviation, target);
  }
  for (const p of planned) {
    const target = { kind: "planned", id: p.id } as const;
    add(p.id, target);
    add(p.name, target);
    add(p.abbreviation, target);
  }
  for (const g of glossary) {
    const target = { kind: "glossary", id: g.id } as const;
    add(g.term, target);
    for (const form of g.forms) add(form, target);
  }

  return { index, collisions };
}

function describe(t: TermTarget): string {
  const kinds = { glossary: "sanasto", metric: "tunnusluku", planned: "tulossa" } as const;
  return `${kinds[t.kind]}:${t.id}`;
}
