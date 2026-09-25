import { useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { displayName, metricsById, plannedById, shortMetricName } from "../data/content.ts";
import { toPlainText } from "../data/richText.ts";
import type { Companion } from "../data/types.ts";
import { usePopover } from "../hooks/usePopover.ts";
import RichText from "./RichText.tsx";
import styles from "./CompanionChips.module.css";
import popoverStyles from "./Popover.module.css";

/** Näin kauan merkintää pidetään painettuna, jotta perustelu tulee näkyviin. */
const LONG_PRESS_MS = 500;

interface Props {
  companions: Companion[];
}

/** "Katso rinnalla" -merkinnät. Perustelu näkyy kohdistimella, kohdistuksella tai pitkällä painalluksella. */
export default function CompanionChips({ companions }: Props) {
  return (
    <ul className={styles.chips}>
      {companions.map((c) => (
        <CompanionChip key={c.id} companion={c} />
      ))}
    </ul>
  );
}

function CompanionChip({ companion }: { companion: Companion }) {
  const popover = usePopover<HTMLLIElement>();
  const longPress = useRef({ timer: 0, fired: false });
  const metric = metricsById.get(companion.id);
  const plannedMetric = metric ? undefined : plannedById.get(companion.id);
  if (!metric && !plannedMetric) return null;

  const reasonId = `${popover.id}-syy`;
  const cancelLongPress = () => window.clearTimeout(longPress.current.timer);
  const pressProps = {
    onFocus: popover.show,
    onBlur: popover.close,
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") return;
      longPress.current.fired = false;
      cancelLongPress();
      longPress.current.timer = window.setTimeout(() => {
        longPress.current.fired = true;
        popover.show();
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancelLongPress,
    onPointerCancel: cancelLongPress,
    // Pitkä painallus avaa mobiilissa muuten linkin valikon.
    onContextMenu: (e: ReactMouseEvent) => {
      if (longPress.current.fired) e.preventDefault();
    },
    "aria-describedby": reasonId,
  };

  return (
    <li className={popoverStyles.wrap} ref={popover.rootRef} {...popover.hoverProps}>
      {metric ? (
        <a
          href={`#${metric.id}`}
          className={styles.chip}
          {...pressProps}
          onClick={(e) => {
            // Pitkän painalluksen jälkeen ei siirrytä korttiin, vaan näytetään perustelu.
            if (longPress.current.fired) e.preventDefault();
            longPress.current.fired = false;
          }}
        >
          {shortMetricName(metric)}
        </a>
      ) : (
        <span className={`${styles.chip} ${styles.planned}`} tabIndex={0} {...pressProps}>
          {plannedMetric && shortMetricName(plannedMetric)}
          <span className={styles.plannedTag}>tulossa</span>
        </span>
      )}
      <span
        id={reasonId}
        ref={popover.popupRef}
        className={popoverStyles.popup}
        hidden={!popover.open}
      >
        {toPlainText(companion.reason)}
      </span>
    </li>
  );
}

/** Rinnakkaistunnuslukujen perustelut kokonaisuudessaan ("Lisää"-osio). */
export function CompanionReasons({ companions }: Props) {
  return (
    <ul className={styles.reasons}>
      {companions.map((c) => {
        const metric = metricsById.get(c.id);
        const target = metric ?? plannedById.get(c.id);
        if (!target) return null;
        return (
          <li key={c.id}>
            {metric ? (
              <a href={`#${metric.id}`} className={styles.reasonName}>
                {displayName(metric)}
              </a>
            ) : (
              <span className={styles.reasonName}>{displayName(target)} (tulossa)</span>
            )}
            : <RichText text={c.reason} />
          </li>
        );
      })}
    </ul>
  );
}
