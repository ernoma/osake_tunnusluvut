import { describe, expect, it } from "vitest";
import { readUrlState, urlWithState } from "./useUrlState.ts";

describe("readUrlState", () => {
  it("lukee haun ja kategorian", () => {
    expect(readUrlState("?q=velaton&k=arvostus")).toEqual({
      query: "velaton",
      category: "arvostus",
    });
  });

  it("ohittaa tuntemattoman kategorian", () => {
    expect(readUrlState("?k=kryptot")).toEqual({ query: "", category: null });
    expect(readUrlState("")).toEqual({ query: "", category: null });
  });
});

describe("urlWithState", () => {
  it("säilyttää korttiosoitteen ja muut parametrit", () => {
    expect(
      urlWithState("http://x.fi/opas/?muu=1#pe", { query: "oma pääoma", category: "velka" }),
    ).toBe("/opas/?muu=1&q=oma+p%C3%A4%C3%A4oma&k=velka#pe");
  });

  it("poistaa tyhjät arvot osoitteesta", () => {
    expect(urlWithState("http://x.fi/?q=a&k=velka#ev", { query: "", category: null })).toBe("/#ev");
  });

  it("toimii lukemisen kanssa edestakaisin", () => {
    const state = { query: "P/E & kasvu", category: "arvostus" as const };
    const url = urlWithState("http://x.fi/", state);
    expect(readUrlState(url.slice(url.indexOf("?")))).toEqual(state);
  });
});
