import { categories } from "../data/content.ts";
import type { CategoryId } from "../data/types.ts";
import styles from "./FilterBar.module.css";

interface Props {
  category: CategoryId | null;
  onCategoryChange: (category: CategoryId | null) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (show: boolean) => void;
  /** Montako tunnuslukua näkyy nyt. */
  visibleCount: number;
}

const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

/**
 * Kategoriasuodatin, joka pysyy näkyvissä sivua vieritettäessä (mobiilissa vaakasuunnassa
 * vieritettävä nauha), sekä "Näytä myös syventävät" -valinta.
 */
export default function FilterBar({
  category,
  onCategoryChange,
  showAdvanced,
  onShowAdvancedChange,
  visibleCount,
}: Props) {
  const options: { id: CategoryId | null; label: string }[] = [
    { id: null, label: "Kaikki" },
    ...sortedCategories.map((c) => ({ id: c.id, label: c.shortName })),
  ];

  return (
    <>
      <div className={styles.bar}>
        <div role="group" aria-label="Näytä kategoria" className={styles.chips}>
          {options.map((o) => (
            <button
              key={o.id ?? "kaikki"}
              type="button"
              className={styles.chip}
              aria-pressed={category === o.id}
              onClick={() => onCategoryChange(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.options}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={(e) => onShowAdvancedChange(e.target.checked)}
          />
          Näytä myös syventävät
        </label>
        <p className={styles.count} role="status">
          {visibleCount === 1 ? "1 tunnusluku" : `${visibleCount} tunnuslukua`}
        </p>
      </div>
    </>
  );
}
