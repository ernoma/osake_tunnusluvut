import type { Metric } from "../data/types.ts";
import RichText from "./RichText.tsx";
import styles from "./FormulaBox.module.css";

interface Props {
  formula: Metric["formula"];
  example: string;
}

/** Kaava sanoin ja laskuesimerkki tasaluvuilla samassa laatikossa. */
export default function FormulaBox({ formula, example }: Props) {
  return (
    <div className={styles.box}>
      <p className={styles.row}>
        <span className={styles.label}>Kaava</span>
        <span className={styles.formula}>
          <RichText text={formula.words} />
        </span>
      </p>
      <p className={styles.row}>
        <span className={styles.label}>Esimerkki</span>
        <span>
          <RichText text={example} />
        </span>
      </p>
    </div>
  );
}
