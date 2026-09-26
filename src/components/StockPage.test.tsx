import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
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

  it("muistaa enintään viisi analyysiä uusin ensin", async () => {
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

async function violations(container: Element) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
}

describe("saavutettavuus (axe)", { timeout: 20_000 }, () => {
  it("aloitus viimeisimpien kanssa", async () => {
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([{ key: "a", name: "Nokia", date: "2026-09-26", search: "?sivu=tutki&pe=1" }]),
    );
    const { container } = renderAt("?sivu=tutki");
    expect(await violations(container)).toEqual([]);
  });

  it("luvut, virheellinen arvo ja avoin Lisää luku -paneeli", async () => {
    const { user, container } = renderAt("?sivu=tutki&kurssi=10~t~~s&osakkeiden-maara=5~t~~s");
    const price = screen.getByRole("textbox", { name: "Osakkeen kurssi, arvo" });
    await user.clear(price);
    await user.type(price, "x{Enter}");
    await user.click(screen.getByRole("button", { name: "+ Lisää luku" }));
    expect(await violations(container)).toEqual([]);

    await user.keyboard("pe{Enter}");
    await user.click(screen.getByRole("button", { name: "Lisää" }));
    expect(await violations(container)).toEqual([]);
  });
});
