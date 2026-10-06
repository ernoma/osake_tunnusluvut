// Yhdistelmähuomiot analyysissä (suunnitelman kohta 12.1): mistä luvuista huomio syntyi ja
// niiden arvot, selitys sanastoviittauksineen ja linkit kyseisiin kortteihin.

import { useId } from "react";
import { displayName, figuresById, metricsById } from "../data/content.ts";
import type { FiredInsight } from "../data/insights.ts";
import { formatNumber } from "../data/numberFormat.ts";
import RichText from "./RichText.tsx";
import styles from "./InsightList.module.css";

interface Props {
  insights: readonly FiredInsight[];
  /** Analyysin valuutta. */
  currency: string;
}

export default function InsightList({ insights, currency }: Props) {
  const headingId = useId();
  if (insights.length === 0) return null;
  return (
    <section className={styles.insights} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        Mitä luvut kertovat yhdessä
      </h3>
      <p className={styles.intro}>
        Yksi luku ei koskaan riitä. Nämä huomiot syntyvät usean luvun yhdistelmästä. Rajat ovat
        nyrkkisääntöjä, joten lue huomio kysymyksenä, jota kannattaa selvittää.
      </p>
      <ul className={styles.list}>
        {insights.map((fired) => (
          <InsightItem key={fired.insight.id} fired={fired} currency={currency} />
        ))}
      </ul>
    </section>
  );
}

function InsightItem({ fired, currency }: { fired: FiredInsight; currency: string }) {
  const { insight } = fired;
  const values = fired.values.map(({ id, value }) => {
    const info = figuresById.get(id);
    return info ? `${displayName(info)} ${formatNumber(value, info.unit, currency)}` : id;
  });
  if (insight.derived && fired.derived !== undefined) {
    values.push(
      `${insight.derived.label} ${formatNumber(fired.derived, insight.derived.unit, currency)}`,
    );
  }
  const cards = insight.figures.flatMap((id) => {
    const metric = metricsById.get(id);
    return metric ? [metric] : [];
  });

  return (
    <li className={styles.item}>
      <h4 className={styles.title}>{insight.title}</h4>
      <p className={styles.values}>
        <span className="visually-hidden">Luvut: </span>
        {values.join(" · ")}
      </p>
      <p className={styles.text}>
        <RichText text={insight.text} />
      </p>
      {fired.mixedPeriods && (
        <p className={styles.warning}>
          <span aria-hidden="true">⚠ </span>Luvut ovat eri kausilta, esimerkiksi toteutunut ja
          ennuste. Huomio on vain suuntaa antava.
        </p>
      )}
      {cards.length > 0 && (
        <p className={styles.cards}>
          <span className={styles.smallLabel}>Kortit: </span>
          {cards.map((metric, i) => (
            <span key={metric.id}>
              {i > 0 && " · "}
              <a href={`${window.location.pathname}#${metric.id}`}>{displayName(metric)}</a>
            </span>
          ))}
        </p>
      )}
    </li>
  );
}
