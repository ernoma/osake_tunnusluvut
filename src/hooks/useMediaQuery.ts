// Mediakyselyn tila, joka päivittyy, kun ikkunan koko tai asetus muuttuu.

import { useEffect, useState } from "react";

/** @param fallback Arvo, jos selain (tai jsdom) ei tue matchMediaa. */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? fallback);

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
