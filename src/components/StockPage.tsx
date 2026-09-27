// Tutki osaketta -sivu (suunnitelman kohta 11). Luvut ovat osoitteessa, joten analyysin voi
// avata uudelleen linkistä, ja selain muistaa viisi viimeisintä analyysiä.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { VerifiedExtraction } from "../ai/verify.ts";
import { joinNames } from "../data/analysis.ts";
import {
  convertFigures,
  currencyOptions,
  needsConversion,
  ratesNeeded,
  type Unconverted,
} from "../data/currency.ts";
import { rateErrorText } from "../data/exchangeRates.ts";
import { calculate, type KnownFigure } from "../data/formulas.ts";
import { formatRate } from "../data/numberFormat.ts";
import {
  decodeAnalysis,
  EMPTY_ANALYSIS,
  encodeAnalysis,
  hasContent,
  formatDate,
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
import { useEurRates } from "../hooks/useEurRate.ts";
import RecentAnalyses from "./RecentAnalyses.tsx";
import appStyles from "./App.module.css";
import styles from "./StockPage.module.css";

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

  // Eri valuutan luvut muunnetaan analyysin valuuttaan ennen laskentaa (kohta 11.11).
  const rates = useEurRates(ratesNeeded(analysis.figures, analysis.currency), analysis.date);
  const { known, unconverted } = convertFigures(analysis.figures, analysis.currency, rates);
  const result = calculate(known);
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
            <AnalysisDetails
              analysis={analysis}
              known={known}
              unconverted={unconverted}
              onChange={setAnalysis}
              onStartOver={startOver}
            />
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
              unconverted={unconverted}
              date={analysis.date}
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
  /** Laskennan lähtöluvut analyysin valuutassa. */
  known: ReadonlyMap<string, KnownFigure>;
  /** Luvut, joita ei voitu muuntaa analyysin valuuttaan. */
  unconverted: readonly Unconverted[];
  onChange: (next: Analysis) => void;
  onStartOver: () => void;
}

/** Yhtiön nimi, valuutta ja hakupäivä sekä paluu alkuun. */
function AnalysisDetails({ analysis, known, unconverted, onChange, onStartOver }: DetailsProps) {
  const nameId = useId();
  const currencyId = useId();
  const dateId = useId();
  const dateHintId = useId();
  const mixed = analysis.figures.some((f) => needsConversion(f, analysis.currency));

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
          <label htmlFor={currencyId}>{mixed ? "Tilinpäätöksen valuutta" : "Valuutta"}</label>
          <select
            id={currencyId}
            className={styles.input}
            value={analysis.currency}
            onChange={(e) => onChange({ ...analysis, currency: e.target.value })}
          >
            {currencyOptions(analysis.currency).map((c) => (
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
      {mixed && (
        <CurrencyNotes
          currency={analysis.currency}
          figures={analysis.figures}
          known={known}
          unconverted={unconverted}
        />
      )}
    </section>
  );
}

interface NotesProps {
  currency: string;
  figures: readonly AnalysisFigure[];
  known: ReadonlyMap<string, KnownFigure>;
  unconverted: readonly Unconverted[];
}

/**
 * Eri valuutan luvut valuutoittain: mitkä muunnettiin ja millä kurssilla, ja mitä ei voitu
 * muuntaa ja miksi (kohta 11.11).
 */
function CurrencyNotes({ currency, figures, known, unconverted }: NotesProps) {
  const foreign = [
    ...new Set(figures.filter((f) => needsConversion(f, currency)).map((f) => f.currency!)),
  ];
  return foreign.map((from) => {
    const ids = figures
      .filter((f) => needsConversion(f, currency) && f.currency === from)
      .map((f) => f.id);
    const failed = unconverted.filter((u) => u.currency === from);
    const one = ids.length === 1;
    const names = joinNames(ids);
    const subject =
      `${names.charAt(0).toUpperCase()}${names.slice(1)} ` +
      (one ? `on ${from}-määräinen` : `ovat ${from}-määräisiä`);
    if (failed.length === 0) {
      const conversion = known.get(ids[0]!)?.conversion;
      if (!conversion) return null;
      return (
        <p key={from} className={styles.hint}>
          {subject}. {one ? "Se" : "Ne"} on muunnettu valuuttaan {currency} ennen laskentaa Euroopan
          keskuspankin kurssilla{conversion.date && ` ${formatDate(conversion.date)}`}:{" "}
          {formatRate(conversion.rate, from, currency)}.
        </p>
      );
    }
    const first = failed[0]!;
    if (first.reason === "haetaan") {
      return (
        <p key={from} className={styles.hint} role="status">
          Haetaan valuuttakurssia, jotta {from}-määräiset luvut voi muuntaa valuuttaan {currency}…
        </p>
      );
    }
    return (
      <p key={from} className={styles.currencyWarning}>
        <span aria-hidden="true">⚠ </span>
        {subject}, eikä {one ? "sitä" : "niitä"} voitu muuntaa valuuttaan {currency}, joten{" "}
        {one ? "sitä" : "niitä"} ei käytetä laskennassa. {rateErrorText(first.reason, first.failed)}
      </p>
    );
  });
}
