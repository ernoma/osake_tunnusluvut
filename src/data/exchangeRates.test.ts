import { describe, expect, it, vi } from "vitest";
import { fetchEurRate, RateError, rateDay, rateUrl, RATES_STORAGE_KEY } from "./exchangeRates.ts";

const TODAY = "2026-09-27";

/** Korvaa fetchin: palauttaa annetun vastauksen ja kirjaa osoitteet. */
function stubRates(reply: () => Response | Promise<Response>): string[] {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      return reply();
    }),
  );
  return urls;
}

const ok =
  (rates: Record<string, number>, date = "2026-09-25") =>
  () =>
    new Response(JSON.stringify({ amount: 1, base: "EUR", date, rates }), { status: 200 });

async function reason(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(RateError);
  return (error as RateError).reason;
}

describe("rateDay ja rateUrl", () => {
  it("käyttää hakupäivää tai viimeisintä kurssia", () => {
    expect(rateDay("2026-09-26", TODAY)).toBe("2026-09-26");
    expect(rateDay(TODAY, TODAY)).toBe(TODAY);
    expect(rateDay("2026-12-01", TODAY)).toBe("latest");
    expect(rateDay("", TODAY)).toBe("latest");
  });

  it("pyytää vain yhden valuutan euroon", () => {
    expect(rateUrl("DKK", "2026-09-26")).toBe(
      "https://api.frankfurter.dev/v1/2026-09-26?base=EUR&symbols=DKK",
    );
  });
});

describe("fetchEurRate", () => {
  it("palauttaa kurssin ja julkaisupäivän", async () => {
    const urls = stubRates(ok({ DKK: 7.4755 }));
    await expect(fetchEurRate("DKK", "2026-09-26", { today: TODAY })).resolves.toEqual({
      currency: "DKK",
      rate: 7.4755,
      date: "2026-09-25",
    });
    expect(urls).toEqual([rateUrl("DKK", "2026-09-26")]);
  });

  it("mennyttä päivää koskeva kurssi luetaan tallenteesta aina", async () => {
    const urls = stubRates(ok({ DKK: 7.4755 }));
    await fetchEurRate("DKK", "2026-09-26", { today: TODAY });
    await fetchEurRate("DKK", "2026-09-26", { today: "2027-01-01" });
    expect(urls).toHaveLength(1);
  });

  it("viimeisin kurssi kelpaa vain saman päivän", async () => {
    const urls = stubRates(ok({ USD: 1.14 }));
    await fetchEurRate("USD", "", { today: TODAY });
    await fetchEurRate("USD", "", { today: TODAY });
    expect(urls).toHaveLength(1);
    await fetchEurRate("USD", "", { today: "2026-09-28" });
    expect(urls).toHaveLength(2);
  });

  it("tallenteeseen jää enintään 30 kurssia", async () => {
    stubRates(ok({ SEK: 11.29 }));
    for (let day = 1; day <= 35; day++) {
      const date = `2026-08-${String(day).padStart(2, "0")}`;
      await fetchEurRate("SEK", date, { today: TODAY });
    }
    const stored = JSON.parse(window.localStorage.getItem(RATES_STORAGE_KEY)!) as object;
    expect(Object.keys(stored)).toHaveLength(30);
  });

  it("virheellinen tallenne ohitetaan", async () => {
    window.localStorage.setItem(RATES_STORAGE_KEY, "[1, 2]");
    stubRates(ok({ DKK: 7.46 }));
    await expect(fetchEurRate("DKK", "2026-09-26", { today: TODAY })).resolves.toMatchObject({
      rate: 7.46,
    });
  });

  it("kertoo virheen syyn", async () => {
    stubRates(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await reason(fetchEurRate("DKK", "", { today: TODAY }))).toBe("verkko");

    stubRates(() => new Response("{}", { status: 404 }));
    expect(await reason(fetchEurRate("XYZ", "", { today: TODAY }))).toBe("valuutta");

    stubRates(() => new Response("{}", { status: 500 }));
    expect(await reason(fetchEurRate("DKK", "", { today: TODAY }))).toBe("vastaus");

    stubRates(ok({ USD: 1.14 }));
    expect(await reason(fetchEurRate("DKK", "", { today: TODAY }))).toBe("vastaus");

    stubRates(() => new Response("ei jsonia", { status: 200 }));
    expect(await reason(fetchEurRate("DKK", "", { today: TODAY }))).toBe("vastaus");
  });

  it("keskeytys välitetään sellaisenaan", async () => {
    stubRates(() => Promise.reject(new DOMException("Keskeytetty", "AbortError")));
    await expect(fetchEurRate("DKK", "", { today: TODAY })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
