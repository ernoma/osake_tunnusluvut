// Sivun valinta osoitteessa (?sivu=tutki). Osoitteen #-osa on korttilinkkien käytössä (#pe),
// joten sivu valitaan kyselyparametrilla. Sivun vaihto lisää historiaan uuden merkinnän, jotta
// selaimen Takaisin-painike palaa edelliselle sivulle.

import { useCallback, useEffect, useState } from "react";

export const PAGES = ["tunnusluvut", "tutki"] as const;
export type Page = (typeof PAGES)[number];

export const PAGE_PARAM = "sivu";

export const PAGE_TITLES: Record<Page, string> = {
  tunnusluvut: "Tunnusluvut",
  tutki: "Tutki osaketta",
};

const DOCUMENT_TITLES: Record<Page, string> = {
  tunnusluvut: "Osakkeen tunnusluvut",
  tutki: "Tutki osaketta – Osakkeen tunnusluvut",
};

export function readPage(search: string): Page {
  return new URLSearchParams(search).get(PAGE_PARAM) === "tutki" ? "tutki" : "tunnusluvut";
}

/** Sivun osoite ilman muita parametreja: "/opas/" tai "/opas/?sivu=tutki". */
export function pageHref(page: Page, pathname = window.location.pathname): string {
  return page === "tutki" ? `${pathname}?${PAGE_PARAM}=tutki` : pathname;
}

export function usePage(): [Page, (page: Page) => void] {
  const [page, setPage] = useState(() => readPage(window.location.search));

  const navigate = useCallback((next: Page) => {
    window.history.pushState(null, "", pageHref(next));
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPopState = () => setPage(readPage(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.title = DOCUMENT_TITLES[page];
  }, [page]);

  return [page, navigate];
}
