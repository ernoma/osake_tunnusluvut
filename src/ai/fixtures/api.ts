// Testien valerajapinta: korvaa selaimen fetchin valmiilla vastauksilla, joten testit eivät
// kutsu oikeaa rajapintaa (suunnitelman kohta 11.9).

import { vi } from "vitest";

export interface ApiCall {
  url: string;
  headers: Headers;
  body: Record<string, unknown>;
}

/** Vastaus luodaan jokaiselle pyynnölle erikseen, koska vastauksen rungon voi lukea vain kerran. */
export type MakeResponse = () => Response;

type Reply = MakeResponse | Error | "odota";

function json(status: number, body: unknown, headers: Record<string, string> = {}): MakeResponse {
  return () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
}

/** Onnistunut vastaus, jonka tekstinä on JSON-muotoinen poiminta. */
export function messageReply(result: unknown, stopReason = "end_turn"): MakeResponse {
  return json(200, {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result) }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  });
}

/** Virhevastaus rajapinnan muodossa. retry-after-ms nopeuttaa kirjaston uusintayrityksiä. */
export function errorReply(status: number, message = "Virhe"): MakeResponse {
  return json(
    status,
    { type: "error", error: { type: "api_error", message } },
    { "retry-after-ms": "1" },
  );
}

/**
 * Korvaa fetchin. Vastaukset annetaan järjestyksessä, ja viimeistä käytetään loppuun asti.
 * Error hylkää pyynnön (verkkovirhe), ja "odota" jää odottamaan, kunnes pyyntö keskeytetään.
 */
export function stubApi(...replies: Reply[]): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request, init: RequestInit = {}) => {
      calls.push({
        url: String(url),
        headers: new Headers(init.headers),
        body: JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>,
      });
      const reply = replies[Math.min(calls.length, replies.length) - 1];
      if (reply === "odota") {
        return new Promise<Response>((_, reject) => {
          const abort = () => reject(new DOMException("Keskeytetty", "AbortError"));
          if (init.signal?.aborted) abort();
          init.signal?.addEventListener("abort", abort);
        });
      }
      if (reply instanceof Error) throw reply;
      return (reply ?? errorReply(500))();
    }),
  );
  return calls;
}
