// Haku ja kategoria osoitteessa (?q=velka&k=arvostus), jotta näkymän voi jakaa linkkinä.
// Kirjoittaminen korvaa nykyisen historiamerkinnän, jottei jokainen näppäily jää historiaan.

import { useCallback, useEffect, useState } from "react";
import { CATEGORY_IDS, type CategoryId } from "../data/types.ts";

export interface UrlState {
  query: string;
  /** null = kaikki kategoriat. */
  category: CategoryId | null;
}

const QUERY_PARAM = "q";
const CATEGORY_PARAM = "k";

function isCategoryId(value: string | null): value is CategoryId {
  return (CATEGORY_IDS as readonly (string | null)[]).includes(value);
}

export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const category = params.get(CATEGORY_PARAM);
  return {
    query: params.get(QUERY_PARAM) ?? "",
    category: isCategoryId(category) ? category : null,
  };
}

/** Osoite, jossa tila on päivitetty. Muut parametrit ja #kortti säilyvät. */
export function urlWithState(href: string, { query, category }: UrlState): string {
  const url = new URL(href);
  if (query) url.searchParams.set(QUERY_PARAM, query);
  else url.searchParams.delete(QUERY_PARAM);
  if (category) url.searchParams.set(CATEGORY_PARAM, category);
  else url.searchParams.delete(CATEGORY_PARAM);
  return url.pathname + url.search + url.hash;
}

/** Poistaa osoitteesta kortin (#pe), kun käyttäjä vaihtaa näkymää, joka voi piilottaa sen. */
export function forgetCardInUrl() {
  if (!window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", pathname + search);
}

export function useUrlState(): [UrlState, (next: UrlState) => void] {
  const [state, setState] = useState(() => readUrlState(window.location.search));

  const update = useCallback((next: UrlState) => {
    setState(next);
    window.history.replaceState(window.history.state, "", urlWithState(window.location.href, next));
  }, []);

  // Selaimen Takaisin- ja Eteenpäin-painikkeet.
  useEffect(() => {
    const onPopState = () => setState(readUrlState(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [state, update];
}
