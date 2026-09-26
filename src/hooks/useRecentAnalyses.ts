// Viisi viimeisintä analyysiä selaimen muistissa (suunnitelman kohta 11.7). Luvut ovat
// osoitteen parametreissa, joten tallennetaan vain nimi, päivämäärä ja kyselyosa.
// Jos tallennus ei ole käytettävissä (esim. yksityinen ikkuna), lista toimii tämän käynnin ajan.

import { useCallback, useState } from "react";

export const RECENT_STORAGE_KEY = "tunnusluvut.viimeisimmat";
export const MAX_RECENT = 5;

export interface RecentAnalysis {
  /** Yksilöivä tunniste. Sama analyysi päivittyy muokattaessa eikä lisää uutta riviä. */
  key: string;
  name: string;
  /** vvvv-kk-pp tai tyhjä. */
  date: string;
  /** Osoitteen kyselyosa, esim. "?sivu=tutki&nimi=Vonovia&pe=12.4~t~2025~s". */
  search: string;
}

function isRecent(value: unknown): value is RecentAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.key === "string" &&
    typeof r.name === "string" &&
    typeof r.date === "string" &&
    typeof r.search === "string" &&
    r.search.startsWith("?")
  );
}

/** Tallennettu lista. Virheellinen tai vanhentunut tallenne ohitetaan. */
export function readRecent(): RecentAnalysis[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

/**
 * Lisää analyysin listan alkuun. Saman tunnisteen tai saman osoitteen rivi korvataan,
 * ja listaan jää enintään viisi riviä.
 */
export function withRecent(list: readonly RecentAnalysis[], entry: RecentAnalysis) {
  const others = list.filter((r) => r.key !== entry.key && r.search !== entry.search);
  return [entry, ...others].slice(0, MAX_RECENT);
}

export function newRecentKey(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function write(list: readonly RecentAnalysis[]) {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Lista unohtuu, kun sivu suljetaan. Muuten kaikki toimii.
  }
}

export function useRecentAnalyses() {
  const [recent, setRecent] = useState(readRecent);

  const save = useCallback((entry: RecentAnalysis) => {
    setRecent((list) => {
      const current = list[0];
      if (
        current?.key === entry.key &&
        current.search === entry.search &&
        current.name === entry.name &&
        current.date === entry.date
      ) {
        return list;
      }
      const next = withRecent(list, entry);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((key: string) => {
    setRecent((list) => {
      const next = list.filter((r) => r.key !== key);
      write(next);
      return next;
    });
  }, []);

  return { recent, save, remove };
}
