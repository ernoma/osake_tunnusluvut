import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { violations } from "../test/axe.ts";
import { describe, expect, it, vi } from "vitest";
import { decodeAnalysis } from "../hooks/useAnalysisUrl.ts";
import { RECENT_STORAGE_KEY } from "../hooks/useRecentAnalyses.ts";
import App from "./App.tsx";

function renderAt(search: string) {
  window.history.replaceState(null, "", "/" + search);
  const user = userEvent.setup();
  return { user, ...render(<App />) };
}

const figuresInUrl = () => decodeAnalysis(window.location.search).figures;

/** Lisää luvun "Lisää luku" -paneelista. Paneelin pitää olla auki. */
async function addFigure(user: ReturnType<typeof userEvent.setup>, query: string, value: string) {
  await user.type(screen.getByRole("searchbox", { name: /Hae lukua/ }), query);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("textbox", { name: "Arvo" })).toHaveFocus();
  await user.keyboard(value);
  await user.click(screen.getByRole("button", { name: "Lisää" }));
}

/** EKP:n kurssi kruunulle. Muut valuutat eivät ole tiedossa. */
function stubSekRate() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.includes("symbols=SEK")
        ? new Response(
            JSON.stringify({ amount: 1, base: "EUR", date: "2026-09-25", rates: { SEK: 11.29 } }),
          )
        : new Response("{}", { status: 404 }),
    ),
  );
}

const calculatedList = () =>
  screen.getByRole("heading", { name: "Omista luvuista lasketut" })
    .nextElementSibling as HTMLElement;

describe("sivulinkit", () => {
  it("vievät sivulta toiselle, ja osoite ja kohdistus seuraavat", async () => {
    const { user } = renderAt("");
    const nav = screen.getByRole("navigation", { name: "Sivut" });
    expect(within(nav).getByRole("link", { name: "Tunnusluvut" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(within(nav).getByRole("link", { name: "Tutki osaketta" }));
    expect(window.location.search).toBe("?sivu=tutki");
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Tutki osaketta");
    expect(heading).toHaveFocus();
    expect(screen.queryByRole("searchbox", { name: "Hae tunnuslukua" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/ei sijoitusneuvontaa/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: "Tunnusluvut" }));
    expect(window.location.search).toBe("");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Osakkeen tunnusluvut");
  });

  it("selaimen Takaisin palaa edelliselle sivulle", async () => {
    const { user } = renderAt("");
    await user.click(screen.getByRole("link", { name: "Tutki osaketta" }));
    window.history.back();
    expect(
      await screen.findByRole("heading", { level: 1, name: /Osakkeen tunnusluvut/ }),
    ).toBeInTheDocument();
  });
});

describe("käsin syöttö", () => {
  it("luvut syötetään haulla, ja lasketut luvut ja osoite päivittyvät", async () => {
    const { user } = renderAt("?sivu=tutki");
    await user.click(screen.getByRole("button", { name: "Syötä luvut itse" }));
    expect(screen.getByRole("searchbox", { name: /Hae lukua/ })).toHaveFocus();

    await addFigure(user, "kurssi", "10");
    await addFigure(user, "osakkeiden määrä", "5 milj.");

    const table = screen.getByRole("table", { name: "Syötetyt luvut" });
    expect(within(table).getByRole("rowheader", { name: "Osakkeen kurssi" })).toBeInTheDocument();
    expect(within(table).getAllByText("Syötetty")).toHaveLength(2);
    expect(within(calculatedList()).getByText("Markkina-arvo").parentElement).toHaveTextContent(
      "50 milj. €",
    );
    expect(figuresInUrl()).toEqual([
      { id: "kurssi", value: 10, period: "toteutunut", year: "", origin: "kayttaja" },
      { id: "osakkeiden-maara", value: 5e6, period: "toteutunut", year: "", origin: "kayttaja" },
    ]);
    expect(window.location.search).toContain("kurssi=10~t~~k");
  });

  it("korjaus päivittää laskennan, ja virheellinen arvo ei mene osoitteeseen", async () => {
    const { user } = renderAt("?sivu=tutki&kurssi=10~t~2025~s&osakkeiden-maara=5000000~t~~s");
    const table = screen.getByRole("table", { name: "Syötetyt luvut" });
    expect(within(table).getAllByText("Sivulta")).toHaveLength(2);

    const price = screen.getByRole("textbox", { name: "Osakkeen kurssi, arvo" });
    expect(price).toHaveValue("10");
    await user.clear(price);
    await user.type(price, "abc{Enter}");
    expect(price).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Kirjoita luku/)).toBeInTheDocument();
    expect(figuresInUrl()[0]?.value).toBe(10);

    await user.clear(price);
    await user.type(price, "20,5");
    await user.tab();
    expect(price).not.toHaveAttribute("aria-invalid");
    expect(figuresInUrl()[0]).toMatchObject({ value: 20.5, origin: "kayttaja", year: "2025" });
    expect(within(table).getAllByText("Syötetty")).toHaveLength(1);
    expect(within(calculatedList()).getByText(/103 milj/)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Osakkeen kurssi, kausi" }),
      "Ennuste",
    );
    expect(figuresInUrl()[0]?.period).toBe("ennuste");
  });

  it("poistettu luku lasketaan uudelleen, jos se on mahdollista", async () => {
    const { user } = renderAt(
      "?sivu=tutki&markkina-arvo=20000000000~t~~s&kurssi=10~t~~s&osakkeiden-maara=1000000000~t~~s",
    );
    expect(
      screen.queryByRole("heading", { name: "Omista luvuista lasketut" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Poista Markkina-arvo" }));
    expect(within(calculatedList()).getByText("Markkina-arvo").parentElement).toHaveTextContent(
      "10 mrd. €",
    );
    expect(figuresInUrl().map((f) => f.id)).toEqual(["kurssi", "osakkeiden-maara"]);
    expect(screen.getByRole("button", { name: "+ Lisää luku" })).toHaveFocus();
  });

  it("rahamäärät näytetään analyysin valuutassa", async () => {
    const { user } = renderAt("?sivu=tutki&val=USD&kurssi=10~t~~s&osakkeiden-maara=5000000~t~~s");
    expect(within(calculatedList()).getByText(/50 milj\. USD/)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Valuutta" }), "EUR");
    expect(within(calculatedList()).getByText(/50 milj\. €/)).toBeInTheDocument();
    expect(window.location.search).toContain("val=EUR");
  });

  it("jo lisätty luku ei näy Lisää luku -listassa", async () => {
    const { user } = renderAt("?sivu=tutki&kurssi=10~t~~s");
    await user.click(screen.getByRole("button", { name: "+ Lisää luku" }));
    await user.type(screen.getByRole("searchbox", { name: /Hae lukua/ }), "kurssi");
    expect(screen.getByText(/Ei osumia\. Kokeile/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Valmis" }));
    expect(screen.getByRole("button", { name: "+ Lisää luku" })).toHaveFocus();
  });
});

describe("osoite ja viimeisimmät", () => {
  it("osoite palauttaa saman analyysin", () => {
    renderAt("?sivu=tutki&nimi=Vonovia&val=EUR&pvm=2026-09-26&pe=12.4~t~2025~s");
    expect(screen.getByRole("textbox", { name: "Yhtiön nimi" })).toHaveValue("Vonovia");
    expect(screen.getByLabelText("Luvut haettu")).toHaveValue("2026-09-26");
    expect(screen.getByRole("textbox", { name: "P/E-luku, arvo" })).toHaveValue("12,4");
    expect(screen.getByRole("textbox", { name: "P/E-luku, vuosi" })).toHaveValue("2025");
    expect(screen.getByRole("combobox", { name: "P/E-luku, kausi" })).toHaveValue("toteutunut");
  });

  it("analyysi tallentuu viimeisimpiin, ja sen voi avata ja poistaa", async () => {
    const { user } = renderAt("?sivu=tutki&nimi=Vonovia&pvm=2026-09-26&pe=12.4~t~2025~s");
    await user.type(screen.getByRole("textbox", { name: "Yhtiön nimi" }), " SE");
    await user.click(screen.getByRole("button", { name: "Uusi analyysi" }));
    expect(window.location.search).toBe("?sivu=tutki");
    expect(screen.getByRole("heading", { name: "Aloita" })).toHaveFocus();

    const recent = screen.getByRole("region", { name: "Viimeisimmät analyysit" });
    // Nimen muokkaus päivitti saman rivin eikä lisännyt uutta.
    expect(within(recent).getAllByRole("listitem")).toHaveLength(1);
    expect(within(recent).getByRole("listitem")).toHaveTextContent("26.9.2026 · 1 luku");

    await user.click(within(recent).getByRole("link", { name: "Vonovia SE" }));
    expect(screen.getByRole("textbox", { name: "P/E-luku, arvo" })).toHaveValue("12,4");
    expect(window.location.search).toContain("nimi=Vonovia%20SE");
    expect(screen.getByRole("heading", { name: "Yhtiö" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Uusi analyysi" }));
    await user.click(screen.getByRole("button", { name: "Poista Vonovia SE listalta" }));
    expect(
      screen.queryByRole("region", { name: "Viimeisimmät analyysit" }),
    ).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "")).toEqual([]);
  });

  it("muistaa enintään viisi analyysiä uusin ensin", { timeout: 20_000 }, async () => {
    const { user } = renderAt("?sivu=tutki");
    for (const name of ["A", "B", "C", "D", "E", "F"]) {
      await user.click(screen.getByRole("button", { name: "Syötä luvut itse" }));
      await addFigure(user, "kurssi", "1");
      await user.type(screen.getByRole("textbox", { name: "Yhtiön nimi" }), name);
      await user.click(screen.getByRole("button", { name: "Uusi analyysi" }));
    }
    const recent = screen.getByRole("region", { name: "Viimeisimmät analyysit" });
    expect(
      within(recent)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["F", "E", "D", "C", "B"]);
  });
});

const analysisRow = (name: string) => screen.getByRole("article", { name });

describe("analyysi", () => {
  it("P/FCF lasketaan markkina-arvosta ja vapaasta kassavirrasta, ja laskelma näkyy", () => {
    renderAt("?sivu=tutki&markkina-arvo=20000000000~t~~s&vapaa-kassavirta=1100000000~t~~s");
    const row = analysisRow("P/FCF-luku");
    expect(row).toHaveTextContent("18,2");
    expect(row).toHaveTextContent("Laskettu · Toteutunut");
    expect(row).toHaveTextContent("Markkina-arvo 20 mrd. € ÷ vapaa kassavirta 1,1 mrd. € = 18,2");
    expect(within(row).getByRole("link", { name: /Avaa kortti/ })).toHaveAttribute(
      "href",
      "/#p-fcf",
    );
  });

  it("osuva väli erottuu tekstinä ja merkintänä, ei pelkkänä värinä", () => {
    renderAt("?sivu=tutki&pe=12.4~t~2025~s");
    const row = analysisRow("P/E-luku");
    expect(row).toHaveTextContent("Sivulta · Toteutunut · 2025");
    const hit = within(row)
      .getAllByRole("listitem")
      .filter((li) => li.getAttribute("aria-current") === "true");
    expect(hit).toHaveLength(1);
    expect(hit[0]).toHaveTextContent("10–20");
    expect(hit[0]).toHaveTextContent("▲");
    expect(hit[0]).toHaveTextContent("Arvo 12,4 osuu tähän väliin.");
    expect(row).toHaveTextContent(/Nyrkkisääntö/);
    expect(row).toHaveTextContent(/Yleinen virhe/);
  });

  it("välien väliin osuva arvo näytetään ilman sävyä", () => {
    renderAt("?sivu=tutki&ebit-prosentti=7~t~~k");
    expect(analysisRow("Liikevoittoprosentti (EBIT-%)")).toHaveTextContent(
      "Arvo 7,0 % on välien 3–5 % ja 10–15 % välissä.",
    );
  });

  it("sivun ja omista luvuista lasketun eroista huomautetaan, eikä arvoa muuteta", () => {
    renderAt("?sivu=tutki&pe=12.4~t~~s&kurssi=20~t~~s&eps=1~t~~s");
    const row = analysisRow("P/E-luku");
    expect(row).toHaveTextContent(
      "Sivun luku on 12,4, omista luvuista laskettuna 20,0 (Osakkeen kurssi 20,00 € ÷ osakekohtainen tulos 1,00 €).",
    );
    expect(within(row).getByText(/^Arvo:/).parentElement).toHaveTextContent("12,4");
  });

  it("yhdistelmähuomio näyttää luvut, selityksen ja linkit kortteihin", () => {
    renderAt("?sivu=tutki&roe=22~t~~s&roi=9~t~~s");
    const section = screen.getByRole("region", { name: "Mitä luvut kertovat yhdessä" });
    const item = within(section).getByRole("listitem");
    expect(item).toHaveTextContent("ROE on selvästi ROI:ta korkeampi");
    expect(item).toHaveTextContent(/22,0 %.*9,0 %/);
    expect(item).toHaveTextContent(/Ero johtuu yleensä velasta/);
    expect(within(item).getByRole("button", { name: /oman pääoman/ })).toBeInTheDocument();
    expect(
      within(item)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual(["/#roe", "/#roi"]);
  });

  it("yhdistelmähuomioita ei näytetä, kun mikään ei laukea", () => {
    renderAt("?sivu=tutki&roe=12~t~~s&roi=10~t~~s");
    expect(screen.queryByRole("region", { name: "Mitä luvut kertovat yhdessä" })).toBeNull();
  });

  it("yhdistelmähuomio eri kausien luvuista merkitään", () => {
    renderAt("?sivu=tutki&roe=22~t~~s&roi=9~e~~s");
    expect(screen.getByRole("region", { name: "Mitä luvut kertovat yhdessä" })).toHaveTextContent(
      /Luvut ovat eri kausilta/,
    );
  });

  it("eri kausien luvuista laskettu merkitään", () => {
    renderAt("?sivu=tutki&kurssi=20~t~~s&eps=2~e~~s");
    expect(analysisRow("P/E-luku")).toHaveTextContent(/Laskettu eri kausien luvuista/);
  });

  it("puuttuvasta luvusta kerrotaan, mitä syöttää, ja Lisää avaa kentät", async () => {
    const { user } = renderAt("?sivu=tutki&kurssi=10~t~~k");
    const item = screen.getByText("P/E-luku:").closest("li")!;
    expect(item).toHaveTextContent("Syötä osakekohtainen tulos (EPS).");

    await user.click(within(item).getByRole("button", { name: "Lisää: P/E-luku" }));
    const field = within(item).getByRole("textbox", { name: "Osakekohtainen tulos (EPS)" });
    expect(field).toHaveFocus();
    await user.click(within(item).getByRole("button", { name: "Lisää" }));
    expect(within(item).getByRole("alert")).toHaveTextContent("Syötä ainakin yksi luku.");

    await user.type(field, "2{Enter}");
    const heading = screen.getByRole("heading", { name: "P/E-luku", level: 4 });
    expect(heading).toHaveFocus();
    expect(analysisRow("P/E-luku")).toHaveTextContent("5,0");
    expect(figuresInUrl().map((f) => f.id)).toEqual(["kurssi", "eps"]);
  });

  it("negatiivisella nimittäjällä kerrotaan kortin sääntö", () => {
    renderAt("?sivu=tutki&kurssi=10~t~~s&eps=-1~t~~s");
    expect(screen.queryByRole("article", { name: "P/E-luku" })).not.toBeInTheDocument();
    const item = screen.getByText("P/E-luku:").closest("li")!;
    expect(item).toHaveTextContent(/ei laskettu, koska osakekohtainen tulos \(EPS\) on −1,00/);
    expect(item).toHaveTextContent(/tappiota, P\/E:tä ei voi käyttää/);
  });

  it("muun valuutan markkina-arvo verrataan kokoluokkiin euroiksi muunnettuna", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ amount: 1, base: "EUR", date: "2026-09-25", rates: { DKK: 7.4755 } }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderAt("?sivu=tutki&val=DKK&pvm=2026-09-26&markkina-arvo=14700000000~t~~s");
    const row = analysisRow("Markkina-arvo");
    expect(row).toHaveTextContent(/Haetaan valuuttakurssia/);

    const hit = await within(row).findByText(/osuu tähän väliin/);
    expect(hit.closest("li")).toHaveTextContent("Yli 1 mrd. €");
    expect(row).toHaveTextContent(/14,7\smrd\.\sDKK ≈ 1,97\smrd\.\s€/);
    expect(row).toHaveTextContent(/kurssi 25\.9\.2026: 1\s€ = 7,4755\sDKK/);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v1/2026-09-26?base=EUR&symbols=DKK",
      expect.anything(),
    );
  });

  it("kun kurssia ei saada, kokoluokkia ei verrata ja syy kerrotaan", async () => {
    renderAt("?sivu=tutki&val=USD&markkina-arvo=5000000000~t~~s");
    const row = analysisRow("Markkina-arvo");
    expect(await within(row).findByText(/Kokoluokkien rajat ovat euroina/)).toHaveTextContent(
      /Tarkista verkkoyhteys/,
    );
    expect(within(row).queryByText(/osuu tähän väliin/)).not.toBeInTheDocument();
  });

  const SEK_ANALYSIS =
    "?sivu=tutki&val=EUR&pvm=2026-09-26&kurssi=118.4~ttm~~s~SEK&eps=0.96~t~2025~s";

  it("eri valuutan luku muunnetaan ennen laskentaa, ja valuutan voi vaihtaa", async () => {
    stubSekRate();
    const { user } = renderAt(SEK_ANALYSIS);
    expect(
      screen.getByText(/Haetaan valuuttakurssia, jotta SEK-määräiset luvut voi muuntaa/),
    ).toHaveAttribute("role", "status");

    // 118,40 SEK ≈ 10,49 € ja 10,49 € ÷ 0,96 € ≈ 10,9, ei 118,40 ÷ 0,96 ≈ 123.
    const pe = await screen.findByRole("article", { name: "P/E-luku" });
    expect(pe).toHaveTextContent(
      /Osakkeen kurssi 118,40\sSEK ≈ 10,49\s€ \(1\s€ = 11,29\sSEK\) ÷ osakekohtainen tulos 0,96\s€ = 10,9/,
    );
    expect(screen.getByLabelText("Tilinpäätöksen valuutta")).toHaveValue("EUR");
    expect(
      screen.getByText(/Osakkeen kurssi on SEK-määräinen\. Se on muunnettu/),
    ).toHaveTextContent(/kurssilla 25\.9\.2026: 1\s€ = 11,29\sSEK/);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Osakkeen kurssi, valuutta" }),
      "EUR",
    );
    expect(analysisRow("P/E-luku")).toHaveTextContent(
      /Osakkeen kurssi 118,40\s€ ÷ osakekohtainen tulos 0,96\s€ = 123,3/,
    );
    expect(screen.queryByText(/muunnettu valuuttaan/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Valuutta")).toHaveValue("EUR");
    expect(window.location.search).toContain("kurssi=118.4~ttm~~s&");
  });

  it("kun kurssia ei saada, eri valuutan lukua ei käytetä ja syy kerrotaan", async () => {
    renderAt(SEK_ANALYSIS);
    // Sivun yläosassa ja jokaisessa tunnusluvussa, joka tarvitsee kurssia.
    const [warning] = await screen.findAllByText(/Osakkeen kurssi on SEK-määräinen, eikä sitä/);
    expect(warning).toHaveTextContent(/ei käytetä laskennassa\. .*Tarkista verkkoyhteys/);

    expect(screen.queryByRole("article", { name: "P/E-luku" })).not.toBeInTheDocument();
    const item = screen.getByText("P/E-luku:").closest("li")!;
    expect(item).toHaveTextContent(
      /Osakkeen kurssi on SEK-määräinen, eikä sitä voitu muuntaa valuuttaan EUR/,
    );
    // Kurssia ei pyydetä syöttämään uudelleen.
    expect(within(item).queryByRole("button", { name: /Lisää/ })).not.toBeInTheDocument();
  });

  it("Lisää luku -lomakkeessa rahamäärän valuutan voi valita", async () => {
    stubSekRate();
    const { user } = renderAt("?sivu=tutki&val=EUR&pvm=2026-09-26&eps=0.96~t~~s");
    await user.click(screen.getByRole("button", { name: "+ Lisää luku" }));
    await user.type(screen.getByRole("searchbox", { name: /Hae lukua/ }), "kurssi");
    await user.keyboard("{Enter}");
    await user.selectOptions(screen.getByRole("combobox", { name: "Luvun valuutta" }), "SEK");
    await user.type(screen.getByRole("textbox", { name: "Arvo" }), "118,4");
    await user.click(screen.getByRole("button", { name: "Lisää" }));

    expect(figuresInUrl().find((f) => f.id === "kurssi")).toMatchObject({
      value: 118.4,
      currency: "SEK",
    });
    expect(await screen.findByRole("article", { name: "P/E-luku" })).toHaveTextContent(/= 10,9/);

    // Kertoimella ei ole valuuttaa.
    await user.type(screen.getByRole("searchbox", { name: /Hae lukua/ }), "p/b");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("combobox", { name: "Luvun valuutta" })).not.toBeInTheDocument();
  });

  it("euromääräiselle analyysille kurssia ei haeta", () => {
    renderAt("?sivu=tutki&markkina-arvo=5000000000~t~~s");
    expect(within(analysisRow("Markkina-arvo")).getByText(/osuu tähän väliin/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("saavutettavuus (axe)", { timeout: 20_000 }, () => {
  it("aloitus viimeisimpien kanssa", async () => {
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([{ key: "a", name: "Nokia", date: "2026-09-26", search: "?sivu=tutki&pe=1" }]),
    );
    renderAt("?sivu=tutki");
    expect(await violations()).toEqual([]);
  });

  it("luvut, virheellinen arvo ja avoin Lisää luku -paneeli", async () => {
    const { user } = renderAt("?sivu=tutki&kurssi=10~t~~s&osakkeiden-maara=5~t~~s");
    const price = screen.getByRole("textbox", { name: "Osakkeen kurssi, arvo" });
    await user.clear(price);
    await user.type(price, "x{Enter}");
    await user.click(screen.getByRole("button", { name: "+ Lisää luku" }));
    expect(await violations()).toEqual([]);

    await user.keyboard("pe{Enter}");
    await user.click(screen.getByRole("button", { name: "Lisää" }));
    expect(await violations()).toEqual([]);
  });

  it("analyysi: osuva väli, laskelma, huomautukset ja avoin puuttuvien lomake", async () => {
    const { user } = renderAt(
      "?sivu=tutki&pe=12.4~t~~s&kurssi=20~t~~s&eps=1~e~~s&markkina-arvo=20000000000~t~~s&vapaa-kassavirta=1100000000~t~~s&ebit-prosentti=7~t~~k",
    );
    await user.click(screen.getByRole("button", { name: "Lisää: EV/EBIT-luku" }));
    await user.click(screen.getByRole("button", { name: "Lisää" }));
    expect(await violations()).toEqual([]);
  });

  it("analyysi: yhdistelmähuomiot", async () => {
    renderAt(
      "?sivu=tutki&roe=22~t~~s&roi=9~e~~s&osinko-per-osake=1~t~~s&osakkeiden-maara=100000000~t~~s&vapaa-kassavirta=80000000~t~~s",
    );
    expect(
      within(screen.getByRole("region", { name: "Mitä luvut kertovat yhdessä" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(2);
    expect(await violations()).toEqual([]);
  });

  it("analyysi: luvun valuutta, muunnos ja muuntamaton luku", async () => {
    stubSekRate();
    renderAt(
      "?sivu=tutki&val=EUR&pvm=2026-09-26&kurssi=118.4~ttm~~s~SEK&eps=0.96~t~2025~s&markkina-arvo=5~t~~s~NOK",
    );
    await screen.findByRole("article", { name: "P/E-luku" });
    await screen.findAllByText(/Markkina-arvo on NOK-määräinen, eikä sitä voitu/);
    expect(await violations()).toEqual([]);
  });
});
