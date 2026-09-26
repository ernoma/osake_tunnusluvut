import { metrics } from "../data/content.ts";
import { tocEntries } from "../data/toc.ts";
import { useMediaQuery } from "../hooks/useMediaQuery.ts";
import styles from "./TableOfContents.module.css";

export const TOC_TITLE_ID = "sisallys-otsikko";

/** Leveys, jolla luettelo on aina auki. Sama kuin TableOfContents.module.css:n raja. */
const WIDE_QUERY = "(min-width: 37.5rem)";

const entries = tocEntries(metrics);

/**
 * Kaikki tunnusluvut A–Ö palstoissa sivun alussa. Tietokoneella luettelo on aina auki,
 * mobiilissa se on suljettu rivi, jotta kortit eivät siirry ruudun alapuolelle.
 * Linkit ovat tavallisia #id-linkkejä, joten useCardNavigation hoitaa siirtymisen.
 */
export default function TableOfContents() {
  const wide = useMediaQuery(WIDE_QUERY, true);

  const list = (
    <ul className={styles.list}>
      {entries.map((e) => (
        <li key={`${e.id}-${e.label}`}>
          <a href={`#${e.id}`} className={styles.link} aria-label={e.accessibleName}>
            {e.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className={styles.toc} aria-labelledby={TOC_TITLE_ID}>
      {wide ? (
        <>
          <p id={TOC_TITLE_ID} className={styles.title}>
            Tunnusluvut A–Ö
          </p>
          {list}
        </>
      ) : (
        <details>
          <summary className={styles.summary}>
            <span id={TOC_TITLE_ID}>Kaikki tunnusluvut A–Ö</span> ({metrics.length})
          </summary>
          {list}
        </details>
      )}
    </nav>
  );
}
