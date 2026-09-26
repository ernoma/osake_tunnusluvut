// API-avaimen kenttä ja ohje (suunnitelman kohta 11.3). Avain tallennetaan vain tähän
// selaimeen, ja sen voi poistaa. Kenttä näytetään, jos avainta ei ole tai käyttäjä vaihtaa sitä.

import { useId, useState } from "react";
import { maskApiKey, MODELS, type ModelId } from "../ai/apiKey.ts";
import styles from "./PasteStep.module.css";

export const API_KEY_INPUT_ID = "api-avain";

interface Props {
  /** Tallennettu avain tai null. */
  savedKey: string | null;
  /** Näytetäänkö avaimen kenttä, vaikka avain on tallennettu (vaihto tai hylätty avain). */
  editing: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
}

export default function ApiKeyField({
  savedKey,
  editing,
  draft,
  onDraftChange,
  onEdit,
  onCancelEdit,
  onRemove,
  model,
  onModelChange,
}: Props) {
  const [visible, setVisible] = useState(false);
  const helpId = useId();
  const modelId = useId();
  const modelHintId = useId();
  const showInput = savedKey === null || editing;

  return (
    <div className={styles.keyBox}>
      {showInput ? (
        <>
          <label htmlFor={API_KEY_INPUT_ID} className={styles.label}>
            Claude API -avain
          </label>
          <span className={styles.keyRow}>
            <input
              id={API_KEY_INPUT_ID}
              className={styles.keyInput}
              type={visible ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-…"
              aria-describedby={helpId}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
            />
            <button
              type="button"
              className={styles.linkButton}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? "Piilota avain" : "Näytä avain"}
            </button>
            {savedKey !== null && (
              <button type="button" className={styles.linkButton} onClick={onCancelEdit}>
                Peruuta
              </button>
            )}
          </span>
          <ul id={helpId} className={styles.help}>
            <li>
              Avaimen saat{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
              >
                Anthropic Consolesta
                <span className="visually-hidden"> (avautuu uuteen välilehteen)</span>
              </a>
              . Käyttö maksaa, ja hinta riippuu tekstin pituudesta ja mallista.
            </li>
            <li>Tee tätä sovellusta varten oma avain ja aseta sille kulukatto Consolessa.</li>
            <li>
              Avain tallentuu vain tähän selaimeen, ja kuka tahansa tällä koneella voi käyttää sitä.
              Älä tallenna avainta yhteiskäyttöiselle koneelle.
            </li>
            <li>Liitetty teksti lähetetään Anthropicille käsiteltäväksi.</li>
          </ul>
        </>
      ) : (
        <p className={styles.keySaved}>
          <span>
            API-avain on tallennettu tähän selaimeen (<code>{maskApiKey(savedKey)}</code>).
          </span>
          <button type="button" className={styles.linkButton} onClick={onEdit}>
            Vaihda avain
          </button>
          <button type="button" className={styles.linkButton} onClick={onRemove}>
            Poista avain tältä laitteelta
          </button>
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor={modelId}>Malli</label>
        <select
          id={modelId}
          className={styles.input}
          aria-describedby={modelHintId}
          value={model}
          onChange={(e) => onModelChange(e.target.value as ModelId)}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}, {m.description}
            </option>
          ))}
        </select>
      </div>
      <p id={modelHintId} className={styles.hint}>
        Halvempi malli riittää yleensä selkeään taulukkoon. Tarkista luvut aina itse.
      </p>
    </div>
  );
}
