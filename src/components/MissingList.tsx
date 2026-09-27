// Puuttuvat tunnusluvut ja niiden lähtötiedot (suunnitelman kohta 11.5). Jokaisesta luvusta,
// jota ei ole eikä voi laskea, kerrotaan, mitä pitää syöttää, ja "Lisää" avaa niiden kentät.
// Luvusta, jota ei laskettu nollan tai negatiivisen nimittäjän vuoksi, näytetään kortin sääntö.

import { useId, useRef, useState, type FormEvent } from "react";
import { joinNames, lowerFirst, nonPositiveRule } from "../data/analysis.ts";
import { displayName, figuresById } from "../data/content.ts";
import { unconvertedText, type Unconverted } from "../data/currency.ts";
import { parseFigureValue } from "../data/figureEntry.ts";
import type { BlockedFigure, Period, ResolvedFigure } from "../data/formulas.ts";
import { formatNumber, unitLabel } from "../data/numberFormat.ts";
import type { Metric } from "../data/types.ts";
import type { AnalysisFigure } from "../hooks/useAnalysisUrl.ts";
import { addButtonId } from "./analysisIds.ts";
import { PeriodSelect } from "./FiguresTable.tsx";
import RichText from "./RichText.tsx";
import styles from "./MissingList.module.css";

export type MissingItem =
  { metric: Metric; inputs: string[] } | { metric: Metric; blocked: BlockedFigure };

interface Props {
  items: MissingItem[];
  figures: ReadonlyMap<string, ResolvedFigure>;
  /** Analyysin valuutta. Laskennan luvut ovat tässä valuutassa. */
  currency: string;
  /** Luvut, joita ei voitu muuntaa analyysin valuuttaan, joten niitä ei käytetä laskennassa. */
  unconverted?: readonly Unconverted[];
  onAdd: (metric: Metric, figures: AnalysisFigure[]) => void;
}

export default function MissingList({ items, figures, currency, unconverted = [], onAdd }: Props) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <div className={styles.missing}>
      <h4 id={headingId} className={styles.heading}>
        Puuttuu ({items.length})
      </h4>
      <ul className={styles.list} aria-labelledby={headingId}>
        {items.map((item) => (
          <li key={item.metric.id} className={styles.item}>
            {"blocked" in item ? (
              <BlockedText item={item} figures={figures} currency={currency} />
            ) : (
              <MissingEntry
                metric={item.metric}
                inputs={item.inputs}
                currency={currency}
                unconverted={unconverted}
                onAdd={(added) => onAdd(item.metric, added)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlockedText({
  item,
  figures,
  currency,
}: {
  item: { metric: Metric; blocked: BlockedFigure };
  figures: ReadonlyMap<string, ResolvedFigure>;
  currency: string;
}) {
  const rule = nonPositiveRule(item.metric);
  const values = item.blocked.nonPositive.map((id) => {
    const info = figuresById.get(id);
    const value = figures.get(id)?.value;
    if (!info || value === undefined) return id;
    return `${lowerFirst(displayName(info))} on ${formatNumber(value, info.unit, currency)}`;
  });
  return (
    <p className={styles.text}>
      <strong>{displayName(item.metric)}:</strong> ei laskettu, koska {values.join(" ja ")}, eli
      nolla tai negatiivinen.{" "}
      {rule && (
        <span>
          <RichText text={rule} />
        </span>
      )}
    </p>
  );
}

interface EntryProps {
  metric: Metric;
  inputs: string[];
  currency: string;
  unconverted: readonly Unconverted[];
  onAdd: (figures: AnalysisFigure[]) => void;
}

function MissingEntry({ metric, inputs: allInputs, currency, unconverted, onAdd }: EntryProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const name = displayName(metric);
  // Syötetty luku, jota ei voitu muuntaa analyysin valuuttaan, puuttuu laskennasta. Siitä
  // kerrotaan syy eikä pyydetä syöttämään sitä uudelleen (kohta 11.11).
  const own = unconverted.find((u) => u.id === metric.id);
  const reasons = own ? [own] : unconverted.filter((u) => allInputs.includes(u.id));
  const inputs = own ? [] : allInputs.filter((id) => !reasons.some((u) => u.id === id));
  const self = inputs.length === 1 && inputs[0] === metric.id;

  const close = () => {
    setOpen(false);
    // Lomake poistuu, joten kohdistus palaa sen avanneeseen painikkeeseen.
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  return (
    <>
      <p className={styles.text}>
        <strong>{name}:</strong>{" "}
        {reasons.map((u) => {
          const info = figuresById.get(u.id);
          return `${unconvertedText(u, info ? displayName(info) : u.id, currency)} `;
        })}
        {inputs.length > 0 &&
          (self
            ? "Syötä luku itse, esimerkiksi tilinpäätöksestä tai pörssisivulta."
            : `Syötä ${reasons.length > 0 ? "myös " : ""}${joinNames(inputs)}.`)}{" "}
        {!open && inputs.length > 0 && (
          <button
            ref={buttonRef}
            id={addButtonId(metric.id)}
            type="button"
            className={styles.addButton}
            aria-label={`Lisää: ${name}`}
            onClick={() => setOpen(true)}
          >
            Lisää
          </button>
        )}
      </p>
      {open && (
        <EntryForm
          title={name}
          inputs={inputs}
          currency={currency}
          onAdd={(added) => {
            setOpen(false);
            onAdd(added);
          }}
          onCancel={close}
        />
      )}
    </>
  );
}

interface FormProps {
  title: string;
  inputs: string[];
  currency: string;
  onAdd: (figures: AnalysisFigure[]) => void;
  onCancel: () => void;
}

/** Kenttä jokaiselle puuttuvalle lähtötiedolle ja yhteinen kausi. Tyhjät kentät ohitetaan. */
function EntryForm({ title, inputs, currency, onAdd, onCancel }: FormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period | undefined>("toteutunut");
  const baseId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = (id: string) => `${baseId}-${id}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const added: AnalysisFigure[] = [];
    const nextErrors: Record<string, string> = {};
    for (const id of inputs) {
      const info = figuresById.get(id);
      const text = values[id]?.trim() ?? "";
      if (!info || text === "") continue;
      const result = parseFigureValue(text, info.unit);
      if ("error" in result) nextErrors[id] = result.error;
      else added.push({ id, value: result.value, period, year: "", origin: "kayttaja" });
    }
    setErrors(nextErrors);
    const firstError = inputs.find((id) => nextErrors[id]);
    if (firstError) {
      document.getElementById(fieldId(firstError))?.focus();
      return;
    }
    if (added.length === 0) {
      setFormError("Syötä ainakin yksi luku.");
      formRef.current?.querySelector("input")?.focus();
      return;
    }
    onAdd(added);
  };

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={submit}
      noValidate
      aria-label={`Lisää luvut: ${title}`}
    >
      <div className={styles.fields}>
        {inputs.map((id, i) => {
          const info = figuresById.get(id);
          if (!info) return null;
          const error = errors[id];
          return (
            <div key={id} className={styles.field}>
              <label htmlFor={fieldId(id)}>{displayName(info)}</label>
              <span className={styles.valueField}>
                <input
                  // Käyttäjä avasi lomakkeen juuri, joten ensimmäinen kenttä saa kohdistuksen.
                  autoFocus={i === 0}
                  id={fieldId(id)}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${fieldId(id)}-virhe` : undefined}
                  value={values[id] ?? ""}
                  onChange={(e) => {
                    setValues({ ...values, [id]: e.target.value });
                    setFormError(null);
                  }}
                />
                <span className={styles.unit}>{unitLabel(info.unit, currency)}</span>
              </span>
              {error && (
                <span id={`${fieldId(id)}-virhe`} className={styles.error}>
                  {error}
                </span>
              )}
            </div>
          );
        })}
        <div className={styles.field}>
          <label htmlFor={`${baseId}-kausi`}>Kausi</label>
          <PeriodSelect id={`${baseId}-kausi`} value={period} onChange={setPeriod} />
        </div>
      </div>
      {formError && (
        <p className={styles.error} role="alert">
          {formError}
        </p>
      )}
      <div className={styles.buttons}>
        <button type="submit" className={styles.primaryButton}>
          Lisää
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Peruuta
        </button>
      </div>
    </form>
  );
}
