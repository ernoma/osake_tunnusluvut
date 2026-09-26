// Tutki osaketta -sivu (suunnitelman kohta 11). Luvut ovat osoitteessa, joten analyysin voi
// avata uudelleen linkistä, ja selain muistaa viisi viimeisintä analyysiä.

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { VerifiedExtraction } from "../ai/verify.ts";
import { calculate, type KnownFigure } from "../data/formulas.ts";
import {
  decodeAnalysis,
  EMPTY_ANALYSIS,
  encodeAnalysis,
  hasContent,
  today,
  useAnalysisUrl,
  type Analysis,
  type AnalysisFigure,
} from "../hooks/useAnalysisUrl.ts";
import type { Page } from "../hooks/usePage.ts";
import {
  newRecentKey,
  useRecentAnalyses,
  type RecentAnalysis,
} from "../hooks/useRecentAnalyses.ts";
import AnalysisView from "./AnalysisView.tsx";
import Footer from "./Footer.tsx";
import FiguresTable from "./FiguresTable.tsx";
import Header from "./Header.tsx";
import ExtractionReview, {
  REVIEW_HEADING_ID,
  type AcceptedExtraction,
} from "./ExtractionReview.tsx";
import PasteStep, { PASTE_TEXT_ID, START_HEADING_ID } from "./PasteStep.tsx";
import RecentAnalyses from "./RecentAnalyses.tsx";
import appStyles from "./App.module.css";
import styles from "./StockPage.module.css";

/** Valuutat valintalistassa. Osoitteesta luettu muu koodi lisätään listaan. */
export const CURRENCIES = ["EUR", "USD", "SEK", "NOK", "DKK", "GBP", "CHF"] as const;

function knownFigures(figures: readonly AnalysisFigure[]): Map<string, KnownFigure> {
  return new Map(
    figures.map((f) => [f.id, { value: f.value, origin: f.origin, period: f.period }]),
  );
}

export default function StockPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [analysis, setAnalysis] = useAnalysisUrl();
  const { recent, save, remove } = useRecentAnalyses();
  const [started, setStarted] = useState(() => hasContent(analysis));
  // Taulukon tila (keskeneräiset kentät) nollataan, kun toinen analyysi avataan.
  const [version, setVersion] = useState(0);
  const [startedFresh, setStartedFresh] = useState(false);
  // Liitetty teksti säilyy, kun käyttäjä palaa tarkistuksesta tekstiin. Sitä ei tallenneta.
  const [pasteText, setPasteText] = useState("");
  const [review, setReview] = useState<VerifiedExtraction | null>(null);

  // Muokattava analyysi päivittää samaa riviä viimeisimmissä eikä lisää uutta.
  const recentKey = useRef<string | null>(null);
  if (recentKey.current === null && hasContent(analysis)) {
    const search = encodeAnalysis(analysis);
    recentKey.current = recent.find((r) => r.search === search)?.key ?? null;
  }

  useEffect(() => {
    if (analysis.figures.length === 0) return;
    recentKey.current ??= newRecentKey();
    save({
      key: recentKey.current,
      name: analysis.name,
      date: analysis.date,
      search: encodeAnalysis(analysis),
    });
  }, [analysis, save]);

  // Vaiheen vaihtuessa kohdistus siirtyy uuden vaiheen alkuun.
  const focusAfterRender = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!focusAfterRender.current) return;
    document.getElementById(focusAfterRender.current)?.focus();
    focusAfterRender.current = null;
  });

  const result = useMemo(() => calculate(knownFigures(analysis.figures)), [analysis.figures]);
  const calculated = [...result.figures]
    .filter(([, f]) => f.origin === "laskettu")
    .map(([id, f]) => ({ id, value: f.value }));

  const startManually = () => {
    setAnalysis({ ...analysis, date: analysis.date || today() });
    setStartedFresh(true);
    setStarted(true);
  };

  const openRecent = (entry: RecentAnalysis) => {
    recentKey.current = entry.key;
    setAnalysis(decodeAnalysis(entry.search));
    setVersion((v) => v + 1);
    setStartedFresh(false);
    setStarted(true);
    focusAfterRender.current = ANALYSIS_HEADING_ID;
  };

  const startOver = () => {
    recentKey.current = null;
    setAnalysis(EMPTY_ANALYSIS);
    setVersion((v) => v + 1);
    setStarted(false);
    setReview(null);
    setPasteText("");
    focusAfterRender.current = START_HEADING_ID;
  };

  const showReview = (result: VerifiedExtraction) => {
    setReview(result);
    focusAfterRender.current = REVIEW_HEADING_ID;
  };

  const backToPaste = () => {
    setReview(null);
    focusAfterRender.current = PASTE_TEXT_ID;
  };

  const acceptExtraction = ({ name, currency, figures }: AcceptedExtraction) => {
    recentKey.current = null;
    setAnalysis({ name, currency, date: today(), figures });
    setVersion((v) => v + 1);
    setStartedFresh(figures.length === 0);
    setReview(null);
    setStarted(true);
    focusAfterRender.current = ANALYSIS_HEADING_ID;
  };

  return (
    <div className={appStyles.page}>
      <Header page="tutki" onNavigate={onNavigate} />
      <main className={styles.main}>
        {/* Maamerkin sisällä, jotta ruudunlukija ei ohita lauseketta (axe: region). */}
        <p className={styles.disclaimer}>
          Tämä on opas tunnuslukujen tulkintaan, ei sijoitusneuvontaa.
        </p>
        {started ? (
          <div key={version} className={styles.analysis}>
            <AnalysisDetails analysis={analysis} onChange={setAnalysis} onStartOver={startOver} />
            <FiguresTable
              figures={analysis.figures}
              currency={analysis.currency}
              calculated={calculated}
              onChange={(figures) => setAnalysis({ ...analysis, figures })}
              initiallyAdding={startedFresh && analysis.figures.length === 0}
            />
            <AnalysisView
              result={result}
              figures={analysis.figures}
              currency={analysis.currency}
              onAdd={(added) =>
                setAnalysis({ ...analysis, figures: [...analysis.figures, ...added] })
              }
            />
          </div>
        ) : review ? (
          <ExtractionReview
            result={review}
            defaultCurrency={analysis.currency}
            onAccept={acceptExtraction}
            onBack={backToPaste}
          />
        ) : (
          <PasteStep
            text={pasteText}
            onTextChange={setPasteText}
            onExtracted={showReview}
            onEnterManually={startManually}
          >
            <RecentAnalyses recent={recent} onOpen={openRecent} onRemove={remove} />
          </PasteStep>
        )}
      </main>
      <Footer />
    </div>
  );
}

export const ANALYSIS_HEADING_ID = "analyysi-otsikko";

interface DetailsProps {
  analysis: Analysis;
  onChange: (next: Analysis) => void;
  onStartOver: () => void;
}

/** Yhtiön nimi, valuutta ja hakupäivä sekä paluu alkuun. */
function AnalysisDetails({ analysis, onChange, onStartOver }: DetailsProps) {
  const nameId = useId();
  const currencyId = useId();
  const dateId = useId();
  const dateHintId = useId();
  const currencies: readonly string[] = CURRENCIES.includes(
    analysis.currency as (typeof CURRENCIES)[number],
  )
    ? CURRENCIES
    : [...CURRENCIES, analysis.currency];

  return (
    <section className={styles.details} aria-labelledby={ANALYSIS_HEADING_ID}>
      <div className={styles.detailsHead}>
        <h2 id={ANALYSIS_HEADING_ID} tabIndex={-1} className={styles.stepHeading}>
          Yhtiö
        </h2>
        <button type="button" className={styles.secondaryButton} onClick={onStartOver}>
          Uusi analyysi
        </button>
      </div>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={nameId}>Yhtiön nimi</label>
          <input
            id={nameId}
            className={styles.input}
            autoComplete="off"
            placeholder="esim. Nokia"
            value={analysis.name}
            onChange={(e) => onChange({ ...analysis, name: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={currencyId}>Valuutta</label>
          <select
            id={currencyId}
            className={styles.input}
            value={analysis.currency}
            onChange={(e) => onChange({ ...analysis, currency: e.target.value })}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={dateId}>Luvut haettu</label>
          <input
            id={dateId}
            type="date"
            className={styles.input}
            aria-describedby={dateHintId}
            value={analysis.date}
            onChange={(e) => onChange({ ...analysis, date: e.target.value })}
          />
        </div>
      </div>
      <p id={dateHintId} className={styles.hint}>
        Kurssiin sidotut luvut, kuten P/E ja osinkotuotto, vanhenevat nopeasti. Päivämäärästä näet
        myöhemmin, kuinka tuoreita luvut ovat.
      </p>
    </section>
  );
}
