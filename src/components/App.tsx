import { useLayoutEffect, useRef } from "react";
import { metrics, metricsById } from "../data/content.ts";
import { useCardNavigation } from "../hooks/useCardNavigation.ts";
import { revealMetric, useMetricFilter, type Filters } from "../hooks/useMetricFilter.ts";
import { usePage, type Page } from "../hooks/usePage.ts";
import { useStoredBoolean } from "../hooks/useStoredBoolean.ts";
import { forgetCardInUrl, useUrlState } from "../hooks/useUrlState.ts";
import FilterBar from "./FilterBar.tsx";
import Footer from "./Footer.tsx";
import Header, { INTRO_LINK_ID, PAGE_HEADING_ID } from "./Header.tsx";
import StockPage from "./StockPage.tsx";
import IntroPanel, { INTRO_HEADING_ID } from "./IntroPanel.tsx";
import MetricGrid from "./MetricGrid.tsx";
import ResultStatus from "./ResultStatus.tsx";
import TableOfContents, { TOC_STORAGE_KEY } from "./TableOfContents.tsx";
import styles from "./App.module.css";

/** localStorage-avaimet */
export const STORAGE_KEYS = {
  introClosed: "tunnusluvut.johdanto-suljettu",
  showAdvanced: "tunnusluvut.nayta-syventavat",
  tocOpen: TOC_STORAGE_KEY,
} as const;

/** Sivu valitaan osoitteen parametrilla ?sivu=tutki (suunnitelman kohta 11.1). */
export default function App() {
  const [page, navigate] = usePage();

  // Sivun vaihdon jälkeen kohdistus siirtyy uuden sivun otsikkoon, mutta ei ensimmäisellä latauksella.
  const shownPage = useRef(page);
  useLayoutEffect(() => {
    if (shownPage.current === page) return;
    shownPage.current = page;
    document.getElementById(PAGE_HEADING_ID)?.focus();
  }, [page]);

  return page === "tutki" ? (
    <StockPage onNavigate={navigate} />
  ) : (
    <GuidePage onNavigate={navigate} />
  );
}

/** Tunnusluvut-sivu: haku, sisällysluettelo, johdanto ja kortit. */
function GuidePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [{ query, category }, setUrlState] = useUrlState();
  const [showAdvanced, setShowAdvanced] = useStoredBoolean(STORAGE_KEYS.showAdvanced, true);
  const [introClosed, setIntroClosed] = useStoredBoolean(STORAGE_KEYS.introClosed, false);
  const filters = { query, category, showAdvanced };
  const { visible, hiddenMatches } = useMetricFilter(metrics, filters);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Linkki piilotettuun korttiin nollaa sen, mikä kortin piilottaa.
  useCardNavigation((id) => {
    const metric = metricsById.get(id);
    if (!metric) return;
    const next = revealMetric(filters, metric);
    setUrlState({ query: next.query, category: next.category });
    if (next.showAdvanced !== showAdvanced) setShowAdvanced(next.showAdvanced);
  });

  // Johdannon avaamisen tai sulkemisen jälkeen kohdistus siirtyy järkevään paikkaan.
  const focusAfterRender = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!focusAfterRender.current) return;
    document.getElementById(focusAfterRender.current)?.focus();
    focusAfterRender.current = null;
  });

  const setIntroOpen = (open: boolean) => {
    focusAfterRender.current = open ? INTRO_HEADING_ID : INTRO_LINK_ID;
    setIntroClosed(!open);
  };

  /** Suodattimen vaihtuessa alas vieritetty sivu palaa tulosten alkuun. */
  const scrollToResults = () => {
    const results = resultsRef.current;
    if (results && results.getBoundingClientRect().top < 0) {
      results.scrollIntoView({ behavior: "instant", block: "start" });
    }
  };

  /**
   * Käyttäjän oma haun tai suodattimen muutos. Osoitteen kortti (#pe) unohdetaan, koska se
   * voi jäädä piiloon, ja jaettu linkki muuten nollaisi juuri valitun suodattimen.
   */
  const changeFilters = (next: Partial<Filters>) => {
    forgetCardInUrl();
    scrollToResults();
    // category: null tarkoittaa kaikkia kategorioita, joten ?? ei kelpaa.
    setUrlState({
      query: next.query ?? query,
      category: "category" in next ? (next.category ?? null) : category,
    });
    if (next.showAdvanced !== undefined) setShowAdvanced(next.showAdvanced);
  };

  return (
    <div className={styles.page}>
      <Header
        page="tunnusluvut"
        onNavigate={onNavigate}
        search={{
          query,
          onQueryChange: (q) => changeFilters({ query: q }),
          showIntroLink: introClosed,
          onOpenIntro: () => setIntroOpen(true),
        }}
      />
      {/* Haun aikana sisällysluettelo ja johdanto väistyvät, jotta tulokset näkyvät heti hakukentän alla. */}
      {!query && <TableOfContents />}
      {!introClosed && !query && <IntroPanel onClose={() => setIntroOpen(false)} />}
      <main>
        <FilterBar
          category={category}
          onCategoryChange={(c) => changeFilters({ category: c })}
          showAdvanced={showAdvanced}
          onShowAdvancedChange={(show) => changeFilters({ showAdvanced: show })}
          visibleCount={visible.length}
        />
        <div ref={resultsRef} className={styles.results}>
          <ResultStatus
            query={query}
            visibleCount={visible.length}
            hiddenCount={hiddenMatches.length}
            onShowHidden={() => changeFilters({ category: null, showAdvanced: true })}
            onClearSearch={() => changeFilters({ query: "" })}
          />
          <MetricGrid metrics={visible} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
