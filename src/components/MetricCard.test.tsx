import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { displayName, metricsById } from "../data/content.ts";
import type { Metric } from "../data/types.ts";
import MetricCard from "./MetricCard.tsx";

function metric(id: string): Metric {
  const m = metricsById.get(id);
  if (!m) throw new Error(`Tunnuslukua ${id} ei löytynyt`);
  return m;
}

const pe = metric("pe");

function renderCard(m: Metric = pe) {
  const user = userEvent.setup();
  const view = render(<MetricCard metric={m} />);
  const card = screen.getByRole("article", { name: displayName(m) });
  return { user, card, ...view };
}

describe("MetricCard: tiivis näkymä", () => {
  it("näyttää kaikki kohdan 5.2 tiedot ilman klikkauksia", () => {
    const { card } = renderCard();
    const c = within(card);

    expect(c.getByRole("heading", { level: 3 })).toHaveTextContent("P/E-luku");
    expect(c.getByText("Perus")).toBeInTheDocument();
    expect(c.getByText(pe.question)).toBeInTheDocument();
    expect(c.getByText("Pienempi = yleensä halvempi")).toBeInTheDocument();
    expect(card).toHaveTextContent("Kertoo, kuinka monta kertaa yhtiön vuoden tuloksen maksat");
    expect(c.getByText(pe.formula.words)).toBeInTheDocument();
    expect(card).toHaveTextContent("Osake maksaa 20 € ja EPS on 2 €. P/E = 20 ÷ 2 = 10.");

    const rules = c.getByRole("list", { name: "Näin tulkitset" });
    expect(within(rules).getAllByRole("listitem")).toHaveLength(pe.rules.length);

    expect(c.getByText("Yleinen virhe:")).toBeInTheDocument();
    expect(card).toHaveTextContent("Matala P/E = hyvä ostos.");

    expect(c.getByRole("heading", { name: "Katso rinnalla" })).toBeInTheDocument();
    expect(c.getByRole("link", { name: "PEG" })).toHaveAttribute("href", "#peg");
    expect(c.getByRole("link", { name: "EPS" })).toHaveAttribute("href", "#eps");
    expect(c.getByRole("link", { name: "EV/EBIT" })).toHaveAttribute("href", "#ev-ebit");
  });

  it("merkitsee syventävän tason ja näyttää lyhenteen nimen perässä", () => {
    const { card } = renderCard(metric("ev"));
    expect(within(card).getByText("Syventävä")).toBeInTheDocument();
    expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent("Yritysarvo (EV)");
  });

  it("piilottaa Lisää-osion aluksi", () => {
    const { card } = renderCard();
    expect(within(card).getByRole("button", { name: /Lisää/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(within(card).queryByText("Ajattele näin")).not.toBeInTheDocument();
    expect(within(card).queryByText(pe.formula.symbols!)).not.toBeInTheDocument();
  });
});

describe("MetricCard: Lisää-osio", () => {
  it("laajenee paikallaan ja sulkeutuu uudelleen", async () => {
    const { user, card } = renderCard();
    const c = within(card);

    await user.click(c.getByRole("button", { name: /Lisää/ }));
    const toggle = c.getByRole("button", { name: /Vähemmän/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toBeInTheDocument();

    expect(c.getByText("Ajattele näin")).toBeInTheDocument();
    expect(c.getByText(/Kioski tekee 10 000 €/)).toBeInTheDocument();
    expect(c.getByText("Mikä vaikuttaa tulkintaan")).toBeInTheDocument();
    expect(c.getByText("Muita sudenkuoppia")).toBeInTheDocument();
    expect(c.getByText("Suuntaa antava asteikko")).toBeInTheDocument();
    expect(card).toHaveTextContent("Nyrkkisääntö. Tavalliset tasot vaihtelevat");
    expect(card).not.toHaveTextContent("Nyrkkisääntö. Nyrkkisääntö.");
    expect(c.getByText("Alle 10")).toBeInTheDocument();
    expect(c.getByText("Kurssi ÷ EPS")).toBeInTheDocument();
    expect(card).toHaveTextContent("P/E: Price / Earnings = hinta suhteessa tulokseen");
    expect(c.getByText("Miksi katsoa rinnalla")).toBeInTheDocument();
    expect(card).toHaveTextContent("Kertoo, selittyykö korkea P/E nopealla kasvulla.");
    expect(c.getByRole("heading", { name: "Lue lisää muualta" })).toBeInTheDocument();

    await user.click(toggle);
    expect(c.getByRole("button", { name: /Lisää/ })).toHaveAttribute("aria-expanded", "false");
    expect(c.queryByText("Ajattele näin")).not.toBeInTheDocument();
  });
});

describe("MetricCard: ulkoiset linkit", () => {
  it("avautuvat uuteen välilehteen ilman viittaajatietoa, suomenkieliset ensin", async () => {
    const { user, card } = renderCard();
    await user.click(within(card).getByRole("button", { name: /Lisää/ }));

    const links = within(card)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("https://"));
    expect(links).toHaveLength(pe.links.length);
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
      expect(a).toHaveTextContent("(avautuu uuteen välilehteen)");
    }

    const english = links.filter((a) => a.getAttribute("hreflang") === "en");
    expect(english).toHaveLength(1);
    expect(english[0]).toHaveTextContent("EN");
    expect(links.at(-1)).toBe(english[0]);
    expect(links[0]).not.toHaveTextContent("EN");

    expect(card).toHaveTextContent("Investopedia · esimerkki");
    expect(card).toHaveTextContent("Ulkoiset sivut eivät ole tämän oppaan tekemiä.");
  });

  it("jättää osion pois, jos linkkejä ei ole", async () => {
    const { user, card } = renderCard({ ...pe, links: [] });
    await user.click(within(card).getByRole("button", { name: /Lisää/ }));
    expect(within(card).queryByText("Lue lisää muualta")).not.toBeInTheDocument();
  });
});

describe("GlossaryTerm", () => {
  it("aukeaa Enterillä ja sulkeutuu Escillä, kohdistus pysyy sanassa", async () => {
    const { user, card } = renderCard();
    const term = within(card).getByRole("button", { name: "tuloksen" });

    term.focus();
    await user.keyboard("{Enter}");
    expect(term).toHaveAttribute("aria-expanded", "true");
    const popup = document.getElementById(term.getAttribute("aria-describedby")!);
    expect(popup).toHaveTextContent("Nettotulos");
    expect(popup).toHaveTextContent("Yhtiön voitto, kun kaikki kulut, korot ja verot on maksettu.");

    await user.keyboard("{Escape}");
    expect(term).toHaveAttribute("aria-expanded", "false");
    expect(term).not.toHaveAttribute("aria-describedby");
    expect(term).toHaveFocus();
  });

  it("aukeaa kohdistimella ja sulkeutuu, kun kohdistin siirtyy pois", async () => {
    const { user, card } = renderCard();
    const term = within(card).getByRole("button", { name: "tuloksen" });

    await user.hover(term);
    expect(term).toHaveAttribute("aria-expanded", "true");
    await user.unhover(term);
    await waitFor(() => expect(term).toHaveAttribute("aria-expanded", "false"));
  });

  it("aukeaa ja sulkeutuu napautuksella, ja napautus muualle sulkee sen", async () => {
    const { user, card } = renderCard();
    const term = within(card).getByRole("button", { name: "tuloksen" });

    await user.pointer({ keys: "[TouchA]", target: term });
    expect(term).toHaveAttribute("aria-expanded", "true");
    await user.pointer({ keys: "[TouchA]", target: term });
    expect(term).toHaveAttribute("aria-expanded", "false");

    await user.pointer({ keys: "[TouchA]", target: term });
    expect(term).toHaveAttribute("aria-expanded", "true");
    await user.pointer({ keys: "[TouchA]", target: within(card).getByText(pe.question) });
    expect(term).toHaveAttribute("aria-expanded", "false");
  });

  it("tunnusluvun ikkunassa on linkki korttiin", async () => {
    const { user, card } = renderCard();
    const term = within(card).getByRole("button", { name: "EPS" });
    await user.click(term);

    const popup = document.getElementById(term.getAttribute("aria-describedby")!)!;
    expect(popup).toHaveTextContent("Osakekohtainen tulos");
    expect(within(popup).getByRole("link", { name: "Siirry korttiin →" })).toHaveAttribute(
      "href",
      "#eps",
    );
  });
});

describe("MetricCard: lyhenteen selitys", () => {
  it("näkyy, kun nimeä napautetaan", async () => {
    const { user, card } = renderCard();
    const name = within(card).getByRole("button", { name: "P/E-luku" });
    await user.click(name);
    expect(document.getElementById(name.getAttribute("aria-describedby")!)).toHaveTextContent(
      "Price / Earnings = hinta suhteessa tulokseen",
    );
  });
});

describe("CompanionChips", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("perustelu on liitetty merkintään ja tulee näkyviin kohdistettaessa", () => {
    const { card } = renderCard();
    const chip = within(card).getByRole("link", { name: "PEG" });
    const reason = document.getElementById(chip.getAttribute("aria-describedby")!)!;
    expect(reason).toHaveTextContent("Kertoo, selittyykö korkea P/E nopealla kasvulla.");
    expect(reason).not.toBeVisible();

    act(() => chip.focus());
    expect(reason).toBeVisible();
    act(() => chip.blur());
    expect(reason).not.toBeVisible();
  });

  it("pitkä painallus näyttää perustelun eikä siirry korttiin", () => {
    vi.useFakeTimers();
    render(<MetricCard metric={pe} />);
    const chip = screen.getByRole("link", { name: "PEG" });
    const reason = document.getElementById(chip.getAttribute("aria-describedby")!)!;

    fireEvent.pointerDown(chip, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.pointerUp(chip, { pointerType: "touch" });
    expect(reason).toBeVisible();

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      chip.dispatchEvent(click);
    });
    expect(click.defaultPrevented).toBe(true);
  });
});
