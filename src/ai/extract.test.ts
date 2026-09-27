import { afterEach, describe, expect, it, vi } from "vitest";
import { loadModel, modelById, MODEL_STORAGE_KEY } from "./apiKey.ts";
import { ExtractionError, MAX_TEXT_LENGTH } from "./errors.ts";
import { extractFigures } from "./extract.ts";
import { errorReply, messageReply, stubApi } from "./fixtures/api.ts";
import { nordnet } from "./fixtures/nordnet.ts";

const KEY = "sk-ant-testi-1234567890abcdef";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function failure(promise: Promise<unknown>): Promise<ExtractionError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ExtractionError);
  return error as ExtractionError;
}

describe("extractFigures", () => {
  it("lähettää kehotteen, skeeman ja avaimen ja palauttaa tarkistetut luvut", async () => {
    const calls = stubApi(messageReply(nordnet.response));
    const result = await extractFigures(nordnet.text, undefined, { apiKey: KEY });

    expect(result.values.map((v) => v.id)).toContain("pe");
    expect(result.rejected.map((r) => r.id)).toEqual(["beta"]);

    const [call] = calls;
    expect(call?.url).toContain("/v1/messages");
    expect(call?.headers.get("x-api-key")).toBe(KEY);
    expect(call?.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(call?.body).toMatchObject({
      model: "claude-opus-5-5",
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema" } },
    });
    const messages = call?.body.messages as { content: string }[];
    expect(messages[0]?.content).toContain(nordnet.text);
    const system = JSON.stringify(call?.body.system);
    // Kehote on koottu tunnusluvuista ja lähtötiedoista.
    expect(system).toContain("- pe: P/E-luku");
    expect(system).toContain("- kurssi: Osakkeen kurssi");
  });

  it("poistunut malli (Opus 5) vaihtuu selaimessa oletusmalliin", async () => {
    window.localStorage.setItem(MODEL_STORAGE_KEY, "claude-opus-5");
    expect(loadModel().id).toBe("claude-opus-5-5");
    const calls = stubApi(messageReply(nordnet.response));
    await extractFigures(nordnet.text, undefined, { apiKey: KEY });
    expect(calls[0]?.body.model).toBe("claude-opus-5-5");
  });

  it("Haiku 4.5:lle ei lähetetä ajattelutasoa eikä varamallia", async () => {
    const calls = stubApi(messageReply(nordnet.response));
    await extractFigures(nordnet.text, undefined, {
      apiKey: KEY,
      model: modelById("claude-haiku-4-5"),
    });
    const body = calls[0]?.body ?? {};
    expect(body.model).toBe("claude-haiku-4-5");
    expect(body.fallbacks).toBeUndefined();
    expect(body.output_config).not.toHaveProperty("effort");
  });

  it("ilman avainta ja liian pitkällä tekstillä ei kutsuta rajapintaa", async () => {
    const calls = stubApi(messageReply(nordnet.response));
    expect((await failure(extractFigures("P/E 12", undefined, { apiKey: null }))).kind).toBe(
      "ei-avainta",
    );
    const long = "x".repeat(MAX_TEXT_LENGTH + 1);
    expect((await failure(extractFigures(long, undefined, { apiKey: KEY }))).kind).toBe(
      "liian-pitka",
    );
    expect(calls).toHaveLength(0);
  });

  it.each([
    [401, "avain", "API-avain ei kelpaa. Tarkista avain."],
    [429, "liikaa-pyyntoja", "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen."],
    [529, "ruuhka", "Palvelu on ruuhkautunut. Yritä uudelleen."],
    [500, "ruuhka", "Palvelu on ruuhkautunut. Yritä uudelleen."],
  ] as const)("HTTP %i: %s", async (status, kind, message) => {
    const calls = stubApi(errorReply(status));
    const error = await failure(extractFigures(nordnet.text, undefined, { apiKey: KEY }));
    expect(error.kind).toBe(kind);
    expect(error.message).toBe(message);
    // Ruuhkassa kirjasto yrittää kahdesti uudelleen, väärällä avaimella ei.
    expect(calls).toHaveLength(status === 401 ? 1 : 3);
  });

  it("hylätyn pyynnön syy näytetään, mutta avainta ei koskaan", async () => {
    stubApi(errorReply(400, "Your credit balance is too low."));
    const error = await failure(extractFigures(nordnet.text, undefined, { apiKey: KEY }));
    expect(error.kind).toBe("hylatty");
    expect(error.message).toContain("Pyyntö hylättiin: Your credit balance is too low.");
    expect(error.message).toContain("Anthropic Consolesta");
    expect(error.message).not.toContain(KEY);
  });

  it("verkkovirhe", { timeout: 15_000 }, async () => {
    stubApi(new TypeError("Failed to fetch"));
    const error = await failure(extractFigures(nordnet.text, undefined, { apiKey: KEY }));
    expect(error.kind).toBe("verkko");
  });

  it.each(["refusal", "max_tokens"])("stop_reason %s", async (stopReason) => {
    stubApi(messageReply(nordnet.response, stopReason));
    const error = await failure(extractFigures(nordnet.text, undefined, { apiKey: KEY }));
    expect(error.kind).toBe("kasittely");
  });

  it("vastaus, joka ei ole skeeman mukainen", async () => {
    stubApi(messageReply('{"values": "ei lista"}'));
    expect((await failure(extractFigures("P/E 12", undefined, { apiKey: KEY }))).kind).toBe(
      "kasittely",
    );
  });

  it("ei yhtään lukua", async () => {
    stubApi(messageReply({ ...nordnet.response, values: [] }));
    const error = await failure(extractFigures(nordnet.text, undefined, { apiKey: KEY }));
    expect(error.kind).toBe("ei-lukuja");
    expect(error.message).toBe(
      "Tekstistä ei löytynyt tunnuslukuja. Kopioitko sivun tunnuslukuosion?",
    );
  });

  it("keskeytys", async () => {
    stubApi("odota");
    const controller = new AbortController();
    const promise = extractFigures(nordnet.text, controller.signal, { apiKey: KEY });
    controller.abort();
    expect((await failure(promise)).kind).toBe("keskeytetty");
  });
});
