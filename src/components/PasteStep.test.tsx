// Tekoälyhaku Tutki osaketta -sivulla (suunnitelman kohdat 11.2, 11.3 ja 11.9). API-kutsu
// korvataan valmiilla vastauksilla, eivätkä testit kutsu oikeaa rajapintaa.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { violations } from "../test/axe.ts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API_KEY_STORAGE_KEY, MODEL_STORAGE_KEY } from "../ai/apiKey.ts";
import { errorReply, messageReply, stubApi } from "../ai/fixtures/api.ts";
import { inderes } from "../ai/fixtures/inderes.ts";
import { nordnetSek } from "../ai/fixtures/nordnetSek.ts";
import { tilinpaatos } from "../ai/fixtures/tilinpaatos.ts";
import { decodeAnalysis } from "../hooks/useAnalysisUrl.ts";
import { RECENT_STORAGE_KEY } from "../hooks/useRecentAnalyses.ts";
import App from "./App.tsx";

const KEY = "sk-ant-testi-1234567890abcdef";

function renderPage() {
  window.history.replaceState(null, "", "/?sivu=tutki");
  const user = userEvent.setup();
  return { user, ...render(<App />) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const textField = () => screen.getByRole("textbox", { name: /Liitä teksti/ });
const keyField = () => screen.getByLabelText("Claude API -avain");
const extractButton = () => screen.getByRole("button", { name: "Anna tekoälyn poimia luvut" });

async function paste(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(textField());
  await user.paste(text);
}

describe("API-avain", () => {
  it("tallennetaan ensimmäisellä haulla ja voidaan poistaa", async () => {
    stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    expect(keyField()).toHaveAttribute("type", "password");
    expect(keyField()).toHaveAttribute("autocomplete", "off");

    await user.click(screen.getByRole("button", { name: "Näytä avain" }));
    expect(keyField()).toHaveAttribute("type", "text");

    await user.type(keyField(), KEY);
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(window.localStorage.getItem(API_KEY_STORAGE_KEY)).toBe(KEY);

    await user.click(screen.getByRole("button", { name: "Takaisin tekstiin" }));
    expect(textField()).toHaveValue(tilinpaatos.text);
    expect(screen.queryByLabelText("Claude API -avain")).not.toBeInTheDocument();
    expect(screen.getByText(/API-avain on tallennettu/)).toHaveTextContent("sk-ant-…cdef");

    await user.click(screen.getByRole("button", { name: "Poista avain tältä laitteelta" }));
    expect(window.localStorage.getItem(API_KEY_STORAGE_KEY)).toBeNull();
    expect(keyField()).toHaveValue("");
  });

  it("puuttuvasta avaimesta ja tekstistä kerrotaan ilman kutsua", async () => {
    const calls = stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    await user.click(extractButton());
    expect(screen.getByRole("alert")).toHaveTextContent("Liitä ensin teksti kenttään.");
    expect(textField()).toHaveFocus();

    await paste(user, "P/E 12");
    await user.click(extractButton());
    expect(screen.getByRole("alert")).toHaveTextContent("Anna ensin API-avain.");
    expect(keyField()).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it("hylätty avain avaa kentän, eikä avain näy viestissä", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(errorReply(401));
    const { user } = renderPage();
    expect(screen.queryByLabelText("Claude API -avain")).not.toBeInTheDocument();

    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("API-avain ei kelpaa. Tarkista avain.");
    expect(document.body.textContent).not.toContain(KEY);
    expect(keyField()).toBeInTheDocument();
  });

  it("mallin valinta muistetaan ja lähetetään pyynnössä", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    const calls = stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    await user.selectOptions(screen.getByRole("combobox", { name: "Malli" }), "claude-sonnet-5");
    expect(window.localStorage.getItem(MODEL_STORAGE_KEY)).toBe("claude-sonnet-5");

    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(calls[0]?.body.model).toBe("claude-sonnet-5");
  });
});

describe("haku", () => {
  it("näyttää tilan ja voidaan keskeyttää", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi("odota");
    const { user } = renderPage();
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    expect(screen.getByText(/Tekoäly lukee tekstiä, yleensä 5–20 sekuntia/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keskeytä" }));
    expect(await screen.findByText("Haku keskeytettiin.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keskeytä" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    [errorReply(429), "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen."],
    [errorReply(400, "Your credit balance is too low."), "Pyyntö hylättiin: Your credit"],
    [messageReply(tilinpaatos.response, "refusal"), "Tekoäly ei pystynyt käsittelemään"],
  ])("virhe %#", async (reply, message) => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(reply);
    const { user } = renderPage();
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("jos lukuja ei löydy, tarjotaan käsin syöttöä", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply({ ...tilinpaatos.response, values: [] }));
    const { user } = renderPage();
    await paste(user, "Säätiedote: huomenna sataa.");
    await user.click(extractButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Tekstistä ei löytynyt tunnuslukuja.");
    await user.click(within(alert).getByRole("button", { name: "Syötä luvut itse" }));
    expect(screen.getByRole("searchbox", { name: /Hae lukua/ })).toHaveFocus();
  });

  it("liian pitkästä tekstistä kerrotaan", async () => {
    const { user } = renderPage();
    await paste(user, "x".repeat(30_001));
    expect(textField()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Teksti on liian pitkä/)).toBeInTheDocument();
  });
});

describe("poimittujen lukujen tarkistus", () => {
  it("⚠-rivit eivät ole valittuina, ja vain valitut luvut siirtyvät analyysiin", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());

    const heading = await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(heading).toHaveFocus();
    const list = screen.getByRole("list", { name: "Poimitut luvut" });
    expect(within(list).getByRole("checkbox", { name: /^Liikevaihto 245\smilj/ })).toBeChecked();
    const advances = within(list).getByRole("checkbox", { name: /Saadut ennakot/ });
    expect(advances).not.toBeChecked();
    expect(advances.closest("li")).toHaveTextContent("Tarkista luku: rahamäärä on epätavallisen");
    expect(within(list).getByRole("checkbox", { name: /Osinko/ })).not.toBeChecked();
    expect(screen.getByText(/2 lukua on merkitty ⚠-merkillä/)).toBeInTheDocument();
    expect(within(list).getAllByText(/Lainaus tekstistä/)).toHaveLength(13);

    // Käyttäjä poistaa yhden luvun valinnasta.
    await user.click(within(list).getByRole("checkbox", { name: /Rahoituskulut/ }));
    await user.click(screen.getByRole("button", { name: "Käytä valittuja lukuja (10)" }));

    expect(screen.getByRole("heading", { name: "Yhtiö" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Yhtiön nimi" })).toHaveValue(
      "Kuvitteellinen Konserni Oyj",
    );
    const figures = decodeAnalysis(window.location.search).figures;
    expect(figures.map((f) => f.id)).not.toContain("saadut-ennakot");
    expect(figures.map((f) => f.id)).not.toContain("osinko-per-osake");
    expect(figures.map((f) => f.id)).not.toContain("rahoituskulut");
    expect(figures).toHaveLength(10);
    expect(figures.every((f) => f.origin === "sivu")).toBe(true);
    expect(figures.find((f) => f.id === "liikevaihto")).toEqual({
      id: "liikevaihto",
      value: 245_318_000,
      period: "toteutunut",
      year: "2025",
      origin: "sivu",
    });

    const table = screen.getByRole("table", { name: "Syötetyt luvut" });
    expect(within(table).getAllByText("Sivulta")).toHaveLength(10);
    // Avain ja lainaukset eivät päädy osoitteeseen eivätkä viimeisimpiin.
    expect(window.location.search).not.toContain("sk-ant");
    const recent = window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "";
    expect(recent).toContain("Kuvitteellinen Konserni Oyj");
    expect(recent).not.toContain("sk-ant");
    expect(recent).not.toContain("Liikevaihto 245 318");
  });

  it("kurssin eri valuutta muunnetaan ennen laskentaa", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    const rates = () =>
      new Response(
        JSON.stringify({ amount: 1, base: "EUR", date: "2026-09-25", rates: { SEK: 11.29 } }),
      );
    const calls = stubApi(messageReply(nordnetSek.response), rates);
    const { user } = renderPage();
    await paste(user, nordnetSek.text);
    await user.click(extractButton());

    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(
      screen.getByText(
        /Osakkeen kurssi ja markkina-arvo ovat SEK-määräisiä, mutta tilinpäätösluvut EUR/,
      ),
    ).toHaveTextContent(/muuntaa ne valuuttaan EUR/);
    const list = screen.getByRole("list", { name: "Poimitut luvut" });
    expect(
      within(list).getByRole("checkbox", { name: /^Osakkeen kurssi 118,40\sSEK/ }),
    ).toBeChecked();
    expect(
      within(list).getByRole("checkbox", { name: /^Nettotulos 102\smilj\.\s€/ }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: /Käytä valittuja lukuja/ }));
    const analysis = decodeAnalysis(window.location.search);
    expect(analysis.currency).toBe("EUR");
    expect(Object.fromEntries(analysis.figures.map((f) => [f.id, f.currency]))).toMatchObject({
      kurssi: "SEK",
      "markkina-arvo": "SEK",
      eps: undefined,
    });
    expect(window.location.search).toContain("kurssi=118.4~ttm~~s~SEK");
    expect(screen.getByRole("combobox", { name: "Osakkeen kurssi, valuutta" })).toHaveValue("SEK");

    // P/E lasketaan euroiksi muunnetusta kurssista: 118,40 SEK ≈ 10,49 € ja 10,49 € ÷ 0,96 €.
    const pe = await screen.findByRole("article", { name: "P/E-luku" });
    expect(pe).toHaveTextContent(
      /Osakkeen kurssi 118,40\sSEK ≈ 10,49\s€ \(1\s€ = 11,29\sSEK\) ÷ osakekohtainen tulos 0,96\s€ = 10,9/,
    );
    expect(screen.getByRole("article", { name: "P/B-luku" })).toHaveTextContent(
      /Markkina-arvo 12,6\smrd\.\sSEK ≈ 1,12\smrd\.\s€ .* = 1,5/,
    );
    expect(
      screen.getByText(/ovat SEK-määräisiä\. Ne on muunnettu valuuttaan EUR/),
    ).toHaveTextContent(/kurssilla 25\.9\.2026: 1\s€ = 11,29\sSEK/);
    expect(calls.at(-1)?.url).toMatch(/^https:\/\/api\.frankfurter\.dev\/v1\/.*symbols=SEK$/);
  });

  it("yksivaluuttaisesta aineistosta ei varoiteta", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());

    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(screen.queryByText(/määräisiä, mutta tilinpäätösluvut/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Käytä valittuja lukuja/ }));
    expect(screen.queryByText(/määräisiä, mutta tilinpäätösluvut/)).not.toBeInTheDocument();
    expect(screen.queryByText(/muunnettu valuuttaan/)).not.toBeInTheDocument();
    expect(window.location.search).not.toMatch(/~[A-Z]{3}(&|$)/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keksityt lainaukset hylätään, ja tekoälyn huomiot näytetään", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply(inderes.response));
    const { user } = renderPage();
    await paste(user, inderes.text);
    await user.click(extractButton());

    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    const list = screen.getByRole("list", { name: "Poimitut luvut" });
    expect(within(list).queryByRole("checkbox", { name: /Oman pääoman tuotto/ })).toBeNull();
    expect(screen.getByText(/Hylätyt luvut \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/lainausta ei löytynyt liitetystä tekstistä/)).toBeInTheDocument();
    expect(screen.getByText(/Vuodet 2026e ja 2027e ovat ennusteita/)).toBeInTheDocument();
    expect(within(list).getAllByRole("checkbox", { checked: true })).toHaveLength(12);
  });
});

describe("saavutettavuus (axe)", { timeout: 20_000 }, () => {
  it("liittäminen, avaimen kenttä ja virhe", async () => {
    stubApi(errorReply(401));
    const { user } = renderPage();
    expect(await violations()).toEqual([]);

    await user.type(keyField(), KEY);
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    await screen.findByRole("alert");
    expect(await violations()).toEqual([]);
  });

  it("tallennettu avain ja tarkistusvaihe", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply(tilinpaatos.response));
    const { user } = renderPage();
    expect(await violations()).toEqual([]);

    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    expect(await violations()).toEqual([]);
  });

  it("haku käynnissä ja tumma teema", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi("odota");
    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Tumma teema" }));
    await paste(user, tilinpaatos.text);
    await user.click(extractButton());
    expect(screen.getByRole("button", { name: "Keskeytä" })).toBeInTheDocument();
    expect(await violations()).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Keskeytä" }));
  });

  it("ei lukuja -virhe ja avatut hylätyt luvut", async () => {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, KEY);
    stubApi(messageReply({ ...tilinpaatos.response, values: [] }), messageReply(inderes.response));
    const { user } = renderPage();
    await paste(user, "Säätiedote: huomenna sataa.");
    await user.click(extractButton());
    await screen.findByRole("alert");
    expect(await violations()).toEqual([]);

    await user.clear(textField());
    await paste(user, inderes.text);
    await user.click(extractButton());
    await screen.findByRole("heading", { name: "Tarkista poimitut luvut" });
    await user.click(screen.getByText(/Hylätyt luvut/));
    expect(await violations()).toEqual([]);
  });
});
