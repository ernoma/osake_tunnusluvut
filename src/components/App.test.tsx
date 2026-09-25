import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { categories, displayName, groupByCategory, metrics, metricsById } from "../data/content.ts";
import { HIGHLIGHT_ATTR, HIGHLIGHT_MS } from "../hooks/useCardNavigation.ts";
import App from "./App.tsx";

function card(id: string) {
  return screen.getByRole("article", { name: displayName(metricsById.get(id)!) });
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
});

describe("App", () => {
  it("näyttää otsikon ja vastuuvapauslausekkeen", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Osakkeen tunnusluvut");
    expect(screen.getByText(/ei sijoitusneuvontaa/)).toBeInTheDocument();
  });
});

describe("MetricGrid", () => {
  it("ryhmittelee kortit kysymysotsikoiden alle kategorioiden järjestyksessä", () => {
    render(<App />);
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

describe("Siirtyminen korttiin", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("linkki P/E → PEG vierittää PEG-korttiin, kohdistaa ja korostaa sen hetkeksi", async () => {
    const user = userEvent.setup();
    render(<App />);
    const peg = card("peg");

    await user.click(within(card("pe")).getByRole("link", { name: "PEG" }));

    expect(peg.scrollIntoView).toHaveBeenCalledOnce();
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toBe(peg);
    expect(peg).toHaveFocus();
    expect(peg).toHaveAttribute(HIGHLIGHT_ATTR);
    expect(window.location.hash).toBe("#peg");
  });

  it("korostus poistuu hetken kuluttua ja uusi linkki siirtää korostuksen", () => {
    vi.useFakeTimers();
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
    const user = userEvent.setup();
    render(<App />);
    const term = within(card("pe")).getByRole("button", { name: "EPS" });
    await user.click(term);
    await user.click(screen.getByRole("link", { name: "Siirry korttiin →" }));

    expect(card("eps")).toHaveFocus();
    expect(term).toHaveAttribute("aria-expanded", "false");
  });

  it("sivu, joka avataan kortin osoitteella, vierittää korttiin", () => {
    window.history.replaceState(null, "", "/#ev");
    render(<App />);
    expect(card("ev")).toHaveFocus();
    expect(card("ev")).toHaveAttribute(HIGHLIGHT_ATTR);
  });

  it("Takaisin-painike (hashchange) vie edelliseen korttiin", () => {
    render(<App />);
    act(() => {
      window.history.replaceState(null, "", "/#eps");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(card("eps")).toHaveFocus();
  });

  it("jättää Ctrl-klikkauksen selaimelle, jotta kortin voi avata uuteen välilehteen", () => {
    render(<App />);
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
