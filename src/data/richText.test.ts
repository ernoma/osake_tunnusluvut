import { describe, expect, it } from "vitest";
import {
  hasMalformedMarkup,
  normalizeKey,
  parseRichText,
  termKeys,
  toPlainText,
} from "./richText.ts";

describe("parseRichText", () => {
  it("palauttaa pelkän tekstin sellaisenaan", () => {
    expect(parseRichText("Tavallinen lause.")).toEqual([
      { kind: "text", text: "Tavallinen lause." },
    ]);
  });

  it("tunnistaa termin ja taivutetun muodon", () => {
    expect(parseRichText("Osa [[oma pääoma|omasta pääomasta]] ja [[EPS]].")).toEqual([
      { kind: "text", text: "Osa " },
      { kind: "term", key: "oma pääoma", label: "omasta pääomasta" },
      { kind: "text", text: " ja " },
      { kind: "term", key: "EPS", label: "EPS" },
      { kind: "text", text: "." },
    ]);
  });

  it("toimii, kun termi on kiinni sanassa", () => {
    expect(toPlainText("kasvu[[ennuste]]")).toBe("kasvuennuste");
    expect(toPlainText("[[EV/EBIT]]-lukua")).toBe("EV/EBIT-lukua");
  });
});

describe("apufunktiot", () => {
  it("toPlainText poistaa merkinnät", () => {
    expect(toPlainText("Maksat [[nettotulos|tuloksen]] kymmenkertaisesti.")).toBe(
      "Maksat tuloksen kymmenkertaisesti.",
    );
  });

  it("termKeys normalisoi kirjainkoon ja välit", () => {
    expect(termKeys("[[ Oma Pääoma |x]] ja [[P/E]]")).toEqual(["oma pääoma", "p/e"]);
    expect(normalizeKey("  ÄÖ ")).toBe("äö");
  });

  it("hasMalformedMarkup löytää rikkinäiset merkinnät", () => {
    expect(hasMalformedMarkup("[[ok]] ja [[ok|muoto]]")).toBe(false);
    expect(hasMalformedMarkup("[[puuttuu loppu")).toBe(true);
    expect(hasMalformedMarkup("puuttuu alku]]")).toBe(true);
    expect(hasMalformedMarkup("[[]]")).toBe(true);
  });
});
