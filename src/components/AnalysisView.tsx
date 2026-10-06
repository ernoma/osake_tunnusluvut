// Analyysi: tunnusluvut kategorioittain samoin kysymysotsikoin kuin päänäkymässä (suunnitelman
// kohta 11.5). Kategorian lopussa kerrotaan, mitkä tunnusluvut puuttuvat ja mitä niihin tarvitaan.
// Ennen kategorioita näkyvät yhdistelmähuomiot (kohta 12.1).

import { useId, useLayoutEffect, useRef, useState } from "react";
import { missingInputs } from "../data/analysis.ts";
import { groupByCategory, metrics } from "../data/content.ts";
import type { Unconverted } from "../data/currency.ts";
import type { CalculationResult } from "../data/formulas.ts";
import { evaluateInsights } from "../data/insights.ts";
import type { Metric } from "../data/types.ts";
import type { AnalysisFigure } from "../hooks/useAnalysisUrl.ts";
import AnalysisRow from "./AnalysisRow.tsx";
import { addButtonId, rowHeadingId } from "./analysisIds.ts";
import InsightList from "./InsightList.tsx";
import MissingList, { type MissingItem } from "./MissingList.tsx";
import styles from "./AnalysisView.module.css";

const groups = groupByCategory(metrics);

interface Props {
  result: CalculationResult;
  figures: readonly AnalysisFigure[];
  currency: string;
  /** Luvut, joita ei voitu muuntaa analyysin valuuttaan (kohta 11.11). */
  unconverted?: readonly Unconverted[];
  /** Hakupäivä vvvv-kk-pp tai tyhjä. */
  date: string;
  onAdd: (figures: AnalysisFigure[]) => void;
}

export default function AnalysisView({
  result,
  figures,
  currency,
  unconverted = [],
  date,
  onAdd,
}: Props) {
  const headingId = useId();
  const [announcement, setAnnouncement] = useState("");
  const years = new Map(figures.map((f) => [f.id, f.year]));
  const known = new Set(result.figures.keys());
  const shownCount = metrics.filter((m) => result.figures.has(m.id)).length;

  // Lisäyksen jälkeen kohdistus siirtyy lasketun luvun otsikkoon tai, jos luku puuttuu
  // yhä, sen Lisää-painikkeeseen.
  const focusMetric = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = focusMetric.current;
    if (!id) return;
    focusMetric.current = null;
    (
      document.getElementById(rowHeadingId(id)) ?? document.getElementById(addButtonId(id))
    )?.focus();
  });

  const add = (metric: Metric, added: AnalysisFigure[]) => {
    focusMetric.current = metric.id;
    onAdd(added);
    setAnnouncement(`Lisätty ${added.length === 1 ? "1 luku" : `${added.length} lukua`}.`);
  };

  return (
    <section className={styles.analysis} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Analyysi
      </h2>
      <p className={styles.intro}>
        {shownCount === 0
          ? "Tunnusluvut näkyvät tässä, kun lisäät lukuja. Alla näet, mitä kuhunkin tarvitaan."
          : `Tunnuslukuja: ${shownCount} / ${metrics.length}. Nyrkkisäännöt ovat suuntaa antavia, ja tavallinen taso vaihtelee toimialoittain. Vertaa aina saman alan yhtiöihin.`}
      </p>

      <InsightList insights={evaluateInsights(result.figures)} currency={currency} />

      {groups.map(({ category, metrics: inCategory }) => {
        const shown = inCategory.filter((m) => result.figures.has(m.id));
        const missing: MissingItem[] = inCategory
          .filter((m) => !result.figures.has(m.id))
          .map((metric) => {
            const blocked = result.blocked.get(metric.id);
            return blocked
              ? { metric, blocked }
              : { metric, inputs: missingInputs(metric.id, known) };
          });
        const categoryHeadingId = `analyysi-kategoria-${category.id}`;
        return (
          <section
            key={category.id}
            className={styles.category}
            aria-labelledby={categoryHeadingId}
          >
            <h3 id={categoryHeadingId} className={styles.question}>
              {category.question}
            </h3>
            {shown.map((metric) => (
              <AnalysisRow
                key={metric.id}
                metric={metric}
                figure={result.figures.get(metric.id)!}
                year={years.get(metric.id)}
                currency={currency}
                date={date}
              />
            ))}
            <MissingList
              items={missing}
              figures={result.figures}
              currency={currency}
              unconverted={unconverted}
              onAdd={add}
            />
          </section>
        );
      })}

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
