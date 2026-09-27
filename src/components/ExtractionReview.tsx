// Tekoälyn poimimien lukujen tarkistus (suunnitelman kohdat 11.1 ja 11.2). Käyttäjä valitsee,
// mitkä luvut siirtyvät analyysiin. Luku, jonka lainaus ei vastaa arvoa, on merkitty
// "Tarkista luku", eikä sitä ole valittu oletuksena. Tästä eteenpäin tekoälyä ei käytetä.

import { useState, type FormEvent } from "react";
import type { VerifiedExtraction } from "../ai/verify.ts";
import { joinNames } from "../data/analysis.ts";
import { displayName, figuresById } from "../data/content.ts";
import { PERIOD_LABELS } from "../data/formulas.ts";
import { formatNumber } from "../data/numberFormat.ts";
import type { AnalysisFigure } from "../hooks/useAnalysisUrl.ts";
import styles from "./ExtractionReview.module.css";

export const REVIEW_HEADING_ID = "tarkista-luvut";

export interface AcceptedExtraction {
  name: string;
  currency: string;
  figures: AnalysisFigure[];
}

interface Props {
  result: VerifiedExtraction;
  /** Valuutta, jos tekstistä ei löytynyt valuuttaa. */
  defaultCurrency: string;
  onAccept: (accepted: AcceptedExtraction) => void;
  onBack: () => void;
}

const REJECT_REASONS = {
  lainaus: "lainausta ei löytynyt liitetystä tekstistä",
  kaksoiskappale: "sama luku oli vastauksessa kahdesti",
  tuntematon: "tuntematon luku",
} as const;

function nameOf(id: string): string {
  const info = figuresById.get(id);
  return info ? displayName(info) : id;
}

export default function ExtractionReview({ result, defaultCurrency, onAccept, onBack }: Props) {
  const [selected, setSelected] = useState(
    () => new Set(result.values.filter((v) => v.check === "ok").map((v) => v.id)),
  );
  const currency = result.company.currency ?? defaultCurrency;
  const foreign = [...new Set(result.values.flatMap((v) => (v.currency ? [v.currency] : [])))];
  const toCheck = result.values.filter((v) => v.check === "tarkista").length;

  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAccept({
      name: result.company.name,
      currency,
      figures: result.values
        .filter((v) => selected.has(v.id))
        .map((v) => ({
          id: v.id,
          value: v.value,
          period: v.period,
          year: v.year,
          origin: "sivu",
          ...(v.currency ? { currency: v.currency } : {}),
        })),
    });
  };

  return (
    <section className={styles.section} aria-labelledby={REVIEW_HEADING_ID}>
      <h2 id={REVIEW_HEADING_ID} tabIndex={-1} className={styles.heading}>
        Tarkista poimitut luvut
      </h2>
      <p className={styles.intro}>
        {result.company.name ? <strong>{result.company.name}</strong> : "Yhtiö"}
        {` · ${currency}${result.company.currency ? "" : " (valuuttaa ei löytynyt tekstistä)"}`}.
        Vertaa lukuja lainauksiin ja valitse, mitkä otetaan analyysiin. Voit korjata lukuja vielä
        seuraavassa vaiheessa.
        {toCheck === 1 &&
          " Yksi luku on merkitty ⚠-merkillä, eikä sitä ole valittu. Tarkista se itse."}
        {toCheck > 1 &&
          ` ${toCheck} lukua on merkitty ⚠-merkillä, eikä niitä ole valittu. Tarkista ne itse.`}
      </p>

      {foreign.map((from) => {
        const ids = result.values.filter((v) => v.currency === from).map((v) => v.id);
        const names = joinNames(ids);
        return (
          <p key={from} className={styles.currencyWarning}>
            {names.charAt(0).toUpperCase() + names.slice(1)}{" "}
            {ids.length === 1 ? `on ${from}-määräinen` : `ovat ${from}-määräisiä`}, mutta
            tilinpäätösluvut {currency}-määräisiä. Sovellus muuntaa{" "}
            {ids.length === 1 ? "sen" : "ne"} valuuttaan {currency} Euroopan keskuspankin kurssilla
            ennen laskentaa. Voit vaihtaa luvun valuutan seuraavassa vaiheessa.
          </p>
        );
      })}

      {result.notes.length > 0 && (
        <div className={styles.notes}>
          <h3 className={styles.subheading}>Tekoälyn huomiot</h3>
          <ul>
            {result.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <form className={styles.form} onSubmit={submit}>
        <ul className={styles.list} aria-label="Poimitut luvut">
          {result.values.map((v) => {
            const info = figuresById.get(v.id);
            if (!info) return null;
            const name = displayName(info);
            const checkId = `tarkista-${v.id}`;
            return (
              <li key={v.id} className={v.check === "tarkista" ? styles.warn : styles.item}>
                <input
                  id={checkId}
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.has(v.id)}
                  onChange={(e) => toggle(v.id, e.target.checked)}
                />
                <div className={styles.body}>
                  <label htmlFor={checkId} className={styles.label}>
                    <span className={styles.name}>{name}</span>{" "}
                    <strong className={styles.value}>
                      {formatNumber(v.value, info.unit, v.currency ?? currency)}
                    </strong>
                  </label>
                  <span className={styles.meta}>
                    {PERIOD_LABELS[v.period]}
                    {v.year && ` · ${v.year}`}
                  </span>
                  {v.check === "tarkista" && (
                    <span className={styles.warning}>Tarkista luku: {v.warning}</span>
                  )}
                  <blockquote className={styles.quote}>
                    <span className="visually-hidden">Lainaus tekstistä: </span>
                    {v.quote}
                  </blockquote>
                </div>
              </li>
            );
          })}
        </ul>

        {result.rejected.length > 0 && (
          <details className={styles.rejected}>
            <summary>
              Hylätyt luvut ({result.rejected.length}): tekoälyn vastaus ei kelvannut
            </summary>
            <ul>
              {result.rejected.map((r, i) => (
                <li key={i}>
                  <strong>{nameOf(r.id)}</strong>: {REJECT_REASONS[r.reason]}.
                  {r.quote && <span className={styles.rejectedQuote}> Lainaus: ”{r.quote}”</span>}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryButton}>
            Käytä valittuja lukuja ({selected.size})
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onBack}>
            Takaisin tekstiin
          </button>
        </div>
      </form>
    </section>
  );
}
