// Automaattinen saavutettavuustarkistus (axe) koko sovellukselle eri tiloissa.
// Kontrastit tarkistetaan erikseen (styles/contrast.test.ts), koska jsdom ei laske tyylejä.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { violations } from "../test/axe.ts";
import { describe, expect, it } from "vitest";
import App, { STORAGE_KEYS } from "./App.tsx";

// axe käy koko sivun läpi, joten rinnakkain ajettuna oletusraja (5 s) voi ylittyä.
describe("saavutettavuus (axe)", { timeout: 20_000 }, () => {
  it("ensimmäinen käynti johdannon kanssa", async () => {
    render(<App />);
    expect(await violations()).toEqual([]);
  });

  it("avattu kortti, avoin sanastoikkuna ja tumma teema", async () => {
    window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Tumma teema" }));
    const card = screen.getByRole("article", { name: "P/E-luku" });
    await user.click(within(card).getByRole("button", { name: /Lisää/ }));
    within(card).getAllByRole("button", { expanded: false })[0]?.focus();
    await user.keyboard("{Enter}");

    expect(await violations()).toEqual([]);
  });

  it("haku ilman osumia", async () => {
    window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "xyzzy");
    expect(await violations()).toEqual([]);
  });
});
