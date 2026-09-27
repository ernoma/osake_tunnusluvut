import { useEffect, useRef, type MouseEvent } from "react";
import { PAGE_TITLES, PAGES, pageHref, type Page } from "../hooks/usePage.ts";
import { useTheme } from "../hooks/useTheme.ts";
import styles from "./Header.module.css";

export const INTRO_LINK_ID = "johdanto-avaa";
export const PAGE_HEADING_ID = "sivun-otsikko";

/** Tunnusluvut-sivun haku ja johdantolinkki. */
export interface HeaderSearch {
  query: string;
  onQueryChange: (query: string) => void;
  /** Näytetäänkö "Mitä tunnusluvut ovat?" -linkki (johdanto on suljettu). */
  showIntroLink: boolean;
  onOpenIntro: () => void;
}

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
  /** Vain Tunnusluvut-sivulla. */
  search?: HeaderSearch;
}

const TITLES: Record<Page, string> = {
  tunnusluvut: "Osakkeen tunnusluvut – selkokielellä",
  tutki: "Tutki osaketta",
};

const LEADS: Record<Page, string> = {
  tunnusluvut:
    "Mitä luku kertoo, onko suuri vai pieni arvo hyvä ja mitä kannattaa katsoa rinnalla.",
  tutki: "Syötä yhtiön luvut, niin näet, mitä ne tarkoittavat ja mihin nyrkkisääntöön ne osuvat.",
};

/** Tekstikenttä tai muu kohta, jossa "/" on tavallinen merkki eikä pikanäppäin. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Otsikko, sivulinkit, teemavalitsin, vastuuvapauslauseke sekä Tunnusluvut-sivulla haku ja linkki johdantoon. */
export default function Header({ page, onNavigate, search }: Props) {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";

  const onPageLink = (e: MouseEvent<HTMLAnchorElement>, target: Page) => {
    // Ctrl- ja keskiklikkaus avaavat sivun uuteen välilehteen tavalliseen tapaan.
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (target !== page) onNavigate(target);
  };

  return (
    <header className={styles.header}>
      <nav aria-label="Sivut" className={styles.pages}>
        {PAGES.map((p) => (
          <a
            key={p}
            href={pageHref(p)}
            className={styles.pageLink}
            aria-current={p === page ? "page" : undefined}
            onClick={(e) => onPageLink(e, p)}
          >
            {PAGE_TITLES[p]}
          </a>
        ))}
      </nav>
      <div className={styles.titleRow}>
        <h1 id={PAGE_HEADING_ID} tabIndex={-1} className={styles.title}>
          {TITLES[page]}
        </h1>
        {/* Nimi pysyy samana ja aria-pressed kertoo tilan, jotta ruudunlukija ei hämmenny. */}
        <button
          type="button"
          className={styles.themeToggle}
          aria-pressed={dark}
          onClick={() => setTheme(dark ? "light" : "dark")}
        >
          <span aria-hidden="true">☾</span>
          <span className={styles.themeLabel}>Tumma teema</span>
        </button>
      </div>
      <p className={styles.lead}>{LEADS[page]}</p>
      <p className={styles.disclaimer}>
        <strong>Ei sijoitusneuvontaa.</strong> Opas on harrastusprojekti, ja sen tiedoissa,
        laskelmissa ja tekoälyn poimimissa luvuissa voi olla virheitä. Käytät sovellusta omalla
        vastuullasi: tekijä ei vastaa päätöksistä, jotka teet sen perusteella, eikä niiden
        seurauksista.
      </p>

      {search && <SearchTools {...search} />}
    </header>
  );
}

/** Haku ja johdantolinkki. Pikanäppäin "/" vie hakuun. */
function SearchTools({ query, onQueryChange, showIntroLink, onOpenIntro }: HeaderSearch) {
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
        <button type="button" id={INTRO_LINK_ID} className={styles.introLink} onClick={onOpenIntro}>
          Mitä tunnusluvut ovat?
        </button>
      )}
    </div>
  );
}
