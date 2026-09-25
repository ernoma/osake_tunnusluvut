// Siirtyminen korttiin. Kun sivulla klikataan sisäistä #id-linkkiä, joka osoittaa tunnuslukuun
// (rinnakkaismerkintä, perustelulista, sanastoikkunan "Siirry korttiin" tai johdannon askel),
// kortti vieritetään näkyviin, kohdistus siirtyy siihen ja kortti korostetaan hetkeksi. Sama
// tapahtuu, kun sivu avataan kortin osoitteella (#pe) tai selaimen Takaisin-painike palaa siihen.
//
// Jos suodatin tai haku piilottaa kortin, reveal-funktio muuttaa suodattimia, ja vieritys
// tehdään, kun kortti on piirretty.

import { useEffect, useLayoutEffect, useRef } from "react";
import { metricsById } from "../data/content.ts";

/** Korostuksen kesto. Sama kuin MetricCard.module.css:n korostusanimaation kesto. */
export const HIGHLIGHT_MS = 2000;
/** Korostettavan kortin attribuutti, jonka MetricCard.module.css tyylittää. */
export const HIGHLIGHT_ATTR = "data-highlighted";

interface GoToOptions {
  /** Välitön vieritys pehmeän sijaan. */
  instant?: boolean;
}

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

/** Korostettuna oleva kortti ja ajastin, joka poistaa korostuksen. */
interface Highlight {
  card: HTMLElement | null;
  timer?: number;
}

function clearHighlight(highlight: Highlight) {
  window.clearTimeout(highlight.timer);
  highlight.card?.removeAttribute(HIGHLIGHT_ATTR);
  highlight.card = null;
}

function goTo(card: HTMLElement, highlight: Highlight, { instant = false }: GoToOptions = {}) {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ behavior: instant || reduceMotion ? "instant" : "smooth", block: "start" });
  // Näppäimistön ja ruudunlukijan käyttäjä jatkaa kortista, johon linkki vei.
  card.focus({ preventScroll: true });

  clearHighlight(highlight);
  // Pakotettu asettelu käynnistää animaation alusta, jos sama kortti oli juuri korostettuna.
  void card.offsetWidth;
  card.setAttribute(HIGHLIGHT_ATTR, "");
  highlight.card = card;
  highlight.timer = window.setTimeout(() => clearHighlight(highlight), HIGHLIGHT_MS);
}

/** @param reveal Tuo piilotetun tunnusluvun näkyviin, esim. nollaamalla suodattimen. */
export function useCardNavigation(reveal?: (id: string) => void) {
  const revealRef = useRef(reveal);
  const pending = useRef<{ id: string; options: GoToOptions } | null>(null);
  const highlight = useRef<Highlight>({ card: null });

  useLayoutEffect(() => {
    revealRef.current = reveal;
  });

  // Suodattimen muutoksen jälkeen: kortti on nyt piirretty.
  useLayoutEffect(() => {
    const target = pending.current;
    if (!target) return;
    pending.current = null;
    const card = document.getElementById(target.id);
    if (card) goTo(card, highlight.current, target.options);
  });

  useEffect(() => {
    const currentHighlight = highlight.current;
    const navigate = (id: string, options: GoToOptions = {}) => {
      const card = document.getElementById(id);
      if (card) {
        pending.current = null;
        goTo(card, currentHighlight, options);
      } else {
        pending.current = { id, options };
        revealRef.current?.(id);
      }
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
      navigate(id);
    };

    const onHashChange = () => {
      const id = metricIdFromHash(window.location.hash);
      if (id) navigate(id);
    };

    // Sivu avattiin suoraan kortin osoitteella. Vieritys on välitön, koska selaimen oma
    // latausvieritys keskeyttäisi pehmeän vierityksen.
    const initialId = metricIdFromHash(window.location.hash);
    if (initialId) navigate(initialId, { instant: true });

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
      clearHighlight(currentHighlight);
    };
  }, []);
}
