import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { categories, displayName, groupByCategory, metrics, metricsById } from "../data/content.ts";
import { recommendedOrder } from "../data/intro.ts";
import { HIGHLIGHT_ATTR, HIGHLIGHT_MS } from "../hooks/useCardNavigation.ts";
import App, { STORAGE_KEYS } from "./App.tsx";
import { TOC_HEIGHT_VAR } from "./TableOfContents.tsx";

function card(id: string) {
  return screen.getByRole("article", { name: displayName(metricsById.get(id)!) });
}

function queryCard(id: string) {
  return screen.queryByRole("article", { name: displayName(metricsById.get(id)!) });
}

const visibleCardIds = () => screen.queryAllByRole("article").map((a) => a.id);

/** Palaava käyttäjä, joka on jo sulkenut johdannon. */
function renderReturning() {
  window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
  const user = userEvent.setup();
  return { user, ...render(<App />) };
}

describe("App", () => {
  it("näyttää otsikon ja vastuuvapauslausekkeen", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Osakkeen tunnusluvut");
    expect(screen.getAllByText(/ei sijoitusneuvontaa/).length).toBeGreaterThan(0);
  });
});

describe("MetricGrid", () => {
  it("ryhmittelee kortit kysymysotsikoiden alle kategorioiden järjestyksessä", () => {
    renderReturning();
    const headings = screen.getAllByRole("heading", { level: 2 });
    const expected = [...categories].sort((a, b) => a.order - b.order).map((c) => c.question);
    expect(headings.map((h) => h.textContent)).toEqual(expected);

    const price = screen.getByRole("region", { name: "Onko osake halpa vai kallis?" });
    expect(within(price).getByRole("article", { name: "P/E-luku" })).toBeInTheDocument();
    expect(within(price).queryByRole("article", { name: "Liikevaihto" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(metrics.length);
  });

  it("näyttää perustason luvut kategorian alussa", () => {
    for (const { metrics: group } of groupByCategory(metrics)) {
      const firstAdvanced = group.findIndex((m) => m.level !== "perus");
      if (firstAdvanced === -1) continue;
      expect(group.slice(firstAdvanced).every((m) => m.level !== "perus")).toBe(true);
    }
  });
});

describe("IntroPanel", () => {
  it("näkyy ensimmäisellä käynnillä, ja sulkeminen muistetaan", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const intro = screen.getByRole("region", { name: "Aloita tästä" });
    expect(intro).toHaveTextContent("Mikään luku ei yksin kerro");
    expect(intro).toHaveTextContent("ei sijoitusneuvontaa");
    expect(within(intro).getByText("Pienempi = yleensä halvempi")).toBeInTheDocument();

    await user.click(within(intro).getByRole("button", { name: /Sulje johdanto/ }));
    expect(screen.queryByRole("region", { name: "Aloita tästä" })).not.toBeInTheDocument();
    // Kohdistus ei katoa: se siirtyy linkkiin, josta johdannon saa takaisin.
    expect(screen.getByRole("button", { name: "Mitä tunnusluvut ovat?" })).toHaveFocus();

    unmount();
    render(<App />);
    expect(screen.queryByRole("region", { name: "Aloita tästä" })).not.toBeInTheDocument();
  });

  it("aukeaa uudelleen linkistä ”Mitä tunnusluvut ovat?”", async () => {
    const { user } = renderReturning();
    await user.click(screen.getByRole("button", { name: "Mitä tunnusluvut ovat?" }));

    expect(screen.getByRole("heading", { name: "Aloita tästä" })).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Mitä tunnusluvut ovat?" }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.introClosed)).toBe("false");
  });

  it("suositellun järjestyksen askeleet vievät oikeisiin kortteihin", async () => {
    const user = userEvent.setup();
    render(<App />);
    const steps = within(screen.getByRole("region", { name: "Aloita tästä" })).getAllByRole("link");
    expect(steps.map((a) => a.getAttribute("href"))).toEqual(
      recommendedOrder.map((id) => `#${id}`),
    );
    expect(steps.map((a) => a.textContent)).toEqual([
      "1Liikevaihto",
      "2EBIT",
      "3EBIT-%",
      "4EPS",
      "5P/E",
      "6Omavaraisuusaste",
      "7Osinkotuotto",
      "8Osinkosuhde",
    ]);

    await user.click(steps[4]!);
    expect(card("pe")).toHaveFocus();
    expect(card("pe")).toHaveAttribute(HIGHLIGHT_ATTR);
  });

  it("jokainen suositellun järjestyksen askel on olemassa oleva tunnusluku", () => {
    for (const id of recommendedOrder) expect(metricsById.has(id), id).toBe(true);
  });
});

describe("Haku ja suodatus", () => {
  it("”velaton” löytää EV:n, ja haku tallentuu osoitteeseen", async () => {
    const { user } = renderReturning();
    await user.type(screen.getByRole("searchbox", { name: "Hae tunnuslukua" }), "velaton");

    expect(visibleCardIds()).toEqual(["ev"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 tunnusluku");
    expect(new URLSearchParams(window.location.search).get("q")).toBe("velaton");
  });

  it("johdanto väistyy haun ajaksi, mutta sitä ei merkitä suljetuksi", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "velaton");
    expect(screen.queryByRole("region", { name: "Aloita tästä" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox"));
    expect(screen.getByRole("region", { name: "Aloita tästä" })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.introClosed)).toBeNull();
  });

  it("oma suodattimen muutos poistaa kortin osoitteesta", async () => {
    window.history.replaceState(null, "", "/#pe");
    const { user } = renderReturning();
    await user.click(screen.getByRole("button", { name: "Velka" }));
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe("?k=velka");
  });

  it("palauttaa tilan osoitteesta", () => {
    window.history.replaceState(null, "", "/?q=osinko&k=osinko");
    renderReturning();
    expect(screen.getByRole("searchbox")).toHaveValue("osinko");
    const filters = screen.getByRole("group", { name: "Näytä kategoria" });
    expect(within(filters).getByRole("button", { name: "Osinko" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Osinko/osake kuuluu Per osake -kategoriaan, joten se jää pois.
    expect(visibleCardIds()).toEqual(["osinkotuotto", "osinkosuhde"]);
  });

  it("pikanäppäin / vie hakuun, mutta ei tekstikentässä", async () => {
    const { user } = renderReturning();
    const search = screen.getByRole("searchbox");
    await user.keyboard("/");
    expect(search).toHaveFocus();
    expect(search).toHaveValue("");

    await user.keyboard("p/e");
    expect(search).toHaveValue("p/e");
  });

  it("Esc tyhjentää haun", async () => {
    const { user } = renderReturning();
    await user.type(screen.getByRole("searchbox"), "velaton{Escape}");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(visibleCardIds()).toHaveLength(metrics.length);
  });

  it("kertoo, jos mitään ei löydy, ja haun voi tyhjentää", async () => {
    const { user } = renderReturning();
    await user.type(screen.getByRole("searchbox"), "kryptovaluutta");
    expect(visibleCardIds()).toEqual([]);
    expect(screen.getByText(/Haulla ”kryptovaluutta” ei löytynyt/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tyhjennä haku" }));
    expect(visibleCardIds()).toHaveLength(metrics.length);
  });

  it("kategoria rajaa kortit ja tallentuu osoitteeseen", async () => {
    const { user } = renderReturning();
    const filters = screen.getByRole("group", { name: "Näytä kategoria" });
    expect(within(filters).getByRole("button", { name: "Kaikki" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(within(filters).getByRole("button", { name: "Velka" }));
    expect(visibleCardIds()).toEqual(["omavaraisuusaste", "nettovelkaantumisaste"]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Onko yhtiöllä liikaa velkaa?",
    ]);
    expect(new URLSearchParams(window.location.search).get("k")).toBe("velka");

    await user.click(within(filters).getByRole("button", { name: "Kaikki" }));
    expect(visibleCardIds()).toHaveLength(metrics.length);
    expect(window.location.search).toBe("");
  });

  it("syventävät voi piilottaa, ja valinta muistetaan", async () => {
    const { user, unmount } = renderReturning();
    const toggle = screen.getByRole("checkbox", { name: "Näytä myös syventävät" });
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(queryCard("ev")).not.toBeInTheDocument();
    expect(queryCard("pe")).toBeInTheDocument();

    unmount();
    render(<App />);
    expect(screen.getByRole("checkbox", { name: "Näytä myös syventävät" })).not.toBeChecked();
    expect(queryCard("ev")).not.toBeInTheDocument();
  });

  it("kertoo suodattimen piilottamista osumista ja näyttää ne pyydettäessä", async () => {
    const { user } = renderReturning();
    await user.click(screen.getByRole("checkbox", { name: "Näytä myös syventävät" }));
    await user.type(screen.getByRole("searchbox"), "velaton");
    expect(visibleCardIds()).toEqual([]);
    expect(screen.getByText("1 osuma on piilossa, koska suodatin on päällä.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Näytä kaikki osumat" }));
    expect(visibleCardIds()).toEqual(["ev"]);
    expect(screen.getByRole("checkbox", { name: "Näytä myös syventävät" })).toBeChecked();
  });
});

describe("Sisällysluettelo", () => {
  const toc = () => screen.getByRole("navigation", { name: "Tunnusluvut A–Ö" });

  it("listaa kaikki tunnusluvut aakkosjärjestyksessä ennen johdantoa", () => {
    render(<App />);
    const links = within(toc()).getAllByRole("link");
    expect(links).toHaveLength(metrics.length + 5);
    expect(links[0]).toHaveTextContent("EBIT");
    expect(links.at(-1)).toHaveTextContent("Yritysarvo");
    for (const link of links) {
      expect(metricsById.has(link.getAttribute("href")!.slice(1))).toBe(true);
    }
    const intro = screen.getByRole("region", { name: "Aloita tästä" });
    expect(toc().compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("näyttää kaikki luvut suodattimesta riippumatta, ja linkki nollaa suodattimen", async () => {
    const { user } = renderReturning();
    await user.click(screen.getByRole("button", { name: "Velka" }));
    await user.click(screen.getByRole("checkbox", { name: "Näytä myös syventävät" }));
    expect(within(toc()).getAllByRole("link")).toHaveLength(metrics.length + 5);
    expect(queryCard("peg")).not.toBeInTheDocument();

    await user.click(within(toc()).getByRole("link", { name: "PEG-luku" }));
    expect(card("peg")).toHaveFocus();
    expect(window.location.hash).toBe("#peg");
    expect(screen.getByRole("button", { name: "Kaikki" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lyhennerivi vie samaan korttiin kuin nimi", async () => {
    const { user } = renderReturning();
    await user.click(within(toc()).getByRole("link", { name: "EPS, osakekohtainen tulos" }));
    expect(card("eps")).toHaveFocus();
  });

  it("väistyy haun ajaksi", async () => {
    const { user } = renderReturning();
    await user.type(screen.getByRole("searchbox"), "velka");
    expect(screen.queryByRole("navigation", { name: "Tunnusluvut A–Ö" })).not.toBeInTheDocument();
  });

  const details = () => toc().querySelector("details")!;
  const summary = () => toc().querySelector("summary")!;

  it("on kiinnitetty, ja sen korkeus välitetään suodatinpalkille", () => {
    renderReturning();
    expect(toc()).toHaveClass("toc");
    expect(document.documentElement.style.getPropertyValue(TOC_HEIGHT_VAR)).toMatch(/px$/);
  });

  it("pienenee ja palautuu otsikkorivistä, ja valinta muistetaan", async () => {
    const { user, unmount } = renderReturning();
    expect(details().open).toBe(true);
    expect(summary()).toHaveTextContent("Pienennä");

    await user.click(summary());
    await waitFor(() => expect(summary()).toHaveTextContent("Näytä"));
    expect(details().open).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEYS.tocOpen)).toBe("false");

    unmount();
    render(<App />);
    expect(details().open).toBe(false);

    await user.click(summary());
    await waitFor(() => expect(summary()).toHaveTextContent("Pienennä"));
    expect(details().open).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEYS.tocOpen)).toBe("true");
  });

  describe("kapealla näytöllä", () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
    });

    afterEach(() => {
      // @ts-expect-error jsdom:ssa ei ole matchMediaa
      delete window.matchMedia;
    });

    it("on oletuksena pienennetty rivi, jonka voi avata", async () => {
      const { user } = renderReturning();
      expect(details().open).toBe(false);

      await user.click(summary());
      await waitFor(() => expect(summary()).toHaveTextContent("Pienennä"));
      expect(within(toc()).getByRole("link", { name: "P/E-luku" })).toBeVisible();
    });

    it("linkki pienentää luettelon muuttamatta tallennettua valintaa", async () => {
      window.localStorage.setItem(STORAGE_KEYS.tocOpen, "true");
      const { user } = renderReturning();
      expect(details().open).toBe(true);

      await user.click(within(toc()).getByRole("link", { name: "PEG-luku" }));
      expect(card("peg")).toHaveFocus();
      await waitFor(() => expect(details().open).toBe(false));
      expect(window.localStorage.getItem(STORAGE_KEYS.tocOpen)).toBe("true");
    });
  });
});

describe("Siirtyminen korttiin", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("linkki P/E → PEG vierittää PEG-korttiin, kohdistaa ja korostaa sen hetkeksi", async () => {
    const { user } = renderReturning();
    const peg = card("peg");

    await user.click(within(card("pe")).getByRole("link", { name: "PEG" }));

    expect(peg.scrollIntoView).toHaveBeenCalledOnce();
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toBe(peg);
    expect(peg).toHaveFocus();
    expect(peg).toHaveAttribute(HIGHLIGHT_ATTR);
    expect(window.location.hash).toBe("#peg");
  });

  it("nollaa suodattimen, jos se piilottaa kohdekortin", async () => {
    const { user } = renderReturning();
    await user.click(screen.getByRole("button", { name: "Hinta" }));
    await user.click(screen.getByRole("checkbox", { name: "Näytä myös syventävät" }));
    expect(queryCard("peg")).not.toBeInTheDocument();

    // P/E-kortin EPS-merkintä vie toiseen kategoriaan.
    await user.click(within(card("pe")).getByRole("link", { name: "EPS" }));
    expect(card("eps")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Kaikki" })).toHaveAttribute("aria-pressed", "true");
    // Syventävien valinta ei piilottanut EPS:ää, joten se säilyy.
    expect(screen.getByRole("checkbox", { name: "Näytä myös syventävät" })).not.toBeChecked();

    await user.click(within(card("pe")).getByRole("link", { name: "PEG" }));
    expect(card("peg")).toHaveFocus();
    expect(screen.getByRole("checkbox", { name: "Näytä myös syventävät" })).toBeChecked();
  });

  it("nollaa haun, jos kohdekortti ei osu siihen", async () => {
    const { user } = renderReturning();
    await user.type(screen.getByRole("searchbox"), "hinta-voittosuhde");
    expect(visibleCardIds()).toEqual(["pe"]);

    await user.click(within(card("pe")).getByRole("link", { name: "PEG" }));
    expect(card("peg")).toHaveFocus();
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(window.location.hash).toBe("#peg");
  });

  it("korostus poistuu hetken kuluttua ja uusi linkki siirtää korostuksen", () => {
    vi.useFakeTimers();
    window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
    render(<App />);
    const pe = card("pe");
    const peg = card("peg");

    act(() => within(pe).getByRole("link", { name: "PEG" }).click());
    expect(peg).toHaveAttribute(HIGHLIGHT_ATTR);

    act(() => within(peg).getByRole("link", { name: "P/E" }).click());
    expect(peg).not.toHaveAttribute(HIGHLIGHT_ATTR);
    expect(pe).toHaveAttribute(HIGHLIGHT_ATTR);

    act(() => vi.advanceTimersByTime(HIGHLIGHT_MS));
    expect(pe).not.toHaveAttribute(HIGHLIGHT_ATTR);
  });

  it("sanastoikkunan Siirry korttiin -linkki vie korttiin", async () => {
    const { user } = renderReturning();
    const term = within(card("pe")).getByRole("button", { name: "EPS" });
    await user.click(term);
    await user.click(screen.getByRole("link", { name: "Siirry korttiin →" }));

    expect(card("eps")).toHaveFocus();
    expect(term).toHaveAttribute("aria-expanded", "false");
  });

  it("sivu, joka avataan kortin osoitteella, vierittää korttiin", () => {
    window.history.replaceState(null, "", "/#ev");
    renderReturning();
    expect(card("ev")).toHaveFocus();
    expect(card("ev")).toHaveAttribute(HIGHLIGHT_ATTR);
  });

  it("kortin osoite toimii, vaikka osoitteen suodatin piilottaisi kortin", () => {
    window.history.replaceState(null, "", "/?k=koko#pe");
    renderReturning();
    expect(card("pe")).toHaveFocus();
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#pe");
  });

  it("Takaisin-painike (hashchange) vie edelliseen korttiin", () => {
    renderReturning();
    act(() => {
      window.history.replaceState(null, "", "/#eps");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(card("eps")).toHaveFocus();
  });

  it("jättää Ctrl-klikkauksen selaimelle, jotta kortin voi avata uuteen välilehteen", () => {
    renderReturning();
    const chip = within(card("pe")).getByRole("link", { name: "PEG" });
    // Estetään jsdomin oma navigointi, jotta nähdään, mitä sovellus itse tekee.
    const blockNavigation = (e: Event) => e.preventDefault();

    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
    const spy = vi.spyOn(click, "preventDefault");
    window.addEventListener("click", blockNavigation);
    act(() => {
      chip.dispatchEvent(click);
    });
    window.removeEventListener("click", blockNavigation);

    expect(spy).toHaveBeenCalledOnce(); // vain blockNavigation
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("");
  });
});
