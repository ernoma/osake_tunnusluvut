// Automaattinen saavutettavuustarkistus (axe) koko sovellukselle eri tiloissa.
// Kontrastit tarkistetaan erikseen (styles/contrast.test.ts), koska jsdom ei laske tyylejä.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import App, { STORAGE_KEYS } from "./App.tsx";

async function violations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
}

describe("saavutettavuus (axe)", () => {
  it("ensimmäinen käynti johdannon kanssa", async () => {
    const { container } = render(<App />);
    expect(await violations(container)).toEqual([]);
  });

  it("avattu kortti, avoin sanastoikkuna ja tumma teema", async () => {
    window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "Tumma teema" }));
    const card = screen.getByRole("article", { name: "P/E-luku" });
    await user.click(within(card).getByRole("button", { name: /Lisää/ }));
    within(card).getAllByRole("button", { expanded: false })[0]?.focus();
    await user.keyboard("{Enter}");

    expect(await violations(container)).toEqual([]);
  });

  it("haku ilman osumia", async () => {
    window.localStorage.setItem(STORAGE_KEYS.introClosed, "true");
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.type(screen.getByRole("searchbox"), "xyzzy");
    expect(await violations(container)).toEqual([]);
  });
});
