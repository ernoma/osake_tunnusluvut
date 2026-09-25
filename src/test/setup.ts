import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom ei toteuta vieritystä.
Element.prototype.scrollIntoView = vi.fn();

beforeEach(() => {
  // Jokainen testi alkaa ensimmäisenä käyntinä tyhjästä osoitteesta.
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
});

afterEach(() => {
  cleanup();
});
