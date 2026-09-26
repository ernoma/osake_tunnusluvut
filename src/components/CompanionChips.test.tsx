import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CompanionChips, { CompanionReasons } from "./CompanionChips.tsx";

// Nykyisessä sisällössä ei ole "tulossa"-tunnuslukuja, joten testi lisää yhden.
vi.mock("../data/planned.ts", () => ({
  planned: [
    {
      id: "osakekohtainen-kassavirta",
      name: "Osakekohtainen kassavirta",
      category: "kannattavuus",
    },
  ],
}));

const companions = [
  { id: "eps", reason: "Olemassa oleva tunnusluku." },
  { id: "osakekohtainen-kassavirta", reason: "Kertoo, jääkö yhtiölle oikeaa rahaa." },
  { id: "ei-olemassa", reason: "Tuntematon viittaus ohitetaan." },
];

describe("CompanionChips", () => {
  it("näyttää olemassa olevan luvun linkkinä ja tulevan harmaana ilman linkkiä", () => {
    render(<CompanionChips companions={companions} />);

    expect(screen.getByRole("link", { name: "EPS" })).toHaveAttribute("href", "#eps");
    const planned = screen.getByText("Osakekohtainen kassavirta");
    expect(planned.closest("a")).toBeNull();
    expect(planned).toHaveTextContent("tulossa");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("perustelulistassa tuleva luku on merkitty", () => {
    render(<CompanionReasons companions={companions} />);
    expect(screen.getByText("Osakekohtainen kassavirta (tulossa)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /EPS/ })).toHaveAttribute("href", "#eps");
  });
});
