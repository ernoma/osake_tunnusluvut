// Yhteinen axe-tarkistus komponenttitesteille. Tarkistus ajetaan koko dokumentille eikä vain
// renderöidylle säiliölle, jotta myös maamerkkien ulkopuolelle jäänyt sisältö (region) löytyy.
// Kontrastit tarkistetaan erikseen (styles/contrast.test.ts), koska jsdom ei laske tyylejä.

import axe from "axe-core";

export async function violations(): Promise<string[]> {
  const results = await axe.run(document, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
}
