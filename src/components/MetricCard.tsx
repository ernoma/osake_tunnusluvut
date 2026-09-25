import { useState } from "react";
import { displayName } from "../data/content.ts";
import type { Metric } from "../data/types.ts";
import { usePopover } from "../hooks/usePopover.ts";
import CompanionChips, { CompanionReasons } from "./CompanionChips.tsx";
import DirectionBadge from "./DirectionBadge.tsx";
import ExternalLinks from "./ExternalLinks.tsx";
import FormulaBox from "./FormulaBox.tsx";
import RangeScale from "./RangeScale.tsx";
import RichText from "./RichText.tsx";
import styles from "./MetricCard.module.css";
import popoverStyles from "./Popover.module.css";

const LEVEL_LABELS = { perus: "Perus", syventava: "Syventävä" } as const;

interface Props {
  metric: Metric;
  /** Onko "Lisää"-osio auki aluksi. */
  defaultExpanded?: boolean;
}

/**
 * Yksi tunnusluku. Tiivis näkymä vastaa yhdellä vilkaisulla: mitä luku kertoo, kumpi suunta
 * on hyvä, miten se lasketaan, mitä pitää varoa ja mitä katsoa rinnalla. "Lisää" laajentaa
 * kortin paikallaan.
 */
export default function MetricCard({ metric, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const titleId = `${metric.id}-nimi`;
  const moreId = `${metric.id}-lisaa`;

  return (
    <article id={metric.id} className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h3 id={titleId} className={styles.name}>
          <MetricName metric={metric} />
        </h3>
        <span className={`${styles.level} ${styles[metric.level]}`}>
          {LEVEL_LABELS[metric.level]}
        </span>
      </header>

      <p className={styles.question}>
        <RichText text={metric.question} />
      </p>
      <DirectionBadge direction={metric.direction} label={metric.directionLabel} />

      <p className={styles.summary}>
        <RichText text={metric.summary} />
      </p>

      <FormulaBox formula={metric.formula} example={metric.example} />

      <ul className={styles.rules} aria-label="Näin tulkitset">
        {metric.rules.map((rule) => (
          <li key={rule}>
            <span className={styles.check} aria-hidden="true">
              ✓
            </span>
            <span>
              <RichText text={rule} />
            </span>
          </li>
        ))}
      </ul>

      <p className={styles.mistake}>
        <strong>
          <span aria-hidden="true">⚠ </span>Yleinen virhe:
        </strong>{" "}
        <RichText text={metric.commonMistake} />
      </p>

      {metric.companions.length > 0 && (
        <div className={styles.companions}>
          <h4 className={styles.smallHeading}>Katso rinnalla</h4>
          <CompanionChips companions={metric.companions} />
        </div>
      )}

      <button
        type="button"
        className={styles.moreButton}
        aria-expanded={expanded}
        aria-controls={expanded ? moreId : undefined}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Vähemmän" : "Lisää"}
        <span aria-hidden="true">{expanded ? " ▴" : " ▾"}</span>
      </button>

      {expanded && <MoreDetails id={moreId} metric={metric} />}
    </article>
  );
}

/** Nimi. Jos lyhenteellä on selitys, se aukeaa kohdistimella tai napautuksella. */
function MetricName({ metric }: { metric: Metric }) {
  const popover = usePopover();
  const name = displayName(metric);
  if (!metric.abbreviationExpanded) return name;

  return (
    <span className={popoverStyles.wrap} ref={popover.rootRef} {...popover.hoverProps}>
      <button
        type="button"
        className={styles.nameButton}
        aria-expanded={popover.open}
        aria-describedby={popover.open ? popover.id : undefined}
        onClick={popover.toggle}
      >
        {name}
      </button>
      {popover.open && (
        <span id={popover.id} ref={popover.popupRef} className={popoverStyles.popup}>
          {metric.abbreviationExpanded}
        </span>
      )}
    </span>
  );
}

function MoreDetails({ id, metric }: { id: string; metric: Metric }) {
  const { formula } = metric;
  return (
    <div id={id} className={styles.more}>
      <section className={styles.analogy}>
        <h4 className={styles.smallHeading}>Ajattele näin</h4>
        <p>
          <RichText text={metric.analogy} />
        </p>
      </section>

      <DetailList title="Mikä vaikuttaa tulkintaan" items={metric.factors} />
      <DetailList title="Muita sudenkuoppia" items={metric.pitfalls} />

      {metric.ranges && metric.ranges.length > 0 && (
        <section>
          <h4 className={styles.smallHeading}>Suuntaa antava asteikko</h4>
          <RangeScale ranges={metric.ranges} note={metric.rangesNote} />
        </section>
      )}

      {(formula.symbols || formula.note || metric.abbreviationExpanded) && (
        <section>
          <h4 className={styles.smallHeading}>Kaava tarkemmin</h4>
          {formula.symbols && (
            <p>
              <code className={styles.symbols}>{formula.symbols}</code>
            </p>
          )}
          {formula.note && (
            <p>
              <RichText text={formula.note} />
            </p>
          )}
          {metric.abbreviationExpanded && (
            <p>
              <strong>{metric.abbreviation}</strong>: {metric.abbreviationExpanded}
            </p>
          )}
        </section>
      )}

      {metric.companions.length > 0 && (
        <section>
          <h4 className={styles.smallHeading}>Miksi katsoa rinnalla</h4>
          <CompanionReasons companions={metric.companions} />
        </section>
      )}

      <ExternalLinks links={metric.links} />
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4 className={styles.smallHeading}>{title}</h4>
      <ul className={styles.detailList}>
        {items.map((item) => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
