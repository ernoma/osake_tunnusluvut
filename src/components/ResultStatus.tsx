import styles from "./ResultStatus.module.css";

interface Props {
  query: string;
  visibleCount: number;
  /** Hakuun osuvat luvut, jotka kategoria- tai tasosuodatin piilottaa. */
  hiddenCount: number;
  onShowHidden: () => void;
  onClearSearch: () => void;
}

/** Kertoo, jos haku ei löytänyt mitään tai jos osumia on piilossa suodattimen takia. */
export default function ResultStatus({
  query,
  visibleCount,
  hiddenCount,
  onShowHidden,
  onClearSearch,
}: Props) {
  if (hiddenCount === 0 && visibleCount > 0) return null;

  return (
    <div className={styles.status}>
      {visibleCount === 0 && hiddenCount === 0 && (
        <>
          <p>
            <strong>Haulla ”{query}” ei löytynyt tunnuslukuja.</strong> Kokeile toista sanaa,
            esimerkiksi ”velka”, ”osinko” tai ”halpa”.
          </p>
          <button type="button" className={styles.button} onClick={onClearSearch}>
            Tyhjennä haku
          </button>
        </>
      )}
      {hiddenCount > 0 && (
        <>
          <p>
            {hiddenCount === 1
              ? "1 osuma on piilossa, koska suodatin on päällä."
              : `${hiddenCount} osumaa on piilossa, koska suodatin on päällä.`}
          </p>
          <button type="button" className={styles.button} onClick={onShowHidden}>
            Näytä kaikki osumat
          </button>
        </>
      )}
    </div>
  );
}
