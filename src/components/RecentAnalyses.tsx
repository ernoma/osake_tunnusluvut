import { useId, type MouseEvent } from "react";
import { decodeAnalysis, formatDate } from "../hooks/useAnalysisUrl.ts";
import type { RecentAnalysis } from "../hooks/useRecentAnalyses.ts";
import styles from "./RecentAnalyses.module.css";

interface Props {
  recent: RecentAnalysis[];
  onOpen: (entry: RecentAnalysis) => void;
  onRemove: (key: string) => void;
}

export const UNNAMED_ANALYSIS = "Nimetön analyysi";

/** Viisi viimeisintä analyysiä (suunnitelman kohta 11.7). Jokaisen rivin voi poistaa. */
export default function RecentAnalyses({ recent, onOpen, onRemove }: Props) {
  const headingId = useId();
  if (recent.length === 0) return null;

  const open = (e: MouseEvent<HTMLAnchorElement>, entry: RecentAnalysis) => {
    // Ctrl- ja keskiklikkaus avaavat analyysin uuteen välilehteen tavalliseen tapaan.
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(entry);
  };

  return (
    <section className={styles.recent} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Viimeisimmät analyysit
      </h2>
      <ul className={styles.list}>
        {recent.map((entry) => {
          const name = entry.name || UNNAMED_ANALYSIS;
          const count = decodeAnalysis(entry.search).figures.length;
          return (
            <li key={entry.key} className={styles.item}>
              <a
                href={window.location.pathname + entry.search}
                className={styles.link}
                onClick={(e) => open(e, entry)}
              >
                {name}
              </a>
              <span className={styles.meta}>
                {entry.date && `${formatDate(entry.date)} · `}
                {count === 1 ? "1 luku" : `${count} lukua`}
              </span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Poista ${name} listalta`}
                onClick={() => onRemove(entry.key)}
              >
                Poista
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
