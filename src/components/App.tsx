import { useLayoutEffect, useRef } from "react";
import { metrics, metricsById } from "../data/content.ts";
import { useCardNavigation } from "../hooks/useCardNavigation.ts";
import { revealMetric, useMetricFilter, type Filters } from "../hooks/useMetricFilter.ts";
import { useStoredBoolean } from "../hooks/useStoredBoolean.ts";
import { forgetCardInUrl, useUrlState } from "../hooks/useUrlState.ts";
import FilterBar from "./FilterBar.tsx";
import Header, { INTRO_LINK_ID } from "./Header.tsx";
import IntroPanel, { INTRO_HEADING_ID } from "./IntroPanel.tsx";
import MetricGrid from "./MetricGrid.tsx";
import ResultStatus from "./ResultStatus.tsx";
import styles from "./App.module.css";

/** localStorage-avaimet */
export const STORAGE_KEYS = {
  introClosed: "tunnusluvut.johdanto-suljettu",
  showAdvanced: "tunnusluvut.nayta-syventavat",
} as const;

export default function App() {
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
        query={query}
        onQueryChange={(q) => changeFilters({ query: q })}
        showIntroLink={introClosed}
        onOpenIntro={() => setIntroOpen(true)}
      />
      {/* Haun aikana johdanto väistyy, jotta tulokset näkyvät heti hakukentän alla. */}
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
      <footer className={styles.footer}>
        Tämä on opas tunnuslukujen ymmärtämiseen, ei sijoitusneuvontaa. Sijoittamiseen liittyy aina
        riski.
      </footer>
    </div>
  );
}
