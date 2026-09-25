import { groupByCategory } from "../data/content.ts";
import type { Metric } from "../data/types.ts";
import MetricCard from "./MetricCard.tsx";
import styles from "./MetricGrid.module.css";

interface Props {
  metrics: readonly Metric[];
}

/** Kortit kategorioittain. Jokaisen ryhmän otsikkona on kysymys, johon ryhmän luvut vastaavat. */
export default function MetricGrid({ metrics }: Props) {
  return (
    <div className={styles.groups}>
      {groupByCategory(metrics).map(({ category, metrics: groupMetrics }) => {
        const headingId = `kategoria-${category.id}`;
        return (
          <section key={category.id} className={styles.group} aria-labelledby={headingId}>
            <header className={styles.groupHeader}>
              <p className={styles.shortName}>{category.shortName}</p>
              <h2 id={headingId} className={styles.question}>
                {category.question}
              </h2>
              <p className={styles.description}>{category.description}</p>
            </header>
            <div className={styles.cards}>
              {groupMetrics.map((m) => (
                <MetricCard key={m.id} metric={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
