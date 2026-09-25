// Vaalea ja tumma teema. Oletuksena seurataan järjestelmän asetusta. Kun käyttäjä vaihtaa
// teeman itse, valinta muistetaan selaimessa ja asetetaan <html data-theme>-attribuuttiin.
// index.html asettaa saman attribuutin jo ennen Reactia, jotta sivu ei välähdä väärän värisenä.

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "tunnusluvut.teema";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStored(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

export function useTheme() {
  const [chosen, setChosen] = useState<Theme | null>(readStored);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = chosen ?? system;

  // Järjestelmän teeman vaihtuminen näkyy heti, jos käyttäjä ei ole valinnut teemaa itse.
  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return;
    const onChange = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (chosen) root.dataset.theme = chosen;
    else delete root.dataset.theme;
  }, [chosen]);

  const setTheme = useCallback((next: Theme) => {
    setChosen(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Valinta unohtuu, kun sivu suljetaan. Muuten kaikki toimii.
    }
  }, []);

  return [theme, setTheme] as const;
}
