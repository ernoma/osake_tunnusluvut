import type { Direction } from "../data/types.ts";
import styles from "./DirectionBadge.module.css";

const ICONS: Record<Direction, string> = {
  lower: "↓",
  higher: "↑",
  range: "↔",
  neutral: "●",
};

interface Props {
  direction: Direction;
  /** "Pienempi = yleensä halvempi" */
  label: string;
}

/** Suuntamerkki: väri, ikoni ja teksti, jotta tieto ei ole pelkän värin varassa. */
export default function DirectionBadge({ direction, label }: Props) {
  return (
    <p className={`${styles.badge} ${styles[direction]}`}>
      <span className={styles.icon} aria-hidden="true">
        {ICONS[direction]}
      </span>
      {label}
    </p>
  );
}
