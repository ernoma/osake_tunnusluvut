// Pieni selitysikkuna: aukeaa hiirellä kohdistimen ollessa päällä, napautuksella ja
// näppäimistöllä (painike + Enter). Esc ja klikkaus ikkunan ulkopuolelle sulkevat sen.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const HOVER_CLOSE_DELAY_MS = 150;
/** Näin lähelle näkymän reunaa ikkuna saa tulla. */
const VIEWPORT_MARGIN_PX = 8;

export function usePopover<Root extends HTMLElement = HTMLSpanElement>() {
  const id = useId();
  const [open, setOpen] = useState(false);
  // Klikkauksella tai napautuksella avattu ikkuna ei sulkeudu, kun hiiri siirtyy pois.
  const pinned = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<Root>(null);
  const popupRef = useRef<HTMLSpanElement>(null);

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  const close = useCallback(() => {
    cancelClose();
    pinned.current = false;
    setOpen(false);
  }, []);

  const show = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, []);

  const toggle = () => {
    if (open && pinned.current) {
      close();
    } else {
      pinned.current = true;
      show();
    }
  };

  const hoverProps = {
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") show();
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType !== "mouse" || pinned.current) return;
      cancelClose();
      closeTimer.current = window.setTimeout(close, HOVER_CLOSE_DELAY_MS);
    },
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const root = rootRef.current;
      const hadFocus = root?.contains(document.activeElement) ?? false;
      close();
      // Palautetaan kohdistus avaavaan painikkeeseen, jos se oli ikkunan sisällä.
      if (hadFocus) root?.querySelector<HTMLElement>("button, a")?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => cancelClose, []);

  // Siirretään ikkunaa vasemmalle, jos se menisi näkymän oikean reunan yli.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!open || !popup) return;
    popup.style.translate = "";
    const overflow = popup.getBoundingClientRect().right - (window.innerWidth - VIEWPORT_MARGIN_PX);
    const roomOnLeft = popup.getBoundingClientRect().left - VIEWPORT_MARGIN_PX;
    if (overflow > 0) popup.style.translate = `${-Math.min(overflow, roomOnLeft)}px 0`;
  }, [open]);

  return { id, open, show, close, toggle, hoverProps, rootRef, popupRef };
}
