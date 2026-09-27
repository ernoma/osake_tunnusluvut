import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom ei toteuta vieritystä.
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn() as typeof window.scrollTo;

// Samat dokumentin tiedot kuin index.html:ssä, jotta axe voi tarkistaa koko dokumentin.
document.documentElement.lang = "fi";
document.title = "Osakkeen tunnusluvut";

beforeEach(() => {
  // Jokainen testi alkaa ensimmäisenä käyntinä tyhjästä osoitteesta.
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
  // Testit eivät käytä verkkoa. Testi, joka tarvitsee vastauksen, korvaa fetchin itse.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("Testeissä ei ole verkkoa"))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
