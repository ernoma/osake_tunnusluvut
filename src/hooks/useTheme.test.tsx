import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Header from "../components/Header.tsx";
import { THEME_STORAGE_KEY } from "./useTheme.ts";

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderHeader() {
  const user = userEvent.setup();
  render(<Header page="tunnusluvut" onNavigate={() => {}} />);
  return { user, toggle: screen.getByRole("button", { name: "Tumma teema" }) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe("teemavalitsin", () => {
  it("seuraa järjestelmän asetusta, kunnes käyttäjä valitsee itse", () => {
    mockSystemDark(true);
    const { toggle } = renderHeader();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("vaihtaa teeman ja muistaa valinnan", async () => {
    mockSystemDark(false);
    const { user, toggle } = renderHeader();
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("käyttää tallennettua valintaa järjestelmän asetuksen sijaan", () => {
    mockSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    const { toggle } = renderHeader();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
