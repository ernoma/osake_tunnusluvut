import {
  displayName,
  glossaryById,
  metricsById,
  plannedById,
  resolveTerm,
} from "../data/content.ts";
import { toPlainText } from "../data/richText.ts";
import { usePopover } from "../hooks/usePopover.ts";
import styles from "./GlossaryTerm.module.css";
import popoverStyles from "./Popover.module.css";

interface Props {
  /** Termin perusmuoto, jolla se löytyy termihakemistosta. */
  termKey: string;
  /** Tekstissä näkyvä (mahdollisesti taivutettu) muoto. */
  label: string;
}

/** Katkoviivalla alleviivattu sana, josta aukeaa lyhyt selitys. */
export default function GlossaryTerm({ termKey, label }: Props) {
  const popover = usePopover();
  const content = termContent(termKey);
  // Tuntematon termi näytetään tavallisena tekstinä. Sisältötestit estävät tämän tilanteen.
  if (!content) return label;

  return (
    <span className={popoverStyles.wrap} ref={popover.rootRef} {...popover.hoverProps}>
      <button
        type="button"
        className={styles.term}
        aria-expanded={popover.open}
        aria-describedby={popover.open ? popover.id : undefined}
        onClick={popover.toggle}
      >
        {label}
      </button>
      {popover.open && (
        <span id={popover.id} ref={popover.popupRef} className={popoverStyles.popup}>
          <strong className={styles.title}>{content.title}</strong>
          {content.lines.map((line) => (
            <span key={line} className={styles.line}>
              {line}
            </span>
          ))}
          {content.metricId && (
            <a className={styles.cardLink} href={`#${content.metricId}`} onClick={popover.close}>
              {content.linkLabel}
            </a>
          )}
        </span>
      )}
    </span>
  );
}

interface TermContent {
  title: string;
  lines: string[];
  metricId?: string;
  linkLabel?: string;
}

function termContent(key: string): TermContent | undefined {
  const target = resolveTerm(key);
  if (!target) return undefined;

  if (target.kind === "metric") {
    const m = metricsById.get(target.id);
    if (!m) return undefined;
    return {
      title: displayName(m),
      lines: [m.abbreviationExpanded, toPlainText(m.question)].filter((l): l is string => !!l),
      metricId: m.id,
      linkLabel: "Siirry korttiin →",
    };
  }

  if (target.kind === "planned") {
    const p = plannedById.get(target.id);
    if (!p) return undefined;
    return { title: p.name, lines: ["Tämä tunnusluku on tulossa oppaaseen myöhemmin."] };
  }

  const g = glossaryById.get(target.id);
  if (!g) return undefined;
  const related = g.relatedMetricId ? metricsById.get(g.relatedMetricId) : undefined;
  return {
    title: g.term.charAt(0).toLocaleUpperCase("fi") + g.term.slice(1),
    lines: [toPlainText(g.definition)],
    metricId: related?.id,
    linkLabel: related && `Liittyvä tunnusluku: ${related.abbreviation ?? related.name} →`,
  };
}
