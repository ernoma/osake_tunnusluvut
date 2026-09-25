// Lisälukemista-linkkien tarkistus: `npm run check-links`.
//
// Tarkistaa, että jokainen metrics.ts:n linkki vastaa ilman virhettä ja että uudelleenohjaukset
// pysyvät sivuston omassa verkkotunnuksessa (sources.ts). Tulostaa ongelmalliset linkit ja
// päättyy virhekoodiin 1, jos yksikin linkki on rikki.
//
// Ei ole osa `npm test`:iä, koska yksittäinen hidas tai tilapäisesti alhaalla oleva sivusto ei
// saa kaataa buildia. Ks. TOTEUTUSSUUNNITELMA.md, kohta 6.7.

import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// Rehellinen tunniste. Selaimeksi naamioitunut User-Agent saa osalta sivustoista (esim.
// Investopedia) vastauksen 402, joten sitä ei käytetä.
const USER_AGENT = "osake-tunnusluvut-linkkitarkistus/1.0";
const TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const CONCURRENCY = 4;
const RETRIES = 2;

const root = fileURLToPath(new URL("..", import.meta.url));

/** Ladataan TypeScript-data Viten kautta, jotta tiedot ovat samat kuin sovelluksessa. */
async function loadContent() {
  const vite = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { metrics } = await vite.ssrLoadModule("/src/data/metrics.ts");
    const { sources } = await vite.ssrLoadModule("/src/data/sources.ts");
    const { hostMatches } = await vite.ssrLoadModule("/src/data/validate.ts");
    return { metrics, sources, hostMatches };
  } finally {
    await vite.close();
  }
}

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*;q=0.8" },
    });
    // Vastauksen runkoa ei tarvita. Suljetaan yhteys, jotta prosessi ei jää odottamaan.
    await res.body?.cancel();
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** HEAD ensin, GET jos palvelin ei tue HEAD-pyyntöä kunnolla. */
async function probe(url) {
  const head = await request(url, "HEAD");
  if (head.status < 400) return head;
  return request(url, "GET");
}

const isRetryable = (status) => status === 429 || status >= 500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Seuraa uudelleenohjauksia käsin, jotta jokainen välietappi voidaan tarkistaa.
 * Palauttaa { ok, status, finalUrl, redirected, problem }.
 */
async function checkUrl(url, domain, hostMatches) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await probe(current);
        if (!isRetryable(res.status) || attempt >= RETRIES) break;
      } catch (err) {
        if (attempt >= RETRIES) {
          const reason = err.name === "AbortError" ? `aikakatkaisu ${TIMEOUT_MS / 1000} s` : err;
          return { ok: false, problem: `ei vastausta (${reason.cause?.code ?? reason})` };
        }
      }
      await sleep(1000 * (attempt + 1));
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false, status: res.status, problem: "ohjaus ilman osoitetta" };
      const next = new URL(location, current).href;
      if (!hostMatches(next, domain)) {
        return {
          ok: false,
          status: res.status,
          problem: `ohjautuu toiselle verkkotunnukselle: ${next}`,
        };
      }
      current = next;
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status, finalUrl: current, redirected: current !== url };
    }
    return { ok: false, status: res.status, problem: `HTTP ${res.status}` };
  }
  return { ok: false, problem: `yli ${MAX_REDIRECTS} uudelleenohjausta` };
}

/** Ajaa tehtävät rinnakkain, enintään `limit` kerrallaan. */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const { metrics, sources, hostMatches } = await loadContent();
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  // Sama osoite voi olla usealla tunnusluvulla. Tarkistetaan se vain kerran.
  const byUrl = new Map();
  for (const m of metrics) {
    for (const link of m.links) {
      const url = link.url.split("#")[0];
      const entry = byUrl.get(url) ?? { url, sourceId: link.sourceId, usedBy: [] };
      entry.usedBy.push(m.id);
      byUrl.set(url, entry);
    }
  }
  const entries = [...byUrl.values()];
  console.log(`Tarkistetaan ${entries.length} osoitetta…\n`);

  const results = await mapLimit(entries, CONCURRENCY, async (entry) => {
    const source = sourceById.get(entry.sourceId);
    if (!source) return { ...entry, ok: false, problem: `tuntematon sivusto "${entry.sourceId}"` };
    return { ...entry, ...(await checkUrl(entry.url, source.domain, hostMatches)) };
  });

  const broken = results.filter((r) => !r.ok);
  const moved = results.filter((r) => r.ok && r.redirected);

  for (const r of results) {
    const mark = !r.ok ? "✗" : r.redirected ? "→" : "✓";
    console.log(`${mark} ${r.status ?? "---"} ${r.url}`);
  }

  if (moved.length > 0) {
    console.log(
      `\nOhjautuu samassa verkkotunnuksessa (${moved.length}). Päivitä osoite metrics.ts:ään:`,
    );
    for (const r of moved) console.log(`  ${r.url}\n    → ${r.finalUrl}  [${r.usedBy.join(", ")}]`);
  }

  if (broken.length > 0) {
    console.log(`\nOngelmallisia linkkejä ${broken.length}:`);
    for (const r of broken) console.log(`  ${r.url}\n    ${r.problem}  [${r.usedBy.join(", ")}]`);
    console.log("\nKorvaa rikkinäinen linkki toisella tai poista se (kohta 6.7).");
    process.exitCode = 1;
  } else {
    console.log(`\nKaikki ${results.length} osoitetta vastasivat.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
