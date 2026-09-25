import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom ei toteuta vieritystä.
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
});
