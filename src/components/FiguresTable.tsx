// Lukujen tarkistus, korjaus ja lisäys (suunnitelman kohdat 11.1 ja 11.6). Jokainen muutos
// päivittää analyysin heti. Syötetty tai korjattu arvo merkitään "Syötetty".

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { displayName, figuresById, type FigureInfo } from "../data/content.ts";
import { parseFigureValue, searchFigures } from "../data/figureEntry.ts";
import { PERIODS, type Period } from "../data/formulas.ts";
import { formatForInput, formatNumber, unitLabel } from "../data/numberFormat.ts";
import type { AnalysisFigure } from "../hooks/useAnalysisUrl.ts";
import styles from "./FiguresTable.module.css";

export const ADD_FIGURE_SEARCH_ID = "lisaa-luku-haku";

const PERIOD_LABELS: Record<Period, string> = {
  toteutunut: "Toteutunut",
  ttm: "12 kk (TTM)",
  ennuste: "Ennuste",
};

const ORIGIN_LABELS: Record<AnalysisFigure["origin"], string> = {
  sivu: "Sivulta",
  kayttaja: "Syötetty",
};

export interface CalculatedFigure {
  id: string;
  value: number;
}

interface Props {
  figures: AnalysisFigure[];
  currency: string;
  /** Omista luvuista lasketut, jotka eivät ole taulukossa. */
  calculated: CalculatedFigure[];
  onChange: (figures: AnalysisFigure[]) => void;
  /** "Lisää luku" on auki heti, esimerkiksi kun käyttäjä aloittaa tyhjästä. */
  initiallyAdding?: boolean;
}

export default function FiguresTable({
  figures,
  currency,
  calculated,
  onChange,
  initiallyAdding = false,
}: Props) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(initiallyAdding);
  const [announcement, setAnnouncement] = useState("");
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const contentId = useId();

  const update = (id: string, change: Partial<AnalysisFigure>) =>
    onChange(figures.map((f) => (f.id === id ? { ...f, ...change } : f)));

  const remove = (figure: AnalysisFigure) => {
    onChange(figures.filter((f) => f.id !== figure.id));
    setAnnouncement(`Poistettu: ${nameOf(figure.id)}.`);
    addButtonRef.current?.focus();
  };

  const add = (figure: AnalysisFigure) => {
    onChange([...figures, figure]);
    setAnnouncement(`Lisätty: ${nameOf(figure.id)}.`);
  };

  // Paneeli poistuu, joten kohdistus siirretään sen avanneeseen painikkeeseen.
  const focusAddButton = useRef(false);
  useEffect(() => {
    if (!focusAddButton.current || adding) return;
    focusAddButton.current = false;
    addButtonRef.current?.focus();
  });

  const closeAdding = () => {
    focusAddButton.current = true;
    setAdding(false);
  };

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionHead}>
        <h2 id={headingId} className={styles.heading}>
          Luvut
        </h2>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen(!open)}
        >
          {open ? "Pienennä" : `Näytä luvut (${figures.length})`}
        </button>
      </div>

      <div id={contentId} className={styles.content} hidden={!open}>
        {figures.length === 0 ? (
          <p className={styles.empty}>
            Lukuja ei ole vielä. Lisää yhtiön luvut, esimerkiksi kurssi, tulos ja oma pääoma.
            Sovellus laskee niistä muut tunnusluvut.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="visually-hidden">Syötetyt luvut</caption>
              <thead>
                <tr>
                  <th scope="col">Luku</th>
                  <th scope="col">Arvo</th>
                  <th scope="col">Kausi</th>
                  <th scope="col">Vuosi</th>
                  <th scope="col">Lähde</th>
                  <th scope="col">
                    <span className="visually-hidden">Toiminnot</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {figures.map((f) => (
                  <FigureRow
                    key={f.id}
                    figure={f}
                    currency={currency}
                    onChange={(change) => update(f.id, change)}
                    onRemove={() => remove(f)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adding ? (
          <AddFigure
            exclude={new Set(figures.map((f) => f.id))}
            currency={currency}
            onAdd={add}
            onClose={closeAdding}
          />
        ) : (
          <button
            ref={addButtonRef}
            type="button"
            className={styles.addButton}
            onClick={() => setAdding(true)}
          >
            + Lisää luku
          </button>
        )}

        {calculated.length > 0 && (
          <div className={styles.calculated}>
            <h3 className={styles.subheading}>Omista luvuista lasketut</h3>
            <ul className={styles.calculatedList}>
              {calculated.map((c) => {
                const info = figuresById.get(c.id);
                if (!info) return null;
                return (
                  <li key={c.id}>
                    <span>{displayName(info)}</span>{" "}
                    <strong>{formatNumber(c.value, info.unit, currency)}</strong>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

function nameOf(id: string): string {
  const info = figuresById.get(id);
  return info ? displayName(info) : id;
}

interface RowProps {
  figure: AnalysisFigure;
  currency: string;
  onChange: (change: Partial<AnalysisFigure>) => void;
  onRemove: () => void;
}

function FigureRow({ figure, currency, onChange, onRemove }: RowProps) {
  const info = figuresById.get(figure.id);
  const [draft, setDraft] = useState(() => formatForInput(figure.value));
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(figure.year);
  const errorId = useId();
  const hintId = useId();
  if (!info) return null;
  const name = displayName(info);

  const commitValue = () => {
    const result = parseFigureValue(draft, info.unit);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    if (result.value !== figure.value) onChange({ value: result.value, origin: "kayttaja" });
  };

  const onEnter = (commit: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };

  // Suuri määrä lyhennettynä ("1,2 mrd. €") helpottaa nollien laskemista.
  const showHint = Math.abs(figure.value) >= 1e6;

  const commitYear = () => {
    if (year.trim() !== figure.year) onChange({ year: year.trim() });
  };

  return (
    <tr>
      <th scope="row" className={styles.name}>
        {name}
      </th>
      <td data-label="Arvo">
        <span className={styles.valueField}>
          <input
            className={styles.input}
            aria-label={`${name}, arvo`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : showHint ? hintId : undefined}
            inputMode="decimal"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitValue}
            onKeyDown={onEnter(commitValue)}
          />
          <span className={styles.unit}>{unitLabel(info.unit, currency)}</span>
        </span>
        {error ? (
          <span id={errorId} className={styles.error}>
            {error}
          </span>
        ) : (
          showHint && (
            <span id={hintId} className={styles.hint}>
              {formatNumber(figure.value, info.unit, currency)}
            </span>
          )
        )}
      </td>
      <td data-label="Kausi">
        <PeriodSelect
          label={`${name}, kausi`}
          value={figure.period}
          onChange={(period) => onChange({ period })}
        />
      </td>
      <td data-label="Vuosi">
        <input
          className={`${styles.input} ${styles.yearInput}`}
          aria-label={`${name}, vuosi`}
          placeholder="esim. 2025"
          autoComplete="off"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          onBlur={commitYear}
          onKeyDown={onEnter(commitYear)}
        />
      </td>
      <td data-label="Lähde">{ORIGIN_LABELS[figure.origin]}</td>
      <td>
        <button
          type="button"
          className={styles.removeButton}
          aria-label={`Poista ${name}`}
          onClick={onRemove}
        >
          Poista
        </button>
      </td>
    </tr>
  );
}

function PeriodSelect({
  label,
  id,
  value,
  onChange,
}: {
  label?: string;
  id?: string;
  value: Period | undefined;
  onChange: (period: Period | undefined) => void;
}) {
  return (
    <select
      id={id}
      className={styles.select}
      aria-label={label}
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          (PERIODS as readonly string[]).includes(e.target.value)
            ? (e.target.value as Period)
            : undefined,
        )
      }
    >
      {PERIODS.map((p) => (
        <option key={p} value={p}>
          {PERIOD_LABELS[p]}
        </option>
      ))}
      <option value="">Ei tiedossa</option>
    </select>
  );
}

interface AddProps {
  exclude: ReadonlySet<string>;
  currency: string;
  onAdd: (figure: AnalysisFigure) => void;
  onClose: () => void;
}

/** Haettava lista tunnusluvuista ja lähtötiedoista sekä valitun luvun arvon syöttö. */
function AddFigure({ exclude, currency, onAdd, onClose }: AddProps) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<FigureInfo | null>(null);
  const [value, setValue] = useState("");
  const [period, setPeriod] = useState<Period | undefined>("toteutunut");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const valueId = useId();
  const periodId = useId();
  const yearId = useId();
  const errorId = useId();
  const options = searchFigures(query, exclude);

  const choose = (figure: FigureInfo) => {
    setChosen(figure);
    setValue("");
    setError(null);
  };

  // Kentät vaihtuvat haun ja arvon syötön välillä, joten kohdistus siirretään uuteen kenttään
  // (autoFocus). Näin näppäimistön käyttäjä voi syöttää monta lukua peräkkäin.
  const backToSearch = () => setChosen(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!chosen) return;
    const result = parseFigureValue(value, chosen.unit);
    if ("error" in result) {
      setError(result.error);
      valueRef.current?.focus();
      return;
    }
    onAdd({ id: chosen.id, value: result.value, period, year: year.trim(), origin: "kayttaja" });
    setQuery("");
    backToSearch();
  };

  return (
    <div className={styles.addPanel} role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.subheading}>
        Lisää luku
      </h3>

      {chosen ? (
        <form className={styles.addForm} onSubmit={submit} noValidate>
          <p className={styles.chosen}>
            <strong>{displayName(chosen)}</strong>{" "}
            <button type="button" className={styles.linkButton} onClick={backToSearch}>
              Vaihda lukua
            </button>
          </p>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor={valueId}>Arvo</label>
              <span className={styles.valueField}>
                <input
                  ref={valueRef}
                  // Käyttäjä valitsi juuri luvun, joten arvon kenttä saa kohdistuksen.
                  autoFocus
                  id={valueId}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <span className={styles.unit}>{unitLabel(chosen.unit, currency)}</span>
              </span>
            </div>
            <div className={styles.field}>
              <label htmlFor={periodId}>Kausi</label>
              <PeriodSelect id={periodId} value={period} onChange={setPeriod} />
            </div>
            <div className={styles.field}>
              <label htmlFor={yearId}>Vuosi</label>
              <input
                id={yearId}
                className={`${styles.input} ${styles.yearInput}`}
                placeholder="esim. 2025"
                autoComplete="off"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.primaryButton}>
              Lisää
            </button>
          </div>
          {error && (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          )}
          <p className={styles.hint}>Kirjoita esimerkiksi 1 234,5, 150 milj., 1,2 mrd tai 12 %.</p>
        </form>
      ) : (
        <>
          <label htmlFor={ADD_FIGURE_SEARCH_ID} className={styles.searchLabel}>
            Hae lukua nimellä tai lyhenteellä
          </label>
          <input
            // Paneeli avautuu käyttäjän pyynnöstä, joten haku saa kohdistuksen.
            autoFocus
            id={ADD_FIGURE_SEARCH_ID}
            type="search"
            className={styles.input}
            placeholder="esim. kurssi, P/E tai oma pääoma"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              const first = options[0];
              if (e.key === "Enter" && first) {
                e.preventDefault();
                choose(first);
              }
            }}
          />
          <p className="visually-hidden" aria-live="polite">
            {options.length === 0 ? "Ei osumia" : `${options.length} lukua`}
          </p>
          {options.length === 0 ? (
            <p className={styles.empty}>Ei osumia. Kokeile toista nimeä tai lyhennettä.</p>
          ) : (
            <ul className={styles.options} aria-label="Luvut">
              {options.map((o) => (
                <li key={o.id}>
                  <button type="button" className={styles.option} onClick={() => choose(o)}>
                    <span>{displayName(o)}</span>
                    <span className={styles.kind}>
                      {o.kind === "tunnusluku" ? "Tunnusluku" : "Lähtötieto"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <button type="button" className={styles.secondaryButton} onClick={onClose}>
        Valmis
      </button>
    </div>
  );
}
