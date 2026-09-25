// Siirtyminen korttiin. Kun sivulla klikataan sisäistä #id-linkkiä, joka osoittaa tunnuslukuun
// (rinnakkaismerkintä, perustelulista tai sanastoikkunan "Siirry korttiin"), kortti vieritetään
// näkyviin, kohdistus siirtyy siihen ja kortti korostetaan hetkeksi. Sama tapahtuu, kun sivu
// avataan kortin osoitteella (#pe) tai selaimen Takaisin-painike palaa siihen.

import { useEffect } from "react";
import { metricsById } from "../data/content.ts";

/** Korostuksen kesto. Sama kuin MetricCard.module.css:n korostusanimaation kesto. */
export const HIGHLIGHT_MS = 2000;
/** Korostettavan kortin attribuutti, jonka MetricCard.module.css tyylittää. */
export const HIGHLIGHT_ATTR = "data-highlighted";

/** "#pe" → "pe", jos sellainen tunnusluku on olemassa. */
function metricIdFromHash(hash: string): string | undefined {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return undefined;
  }
  return metricsById.has(id) ? id : undefined;
}

export function useCardNavigation() {
  useEffect(() => {
    let timer: number | undefined;
    let highlighted: HTMLElement | null = null;

    const clearHighlight = () => {
      window.clearTimeout(timer);
      highlighted?.removeAttribute(HIGHLIGHT_ATTR);
      highlighted = null;
    };

    const goTo = (id: string, { instant = false } = {}) => {
      const card = document.getElementById(id);
      if (!card) return;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const behavior = instant || reduceMotion ? "instant" : "smooth";
      card.scrollIntoView({ behavior, block: "start" });
      // Näppäimistön ja ruudunlukijan käyttäjä jatkaa kortista, johon linkki vei.
      card.focus({ preventScroll: true });

      clearHighlight();
      // Pakotettu asettelu käynnistää animaation alusta, jos sama kortti oli juuri korostettuna.
      void card.offsetWidth;
      card.setAttribute(HIGHLIGHT_ATTR, "");
      highlighted = card;
      timer = window.setTimeout(clearHighlight, HIGHLIGHT_MS);
    };

    const onClick = (e: MouseEvent) => {
      // Uuteen välilehteen avaaminen ja komponentin itse estämä klikkaus jätetään rauhaan.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href^='#']") : null;
      const id = link && metricIdFromHash(link.getAttribute("href") ?? "");
      if (!id) return;

      // Selaimen oma hyppy estetään, jotta vieritys on pehmeä ja sama linkki toimii uudelleen.
      e.preventDefault();
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
      goTo(id);
    };

    const onHashChange = () => {
      const id = metricIdFromHash(window.location.hash);
      if (id) goTo(id);
    };

    // Sivu avattiin suoraan kortin osoitteella. Vieritys on välitön, koska selaimen oma
    // latausvieritys keskeyttäisi pehmeän vierityksen.
    const initialId = metricIdFromHash(window.location.hash);
    if (initialId) goTo(initialId, { instant: true });
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
      clearHighlight();
    };
  }, []);
}
