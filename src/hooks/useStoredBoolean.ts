// Käyttäjän valinta, joka muistetaan selaimessa (localStorage). Jos tallennus ei ole
// käytettävissä (esim. yksityinen ikkuna), valinta toimii silti tämän käynnin ajan.

import { useCallback, useState } from "react";

function read(key: string, defaultValue: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? defaultValue : stored === "true";
  } catch {
    return defaultValue;
  }
}

export function useStoredBoolean(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(() => read(key, defaultValue));

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Valinta unohtuu, kun sivu suljetaan. Muuten kaikki toimii.
      }
    },
    [key],
  );

  return [value, update] as const;
}
