// Valuuttakurssin haun tila (suunnitelman kohta 11.10). Kurssi haetaan vain, kun sitä
// tarvitaan, ja vanha haku keskeytetään, kun valuutta tai päivä vaihtuu.

import { useEffect, useState } from "react";
import {
  fetchEurRate,
  RateError,
  type EurRate,
  type RateErrorReason,
} from "../data/exchangeRates.ts";
import { today } from "./useAnalysisUrl.ts";

export type EurRateState =
  | { status: "ei-tarvita" }
  | { status: "haetaan" }
  | { status: "valmis"; rate: EurRate }
  | { status: "virhe"; reason: RateErrorReason };

type Settled = Extract<EurRateState, { status: "valmis" | "virhe" }>;

/** Kurssi euroon analyysin hakupäivältä. `needed` on false, kun kurssia ei käytetä. */
export function useEurRate(currency: string, date: string, needed: boolean): EurRateState {
  const key = needed && currency !== "EUR" ? `${date}:${currency}` : null;
  // Tulos muistetaan pyynnön avaimella, jotta vanha tulos ei näy uuden haun aikana.
  const [settled, setSettled] = useState<{ key: string; state: Settled } | null>(null);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    fetchEurRate(currency, date, { today: today(), signal: controller.signal }).then(
      (rate) => setSettled({ key, state: { status: "valmis", rate } }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const reason = error instanceof RateError ? error.reason : "vastaus";
        setSettled({ key, state: { status: "virhe", reason } });
      },
    );
    return () => controller.abort();
  }, [key, currency, date]);

  if (key === null) return { status: "ei-tarvita" };
  return settled?.key === key ? settled.state : { status: "haetaan" };
}
