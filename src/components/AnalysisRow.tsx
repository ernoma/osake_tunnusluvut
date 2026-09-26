// Yksi tunnusluku analyysinäkymässä (suunnitelman kohdat 11.4 ja 11.5): arvo ja lähde, laskelma
// omilla luvuilla, huomautukset, osuva nyrkkisääntöväli, suuntamerkki, yleinen virhe ja linkki
// korttiin. Näkymä ei koskaan sano "osta" tai "myy" eikä anna pisteitä.

import { describeCalculation, matchRange } from "../data/analysis.ts";
import { displayName } from "../data/content.ts";
import { differsNotably, PERIOD_LABELS, type ResolvedFigure } from "../data/formulas.ts";
import { formatNumber } from "../data/numberFormat.ts";
import type { Metric } from "../data/types.ts";
import { rowHeadingId } from "./analysisIds.ts";
import DirectionBadge from "./DirectionBadge.tsx";
import RangeScale from "./RangeScale.tsx";
import RichText from "./RichText.tsx";
import styles from "./AnalysisRow.module.css";

const ORIGIN_LABELS: Record<ResolvedFigure["origin"], string> = {
  sivu: "Sivulta",
  kayttaja: "Syötetty",
  laskettu: "Laskettu",
};

interface Props {
  metric: Metric;
  figure: ResolvedFigure;
  /** Syötetyn tai poimitun luvun vuosi, esim. "2025". */
  year?: string;
  currency: string;
}

export default function AnalysisRow({ metric, figure, year, currency }: Props) {
  const format = (value: number, unit = metric.unit) => formatNumber(value, unit, currency);
  const valueText = format(figure.value);
  const calculation = figure.calculation;
  const source = [ORIGIN_LABELS[figure.origin], figure.period && PERIOD_LABELS[figure.period], year]
    .filter(Boolean)
    .join(" · ");
  // Euromääräiset rajat (markkina-arvon kokoluokat) eivät sovi muun valuutan luvuille.
  const currencyMismatch = metric.unit === "€" && currency !== "EUR";
  const headingId = rowHeadingId(metric.id);

  return (
    <article className={styles.row} aria-labelledby={headingId}>
      <header className={styles.header}>
        <h4 id={headingId} tabIndex={-1} className={styles.name}>
          {displayName(metric)}
        </h4>
        <p className={styles.value}>
          <span className="visually-hidden">Arvo: </span>
          {valueText}
        </p>
        <p className={`${styles.source} ${styles[figure.origin]}`}>
          <span className="visually-hidden">Lähde: </span>
          {source}
        </p>
      </header>

      {figure.origin === "laskettu" && calculation && (
        <p className={styles.calculation}>
          <span className={styles.smallLabel}>Laskettu omista luvuista: </span>
          {describeCalculation(calculation, currency)} = {valueText}
          {calculation.formula.note && (
            <span className={styles.formulaNote}> {calculation.formula.note}</span>
          )}
        </p>
      )}

      {figure.mixedPeriods && (
        <p className={styles.warning}>
          <span aria-hidden="true">⚠ </span>Laskettu eri kausien luvuista, esimerkiksi toteutuneesta
          ja ennusteesta. Tulos on vain suuntaa antava. Tarkista luvut taulukosta.
        </p>
      )}

      {figure.origin !== "laskettu" &&
        calculation &&
        differsNotably(figure.value, calculation.value) && (
          <p className={styles.warning}>
            <span aria-hidden="true">⚠ </span>
            {figure.origin === "sivu" ? "Sivun luku" : "Syöttämäsi luku"} on {valueText}, omista
            luvuista laskettuna {format(calculation.value)} (
            {describeCalculation(calculation, currency)}
            ). Ero johtuu yleensä eri kaudesta tai oikaistuista luvuista.
          </p>
        )}

      <DirectionBadge direction={metric.direction} label={metric.directionLabel} />

      {metric.ranges && !currencyMismatch && (
        <RangeScale
          ranges={metric.ranges}
          note={metric.rangesNote}
          value={{ match: matchRange(metric.ranges, figure.value), text: valueText }}
        />
      )}
      {metric.ranges && currencyMismatch && (
        <p className={styles.note}>
          Kokoluokkien rajat ovat euroina, joten {currency}-määräistä lukua ei verrata niihin.
          Muunna luku euroiksi, jos haluat verrata.
        </p>
      )}

      {!metric.ranges && (
        <ul className={styles.rules} aria-label="Näin tulkitset">
          {metric.rules.map((rule) => (
            <li key={rule}>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              <span>
                <RichText text={rule} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.mistake}>
        <strong>
          <span aria-hidden="true">⚠ </span>Yleinen virhe:
        </strong>{" "}
        <RichText text={metric.commonMistake} />
      </p>

      <a className={styles.cardLink} href={`${window.location.pathname}#${metric.id}`}>
        Avaa kortti<span className="visually-hidden">: {displayName(metric)}</span>
        <span aria-hidden="true"> →</span>
      </a>
    </article>
  );
}
