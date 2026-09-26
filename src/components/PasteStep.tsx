// Sivun ensimmäinen vaihe (suunnitelman kohdat 11.1–11.3): liitetty teksti, API-avain ja
// tekoälyhaku. "Syötä luvut itse" ohittaa haun, joten sivu toimii kokonaan ilman avainta.

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  loadApiKey,
  loadModel,
  modelById,
  removeApiKey,
  saveApiKey,
  saveModel,
  type ModelId,
} from "../ai/apiKey.ts";
import { ExtractionError, extractionError, MAX_TEXT_LENGTH } from "../ai/errors.ts";
import type { VerifiedExtraction } from "../ai/verify.ts";
import ApiKeyField, { API_KEY_INPUT_ID } from "./ApiKeyField.tsx";
import styles from "./PasteStep.module.css";

export const START_HEADING_ID = "tutki-aloita";
export const PASTE_TEXT_ID = "liitetty-teksti";

interface Props {
  text: string;
  onTextChange: (text: string) => void;
  onExtracted: (result: VerifiedExtraction) => void;
  onEnterManually: () => void;
  /** Viimeisimmät analyysit kentän alla. */
  children?: ReactNode;
}

const numberFormat = new Intl.NumberFormat("fi-FI");

export default function PasteStep({
  text,
  onTextChange,
  onExtracted,
  onEnterManually,
  children,
}: Props) {
  const [savedKey, setSavedKey] = useState(loadApiKey);
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [model, setModel] = useState<ModelId>(() => loadModel().id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ExtractionError | null>(null);
  const [status, setStatus] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const hintId = useId();
  const lengthErrorId = useId();

  // Sivulta poistuttaessa kesken jäänyt haku keskeytetään.
  useEffect(() => () => abortRef.current?.abort(), []);

  const tooLong = text.length > MAX_TEXT_LENGTH;
  const keyInputShown = savedKey === null || editingKey;

  const showError = (next: ExtractionError, focusId?: string) => {
    setError(next);
    setStatus("");
    if (focusId) document.getElementById(focusId)?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!text.trim()) {
      showError(new ExtractionError("ei-lukuja", "Liitä ensin teksti kenttään."), PASTE_TEXT_ID);
      return;
    }
    if (tooLong) {
      document.getElementById(PASTE_TEXT_ID)?.focus();
      return;
    }
    let apiKey = savedKey;
    if (keyInputShown) {
      const draft = keyDraft.trim();
      if (draft) {
        saveApiKey(draft);
        setSavedKey(draft);
        setEditingKey(false);
        setKeyDraft("");
        apiKey = draft;
      } else if (savedKey === null) {
        showError(new ExtractionError("ei-avainta", "Anna ensin API-avain."), API_KEY_INPUT_ID);
        return;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setStatus("Tekoäly lukee tekstiä, yleensä 5–20 sekuntia.");
    try {
      // Rajapinnan kirjasto ladataan vasta nyt, jotta sivu aukeaa nopeasti ilman sitä.
      const { extractFigures } = await import("../ai/extract.ts");
      const result = await extractFigures(text, controller.signal, {
        apiKey,
        model: modelById(model),
      });
      setStatus("");
      onExtracted(result);
    } catch (err) {
      // extractFigures heittää vain ExtractionErroreita. Muu virhe on kirjaston latauksen virhe.
      const failure = err instanceof ExtractionError ? err : extractionError("verkko");
      if (failure.kind === "keskeytetty") {
        setStatus(failure.message);
      } else {
        showError(failure);
        // Hylätty avain: kenttä avautuu, jotta avaimen voi korjata.
        if (failure.kind === "avain") setEditingKey(true);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const changeModel = (next: ModelId) => {
    setModel(next);
    saveModel(next);
  };

  const removeKey = () => {
    removeApiKey();
    setSavedKey(null);
    setEditingKey(false);
    setKeyDraft("");
    setStatus("API-avain poistettiin tästä selaimesta.");
  };

  return (
    <>
      <section className={styles.step} aria-labelledby={START_HEADING_ID}>
        <h2 id={START_HEADING_ID} tabIndex={-1} className={styles.stepHeading}>
          Aloita
        </h2>
        <form className={styles.form} onSubmit={submit} noValidate>
          <label htmlFor={PASTE_TEXT_ID} className={styles.label}>
            Liitä teksti, jossa on yhtiön tunnuslukuja
          </label>
          <p id={hintId} className={styles.hint}>
            Valitse sivulta tunnuslukuosio, esimerkiksi Nordnetista, Inderesistä, Kauppalehdestä tai
            tilinpäätöksestä, kopioi se (Ctrl+C) ja liitä tähän (Ctrl+V). Tekoäly poimii luvut, ja
            tarkistat ne ennen analyysia.
          </p>
          <textarea
            id={PASTE_TEXT_ID}
            className={styles.textarea}
            rows={10}
            spellCheck={false}
            aria-describedby={tooLong ? `${hintId} ${lengthErrorId}` : hintId}
            aria-invalid={tooLong ? true : undefined}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
          />
          {tooLong && (
            <p id={lengthErrorId} className={styles.error}>
              Teksti on liian pitkä: {numberFormat.format(text.length)} merkkiä, kun enintään{" "}
              {numberFormat.format(MAX_TEXT_LENGTH)} mahtuu. Valitse sivulta vain tunnuslukuosio.
            </p>
          )}

          <ApiKeyField
            savedKey={savedKey}
            editing={editingKey}
            draft={keyDraft}
            onDraftChange={setKeyDraft}
            onEdit={() => setEditingKey(true)}
            onCancelEdit={() => {
              setEditingKey(false);
              setKeyDraft("");
            }}
            onRemove={removeKey}
            model={model}
            onModelChange={changeModel}
          />

          <div className={styles.actions}>
            {/* Painike pysyy kohdistettavana haun aikana. Toinen painallus ei aloita uutta hakua. */}
            <button type="submit" className={styles.primaryButton} aria-disabled={loading}>
              Anna tekoälyn poimia luvut
            </button>
            {loading && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => abortRef.current?.abort()}
              >
                Keskeytä
              </button>
            )}
          </div>

          <div aria-live="polite" className={styles.status}>
            {loading && <span className={styles.spinner} aria-hidden="true" />}
            {status}
          </div>
          {error && (
            <div role="alert" className={styles.errorBox}>
              <p className={styles.error}>{error.message}</p>
              {error.kind === "ei-lukuja" && text.trim() !== "" && (
                <button type="button" className={styles.linkButton} onClick={onEnterManually}>
                  Syötä luvut itse
                </button>
              )}
            </div>
          )}
        </form>

        <div className={styles.manual}>
          <p>
            Ilman API-avainta voit syöttää luvut itse, esimerkiksi pankin sovelluksesta tai
            tilinpäätöksestä. Sovellus laskee puuttuvat tunnusluvut, jos lähtötiedot riittävät.
          </p>
          <button type="button" className={styles.secondaryButton} onClick={onEnterManually}>
            Syötä luvut itse
          </button>
        </div>
      </section>
      {children}
    </>
  );
}
