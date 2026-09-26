import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { metrics } from "../data/content.ts";
import { tocEntries } from "../data/toc.ts";
import { useMediaQuery } from "../hooks/useMediaQuery.ts";
import { useStoredBoolean } from "../hooks/useStoredBoolean.ts";
import styles from "./TableOfContents.module.css";

export const TOC_TITLE_ID = "sisallys-otsikko";
export const TOC_STORAGE_KEY = "tunnusluvut.sisallys-auki";
/** Kiinnitetyn luettelon korkeus, jonka suodatinpalkki ja korttien vieritys huomioivat. */
export const TOC_HEIGHT_VAR = "--toc-height";

/** Leveys, jolla luettelo on oletuksena auki. Sama kuin TableOfContents.module.css:n raja. */
const WIDE_QUERY = "(min-width: 37.5rem)";

const entries = tocEntries(metrics);

/**
 * Kaikki tunnusluvut A–Ö palstoissa, kiinnitettynä sivun yläreunaan. Luettelon voi pienentää
 * yhdeksi riviksi, ja valinta muistetaan. Linkit ovat tavallisia #id-linkkejä, joten
 * useCardNavigation hoitaa siirtymisen.
 */
export default function TableOfContents() {
  const wide = useMediaQuery(WIDE_QUERY, true);
  const [chosenOpen, setChosenOpen] = useStoredBoolean(TOC_STORAGE_KEY, wide);
  // Mobiilissa linkki pienentää luettelon hetkeksi, jotta kortti näkyy. Ei tallenneta valinnaksi.
  const [autoClosed, setAutoClosed] = useState(false);
  const open = chosenOpen && !autoClosed;
  const navRef = useRef<HTMLElement>(null);

  // Luettelon korkeus CSS-muuttujaan: suodatinpalkki kiinnittyy sen alle. ResizeObserver
  // huomaa palstamäärän muutokset. Avaus ja pienennys päivitetään heti, koska observer
  // odottaa seuraavaa piirtoa.
  const updateHeight = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty(TOC_HEIGHT_VAR, `${height}px`);
  }, []);

  useLayoutEffect(updateHeight, [open, updateHeight]);

  useEffect(() => {
    const nav = navRef.current;
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateHeight);
    if (nav) observer?.observe(nav);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty(TOC_HEIGHT_VAR);
    };
  }, [updateHeight]);

  return (
    <nav ref={navRef} className={styles.toc} aria-labelledby={TOC_TITLE_ID}>
      <details
        open={open}
        onToggle={(e) => {
          // Tapahtuma tulee myös, kun React itse asettaa open-attribuutin. Vain käyttäjän
          // oma avaus tai pienennys muuttaa valintaa.
          const nowOpen = e.currentTarget.open;
          if (nowOpen === open) return;
          setAutoClosed(false);
          setChosenOpen(nowOpen);
        }}
      >
        <summary className={styles.summary}>
          <span id={TOC_TITLE_ID}>Tunnusluvut A–Ö</span> ({metrics.length})
          <span className={styles.hint} aria-hidden="true">
            {open ? "Pienennä" : "Näytä"}
          </span>
        </summary>
        <ul className={styles.list}>
          {entries.map((e) => (
            <li key={`${e.id}-${e.label}`}>
              <a
                href={`#${e.id}`}
                className={styles.link}
                aria-label={e.accessibleName}
                onClick={() => {
                  if (!wide) setAutoClosed(true);
                }}
              >
                {e.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
