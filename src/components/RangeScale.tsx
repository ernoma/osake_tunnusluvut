import type { MetricRange, Tone } from "../data/types.ts";
import RichText from "./RichText.tsx";
import styles from "./RangeScale.module.css";

const TONE_ICONS: Record<Tone, string> = { good: "✓", neutral: "•", warning: "⚠" };
const TONE_TEXT: Record<Tone, string> = {
  good: "myönteinen",
  neutral: "neutraali",
  warning: "varoitusmerkki",
};

interface Props {
  ranges: MetricRange[];
  note?: string;
}

/** Suuntaa antava asteikko värikoodattuna. Aina merkitty nyrkkisäännöksi. */
export default function RangeScale({ ranges, note }: Props) {
  return (
    <div>
      <ul className={styles.scale}>
        {ranges.map((r) => (
          <li key={r.label} className={`${styles.step} ${styles[r.tone]}`}>
            <span className={styles.icon} aria-hidden="true">
              {TONE_ICONS[r.tone]}
            </span>
            <span className={styles.label}>{r.label}</span>
            <span className={styles.meaning}>
              <RichText text={r.meaning} />
              <span className="visually-hidden"> ({TONE_TEXT[r.tone]})</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        {/* Merkintä näkyy aina, mutta sitä ei toisteta, jos huomautus jo alkaa sillä. */}
        {!note?.startsWith("Nyrkkisääntö") && <strong>Nyrkkisääntö. </strong>}
        {note ? <RichText text={note} /> : "Vaihtelee toimialoittain."}
      </p>
    </div>
  );
}
