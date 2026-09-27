// Yksi tunnusluku analyysinäkymässä (suunnitelman kohdat 11.4 ja 11.5): arvo ja lähde, laskelma
// omilla luvuilla, huomautukset, osuva nyrkkisääntöväli, suuntamerkki, yleinen virhe ja linkki
// korttiin. Näkymä ei koskaan sano "osta" tai "myy" eikä anna pisteitä.

import { describeCalculation, figureCurrency, matchRange } from "../data/analysis.ts";
import { displayName } from "../data/content.ts";
import {
  differsNotably,
  PERIOD_LABELS,
  type Calculation,
  type ResolvedFigure,
} from "../data/formulas.ts";
import type { EurRate, RateErrorReason } from "../data/exchangeRates.ts";
import { formatEurRate, formatNumber } from "../data/numberFormat.ts";
import type { Metric } from "../data/types.ts";
import { formatDate } from "../hooks/useAnalysisUrl.ts";
import { useEurRate } from "../hooks/useEurRate.ts";
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

const RATE_ERRORS: Record<RateErrorReason, (currency: string) => string> = {
  verkko: () => "Valuuttakurssin haku ei onnistunut. Tarkista verkkoyhteys.",
  valuutta: (currency) => `Euroopan keskuspankki ei julkaise kurssia valuutalle ${currency}.`,
  vastaus: () => "Valuuttakurssipalvelu ei vastannut odotetusti.",
};

interface Props {
  metric: Metric;
  figure: ResolvedFigure;
  /** Syötetyn tai poimitun luvun vuosi, esim. "2025". */
  year?: string;
  /** Analyysin (tilinpäätöksen) valuutta. */
  currency: string;
  /** Kurssin valuutta, jos se eroaa tilinpäätöksen valuutasta (kohta 11.11). */
  priceCurrency?: string;
  /** Laskelma yhdistää kurssiin sidotun luvun tilinpäätöslukuun eri valuutoissa. */
  mixesCurrencies?: boolean;
  /** Analyysin hakupäivä vvvv-kk-pp tai tyhjä. Valuuttakurssi haetaan tältä päivältä. */
  date: string;
}

export default function AnalysisRow({
  metric,
  figure,
  year,
  currency: statementCurrency,
  priceCurrency = "",
  mixesCurrencies = false,
  date,
}: Props) {
  // Kurssiin sidottu tunnusluku (markkina-arvo, EV) on kurssin valuutassa.
  const currency = figureCurrency(metric.id, statementCurrency, priceCurrency);
  const format = (value: number, unit = metric.unit) => formatNumber(value, unit, currency);
  const describe = (c: Calculation) => describeCalculation(c, statementCurrency, priceCurrency);
  const valueText = format(figure.value);
  const calculation = figure.calculation;
  const source = [ORIGIN_LABELS[figure.origin], figure.period && PERIOD_LABELS[figure.period], year]
    .filter(Boolean)
    .join(" · ");
  // Euromääräisiin rajoihin (markkina-arvon kokoluokat) verrataan muun valuutan luku euroiksi
  // muunnettuna EKP:n kurssilla (kohta 11.10).
  const eurRate = useEurRate(currency, date, metric.ranges !== undefined && metric.unit === "€");
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
          {describe(calculation)} = {valueText}
          {calculation.formula.note && (
            <span className={styles.formulaNote}> {calculation.formula.note}</span>
          )}
        </p>
      )}

      {figure.origin === "laskettu" && mixesCurrencies && (
        <p className={styles.warning}>
          <span aria-hidden="true">⚠ </span>Laskettu yhdistämällä {priceCurrency}-määräinen kurssiin
          sidottu luku {statementCurrency}-määräiseen tilinpäätöslukuun, joten tulos on väärin.
          Muunna luvut samaan valuuttaan.
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
            luvuista laskettuna {format(calculation.value)} ({describe(calculation)}
            ).{" "}
            {mixesCurrencies
              ? `Laskelma yhdistää ${priceCurrency}-määräisen kurssiin sidotun luvun ${statementCurrency}-määräiseen tilinpäätöslukuun, joten omista luvuista laskettu arvo on väärin.`
              : "Ero johtuu yleensä eri kaudesta tai oikaistuista luvuista."}
          </p>
        )}

      <DirectionBadge direction={metric.direction} label={metric.directionLabel} />

      {metric.ranges && eurRate.status === "ei-tarvita" && (
        <RangeScale
          ranges={metric.ranges}
          note={metric.rangesNote}
          value={{ match: matchRange(metric.ranges, figure.value), text: valueText }}
        />
      )}
      {metric.ranges && eurRate.status === "valmis" && (
        <ConvertedScale
          metric={metric}
          value={figure.value}
          valueText={valueText}
          {...eurRate.rate}
        />
      )}
      {metric.ranges && eurRate.status === "haetaan" && (
        <p className={styles.note} role="status">
          Haetaan valuuttakurssia, jotta {currency}-määräistä lukua voi verrata euromääräisiin
          kokoluokkiin…
        </p>
      )}
      {metric.ranges && eurRate.status === "virhe" && (
        <p className={styles.note} role="status">
          Kokoluokkien rajat ovat euroina, joten {currency}-määräistä lukua ei verrata niihin.{" "}
          {RATE_ERRORS[eurRate.reason](currency)}
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

interface ConvertedProps extends EurRate {
  metric: Metric;
  value: number;
  valueText: string;
}

/** Kokoluokat euroiksi muunnetun arvon mukaan sekä muunnos ja kurssi näkyvissä. */
function ConvertedScale({ metric, value, valueText, currency, rate, date }: ConvertedProps) {
  const eurValue = value / rate;
  const conversion = `${valueText} ≈ ${formatNumber(eurValue, metric.unit, "EUR")}`;
  return (
    <>
      <RangeScale
        ranges={metric.ranges!}
        note={metric.rangesNote}
        value={{ match: matchRange(metric.ranges!, eurValue), text: conversion }}
      />
      <p className={styles.note}>
        Kokoluokka on arvioitu euroiksi muunnettuna: {conversion}. Euroopan keskuspankin kurssi{" "}
        {formatDate(date)}: {formatEurRate(rate, currency)}.
      </p>
    </>
  );
}
