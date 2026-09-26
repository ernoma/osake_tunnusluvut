import { describe, expect, it } from "vitest";
import {
  MAX_RECENT,
  readRecent,
  RECENT_STORAGE_KEY,
  withRecent,
  type RecentAnalysis,
} from "./useRecentAnalyses.ts";

const entry = (key: string, search = `?sivu=tutki&nimi=${key}`): RecentAnalysis => ({
  key,
  name: key,
  date: "2026-09-26",
  search,
});

describe("withRecent", () => {
  it("lisää uusimman alkuun ja pitää enintään viisi", () => {
    let list: RecentAnalysis[] = [];
    for (const key of ["a", "b", "c", "d", "e", "f"]) list = withRecent(list, entry(key));
    expect(list.map((r) => r.key)).toEqual(["f", "e", "d", "c", "b"]);
    expect(list).toHaveLength(MAX_RECENT);
  });

  it("korvaa saman tunnisteen rivin ja siirtää sen alkuun", () => {
    const list = withRecent([entry("a"), entry("b")], { ...entry("b"), name: "Uusi nimi" });
    expect(list.map((r) => [r.key, r.name])).toEqual([
      ["b", "Uusi nimi"],
      ["a", "a"],
    ]);
  });

  it("korvaa rivin, jolla on sama osoite", () => {
    const list = withRecent([entry("a", "?x")], entry("b", "?x"));
    expect(list.map((r) => r.key)).toEqual(["b"]);
  });
});

describe("readRecent", () => {
  it("ohittaa virheellisen tallenteen", () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, "{rikki");
    expect(readRecent()).toEqual([]);
    window.localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([entry("a"), { key: 1 }, { ...entry("b"), search: "javascript:alert(1)" }]),
    );
    expect(readRecent()).toEqual([entry("a")]);
  });
});
