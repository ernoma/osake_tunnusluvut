import type { ReactNode } from "react";
import styles from "./StockPage.module.css";

export const START_HEADING_ID = "tutki-aloita";

interface Props {
  onEnterManually: () => void;
  /** Viimeisimmät analyysit kentän alla. */
  children?: ReactNode;
}

/**
 * Sivun ensimmäinen vaihe (suunnitelman kohta 11.1). Tekoälyhaku liitetystä tekstistä
 * lisätään tähän vaiheessa 11d. Siihen asti luvut syötetään itse.
 */
export default function PasteStep({ onEnterManually, children }: Props) {
  return (
    <>
      <section className={styles.step} aria-labelledby={START_HEADING_ID}>
        <h2 id={START_HEADING_ID} tabIndex={-1} className={styles.stepHeading}>
          Aloita
        </h2>
        <p>
          Syötä yhtiön luvut itse, esimerkiksi pankin sovelluksesta tai tilinpäätöksestä. Sovellus
          laskee puuttuvat tunnusluvut, jos lähtötiedot riittävät.
        </p>
        <button type="button" className={styles.primaryButton} onClick={onEnterManually}>
          Syötä luvut itse
        </button>
      </section>
      {children}
    </>
  );
}
