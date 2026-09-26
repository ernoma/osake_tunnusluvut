import { Fragment } from "react";
import type { RangeMatch } from "../data/analysis.ts";
import type { MetricRange, Tone } from "../data/types.ts";
import RichText from "./RichText.tsx";
import styles from "./RangeScale.module.css";

const TONE_ICONS: Record<Tone, string> = { good: "✓", neutral: "•", warning: "⚠" };
const TONE_TEXT: Record<Tone, string> = {
  good: "myönteinen",
  neutral: "neutraali",
  warning: "varoitusmerkki",
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Arvo, jonka osuva väli korostetaan (Tutki osaketta -sivu). */
export interface ScaleValue {
  match: RangeMatch;
  /** Muotoiltu arvo, esim. "12,4". */
  text: string;
}

interface Props {
  ranges: MetricRange[];
  note?: string;
  value?: ScaleValue;
}

/**
 * Suuntaa antava asteikko värikoodattuna. Aina merkitty nyrkkisäännöksi. Jos arvo annetaan,
 * osuva väli korostetaan reunuksella, ▲-merkillä ja tekstillä, jotta korostus ei ole pelkän
 * värin varassa. Välien väliin osuva arvo näytetään omana rivinään ilman sävyä.
 */
export default function RangeScale({ ranges, note, value }: Props) {
  const match = value?.match;
  const marker = (text: string) => (
    <li className={styles.marker}>
      <span className={styles.icon} aria-hidden="true">
        ▲
      </span>
      <span className={styles.markerText}>{text}</span>
    </li>
  );

  return (
    <div>
      <ul className={styles.scale}>
        {match?.kind === "below" &&
          marker(`Arvo ${value!.text} on pienempi kuin alin väli (${ranges[0]!.label}).`)}
        {ranges.map((r, i) => {
          const hit = match?.kind === "in" && match.index === i;
          const next = ranges[i + 1];
          return (
            <Fragment key={r.label}>
              <li
                className={`${styles.step} ${styles[r.tone]} ${hit ? styles.hit : ""}`}
                aria-current={hit ? "true" : undefined}
              >
                <span className={styles.icon} aria-hidden="true">
                  {hit ? "▲" : TONE_ICONS[r.tone]}
                </span>
                <span className={styles.label}>{r.label}</span>
                <span className={styles.meaning}>
                  <RichText text={r.meaning} />
                  <span className="visually-hidden"> ({TONE_TEXT[r.tone]})</span>
                </span>
                {hit && (
                  <strong className={styles.hitText}>Arvo {value!.text} osuu tähän väliin.</strong>
                )}
              </li>
              {match?.kind === "between" &&
                match.lower === i &&
                next &&
                marker(
                  `Arvo ${value!.text} on välien ${lowerFirst(r.label)} ja ${lowerFirst(next.label)} välissä.`,
                )}
            </Fragment>
          );
        })}
        {match?.kind === "above" &&
          marker(`Arvo ${value!.text} on suurempi kuin ylin väli (${ranges.at(-1)!.label}).`)}
      </ul>
      <p className={styles.note}>
        {/* Merkintä näkyy aina, mutta sitä ei toisteta, jos huomautus jo alkaa sillä. */}
        {!note?.startsWith("Nyrkkisääntö") && <strong>Nyrkkisääntö. </strong>}
        {note ? <RichText text={note} /> : "Vaihtelee toimialoittain."}
      </p>
    </div>
  );
}
