// Valuuttakurssin haun tila (suunnitelman kohdat 11.10 ja 11.11). Kurssi haetaan vain, kun sitä
// tarvitaan, ja vanha haku keskeytetään, kun valuutat tai päivä vaihtuvat.

import { useEffect, useState } from "react";
import { fetchEurRate, RateError, type RateState } from "../data/exchangeRates.ts";
import { today } from "./useAnalysisUrl.ts";

export type EurRateState = { status: "ei-tarvita" } | RateState;

type Settled = Extract<RateState, { status: "valmis" | "virhe" }>;

/**
 * Kurssit euroon analyysin hakupäivältä jokaiselle valuutalle. Euroa ei haeta. Valuutta, jonka
 * haku on kesken, puuttuu palautetusta taulukosta tai on tilassa "haetaan".
 */
export function useEurRates(
  currencies: readonly string[],
  date: string,
): ReadonlyMap<string, RateState> {
  const wanted = [...new Set(currencies)].filter((c) => c !== "EUR").sort();
  const key = wanted.length > 0 ? `${date}:${wanted.join(",")}` : null;
  // Tulokset muistetaan pyynnön avaimella, jotta vanha tulos ei näy uuden haun aikana.
  const [settled, setSettled] = useState<{ key: string; states: Map<string, Settled> } | null>(
    null,
  );

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const states = new Map<string, Settled>();
    for (const currency of key.slice(key.indexOf(":") + 1).split(",")) {
      fetchEurRate(currency, date, { today: today(), signal: controller.signal }).then(
        (rate) => {
          states.set(currency, { status: "valmis", rate });
          setSettled({ key, states: new Map(states) });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const reason = error instanceof RateError ? error.reason : "vastaus";
          states.set(currency, { status: "virhe", reason });
          setSettled({ key, states: new Map(states) });
        },
      );
    }
    return () => controller.abort();
  }, [key, date]);

  const done = settled?.key === key ? settled.states : undefined;
  return new Map(wanted.map((c) => [c, done?.get(c) ?? { status: "haetaan" }]));
}

/** Kurssi euroon analyysin hakupäivältä. `needed` on false, kun kurssia ei käytetä. */
export function useEurRate(currency: string, date: string, needed: boolean): EurRateState {
  const states = useEurRates(needed ? [currency] : [], date);
  return states.get(currency) ?? { status: "ei-tarvita" };
}
