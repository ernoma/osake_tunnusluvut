import { useEffect, useRef } from "react";
import styles from "./Header.module.css";

export const INTRO_LINK_ID = "johdanto-avaa";

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  /** Näytetäänkö "Mitä tunnusluvut ovat?" -linkki (johdanto on suljettu). */
  showIntroLink: boolean;
  onOpenIntro: () => void;
}

/** Tekstikenttä tai muu kohta, jossa "/" on tavallinen merkki eikä pikanäppäin. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Otsikko, haku ja linkki johdantoon. Pikanäppäin "/" vie hakuun. */
export default function Header({ query, onQueryChange, showIntroLink, onOpenIntro }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Osakkeen tunnusluvut – selkokielellä</h1>
      <p className={styles.lead}>
        Mitä luku kertoo, onko suuri vai pieni arvo hyvä ja mitä kannattaa katsoa rinnalla.
      </p>

      <div className={styles.tools}>
        <div role="search" className={styles.search}>
          <label htmlFor="haku" className="visually-hidden">
            Hae tunnuslukua
          </label>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            ref={searchRef}
            id="haku"
            type="search"
            className={styles.input}
            placeholder="Hae, esim. P/E, velka tai osinko"
            aria-keyshortcuts="/"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                onQueryChange("");
              }
            }}
          />
          <kbd className={styles.shortcut} aria-hidden="true">
            /
          </kbd>
        </div>

        {showIntroLink && (
          <button
            type="button"
            id={INTRO_LINK_ID}
            className={styles.introLink}
            onClick={onOpenIntro}
          >
            Mitä tunnusluvut ovat?
          </button>
        )}
      </div>
    </header>
  );
}
