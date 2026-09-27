// Tekoälyhaku (suunnitelman kohdat 11.2 ja 11.3): liitetty teksti lähetetään Clauden
// Messages API:in käyttäjän omalla avaimella suoraan selaimesta, ja vastaus tarkistetaan.
//
// Kutsu on yhden funktion takana. Myöhemmin sen voi vaihtaa kutsumaan omaa taustapalvelua,
// jolloin avaimen kenttä poistuu eikä muuta sovellusta tarvitse muuttaa.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { loadApiKey, loadModel, type ModelOption } from "./apiKey.ts";
import { buildSystemPrompt, buildUserMessage } from "./prompt.ts";
import { extractionSchema } from "./schema.ts";
import { verifyExtraction, type VerifiedExtraction } from "./verify.ts";
import { ExtractionError, extractionError, MAX_TEXT_LENGTH } from "./errors.ts";

/** Palvelinpuolen varamalli, jos malli kieltäytyy pyynnöstä (Opus 5.5). */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Rajapinnan virheviesti vastauksen rungosta, esim. "Your credit balance is too low…". */
function apiMessage(error: InstanceType<typeof Anthropic.APIError>): string {
  const body = error.error as { error?: { message?: unknown } } | undefined;
  const message = body?.error?.message;
  return typeof message === "string" && message.trim() ? message.trim() : error.message;
}

/** Kirjaston virheluokka käyttäjän viestiksi. Tunnistus luokasta, ei viestin tekstistä. */
function toExtractionError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) return error;
  if (error instanceof Anthropic.APIUserAbortError) return extractionError("keskeytetty");
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  )
    return extractionError("avain");
  if (error instanceof Anthropic.RateLimitError) return extractionError("liikaa-pyyntoja");
  if (error instanceof Anthropic.APIConnectionTimeoutError) return extractionError("ruuhka");
  if (error instanceof Anthropic.APIConnectionError) return extractionError("verkko");
  if (error instanceof Anthropic.InternalServerError) return extractionError("ruuhka");
  if (error instanceof Anthropic.APIError) {
    return new ExtractionError(
      "hylatty",
      `Pyyntö hylättiin: ${apiMessage(error)} Jos saldo on lopussa, tarkista se Anthropic Consolesta.`,
    );
  }
  return extractionError("kasittely");
}

export interface ExtractOptions {
  apiKey?: string | null;
  model?: ModelOption;
}

/**
 * Poimii liitetystä tekstistä tunnusluvut ja tarkistaa ne. Heittää ExtractionErrorin, jonka
 * viestin voi näyttää käyttäjälle.
 */
export async function extractFigures(
  text: string,
  signal?: AbortSignal,
  options: ExtractOptions = {},
): Promise<VerifiedExtraction> {
  const apiKey = options.apiKey === undefined ? loadApiKey() : options.apiKey;
  if (!apiKey) throw extractionError("ei-avainta");
  if (text.length > MAX_TEXT_LENGTH) throw extractionError("liian-pitka");
  const model = options.model ?? loadModel();

  const client = new Anthropic({
    apiKey,
    // Avain on käyttäjän oma, ja se on tallennettu vain hänen selaimeensa (kohta 11.3).
    dangerouslyAllowBrowser: true,
    timeout: 120_000,
    // Ruuhkan (429, 5xx, 529) ja verkkovirheen jälkeen kirjasto yrittää itse kahdesti uudelleen.
    maxRetries: 2,
  });

  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await client.beta.messages.create(
      {
        model: model.id,
        max_tokens: 16_000,
        system: [
          // Kehote on sama joka kerta, joten se tallennetaan välimuistiin.
          { type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } },
        ],
        messages: [{ role: "user", content: buildUserMessage(text) }],
        output_config: {
          format: betaZodOutputFormat(extractionSchema),
          ...(model.effort ? { effort: "low" as const } : {}),
        },
        ...(model.fallbacks ? { betas: [FALLBACK_BETA], fallbacks: "default" as const } : {}),
      },
      { signal },
    );
  } catch (error) {
    throw toExtractionError(error);
  }

  if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens")
    throw extractionError("kasittely");
  const json = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  let parsed;
  try {
    parsed = extractionSchema.safeParse(JSON.parse(json));
  } catch {
    throw extractionError("kasittely");
  }
  if (!parsed.success) throw extractionError("kasittely");

  const result = verifyExtraction(parsed.data, text);
  if (result.values.length === 0) throw extractionError("ei-lukuja");
  return result;
}
