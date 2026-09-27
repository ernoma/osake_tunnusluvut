// Käyttäjän oma Claude API -avain ja mallin valinta selaimen muistissa (suunnitelman kohta 11.3).
// Avain ei koskaan päädy osoitteeseen, jakolinkkiin, viimeisimpien listaan eikä virheilmoituksiin.
// Jos tallennus ei ole käytettävissä (esim. yksityinen ikkuna), avain toimii tämän käynnin ajan.

export const API_KEY_STORAGE_KEY = "tunnusluvut.api-avain";
export const MODEL_STORAGE_KEY = "tunnusluvut.malli";

/**
 * Valittavat mallit. Tunnukset ovat tässä yhdessä paikassa, jotta ne on helppo päivittää.
 * effort = lähetetäänkö ajattelutaso (Haiku 4.5 ei hyväksy sitä), fallbacks = käytetäänkö
 * palvelinpuolen varamallia, jos malli kieltäytyy pyynnöstä.
 */
export const MODELS = [
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    description: "tarkin (oletus)",
    effort: true,
    fallbacks: true,
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    description: "halvempi",
    effort: true,
    fallbacks: false,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    description: "halvin",
    effort: false,
    fallbacks: false,
  },
] as const;

export type ModelOption = (typeof MODELS)[number];
export type ModelId = ModelOption["id"];

export const DEFAULT_MODEL: ModelId = "claude-opus-5-5";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Tallennus ei onnistu. Avain ja valinta toimivat tämän käynnin ajan.
  }
}

// Tallennuksen puuttuessa avain pidetään muistissa, jotta haku toimii silti.
let sessionKey: string | null = null;

/** Tallennettu avain tai null. */
export function loadApiKey(): string | null {
  const stored = read(API_KEY_STORAGE_KEY)?.trim();
  return stored || sessionKey;
}

export function saveApiKey(key: string): void {
  sessionKey = key.trim();
  write(API_KEY_STORAGE_KEY, sessionKey);
}

export function removeApiKey(): void {
  sessionKey = null;
  write(API_KEY_STORAGE_KEY, null);
}

/** Näyttää avaimesta vain alun ja lopun: "sk-ant-…4f2a". */
export function maskApiKey(key: string): string {
  return key.length <= 12 ? "…" : `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function loadModel(): ModelOption {
  const stored = read(MODEL_STORAGE_KEY);
  return MODELS.find((m) => m.id === stored) ?? modelById(DEFAULT_MODEL);
}

export function saveModel(id: ModelId): void {
  write(MODEL_STORAGE_KEY, id);
}

export function modelById(id: ModelId): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
