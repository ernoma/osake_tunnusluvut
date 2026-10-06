// Poiminnan laatu oikeaa mallia vasten (suunnitelman kohta 11.9). Ei osa npm test:iä, koska
// jokainen ajo maksaa. Aja, kun kehotetta tai mallia muutetaan:
//
//   ANTHROPIC_API_KEY=sk-ant-… npm run eval-extract
//   ANTHROPIC_API_KEY=sk-ant-… EVAL_MODEL=claude-haiku-4-5 npm run eval-extract
//   ANTHROPIC_API_KEY=sk-ant-… EVAL_RUNS=3 npm run eval-extract
//
// Jokaisesta testitekstistä pitää poimia kaikki odotetut luvut oikein, eikä vastauksessa saa
// olla keksittyjä lainauksia. Tulos vaihtelee ajosta toiseen, joten EVAL_RUNS ajaa jokaisen
// tekstin useamman kerran (oletus 1).

import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, modelById, MODELS, type ModelId } from "./apiKey.ts";
import { extractFigures } from "./extract.ts";
import { fixtures } from "./fixtures/index.ts";
import { quoteHasLabel } from "./verify.ts";

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
const apiKey = env?.ANTHROPIC_API_KEY;
const modelId = (env?.EVAL_MODEL ?? DEFAULT_MODEL) as ModelId;

const runs = Number(env?.EVAL_RUNS ?? 1);

if (!MODELS.some((m) => m.id === modelId)) {
  throw new Error(`Tuntematon EVAL_MODEL: ${modelId}. Vaihtoehdot: ${MODELS.map((m) => m.id)}`);
}
if (!Number.isInteger(runs) || runs < 1) {
  throw new Error(`EVAL_RUNS pitää olla positiivinen kokonaisluku, nyt: ${env?.EVAL_RUNS}`);
}

const cases = fixtures.flatMap((f) =>
  Array.from(
    { length: runs },
    (_, i) => [runs > 1 ? `${f.site} (ajo ${i + 1}/${runs})` : f.site, f] as const,
  ),
);

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(b) * 1e-6, 1e-9);
}

describe.skipIf(!apiKey)(`poiminta mallilla ${modelId}`, { timeout: 180_000 }, () => {
  it.each(cases)("%s", async (label, fixture) => {
    const result = await extractFigures(fixture.text, undefined, {
      apiKey,
      model: modelById(modelId),
    });

    const problems: string[] = [];
    for (const expected of fixture.expected) {
      const found = result.values.find((v) => v.id === expected.id);
      if (!found) problems.push(`puuttuu: ${expected.id} = ${expected.value}`);
      else if (!close(found.value, expected.value))
        problems.push(`väärä arvo: ${expected.id} = ${found.value}, odotettu ${expected.value}`);
      else if (found.check !== "ok")
        problems.push(`tarkistettava: ${expected.id} (${found.warning}) "${found.quote}"`);
      else if (expected.period && found.period !== expected.period)
        problems.push(`kausi: ${expected.id} = ${found.period}, odotettu ${expected.period}`);
      else if ((found.currency ?? null) !== (expected.currency ?? null))
        problems.push(
          `valuutta: ${expected.id} = ${found.currency ?? "-"}, odotettu ${expected.currency ?? "-"}`,
        );
    }
    for (const v of result.values) {
      // Kurssi on sivun yläosassa usein ilman otsikkoa (Yahoo: "128.44"), joten nimeä ei ole.
      if (v.id !== "kurssi" && !quoteHasLabel(v.quote))
        problems.push(`lainauksessa ei nimeä: ${v.id} "${v.quote}"`);
    }
    for (const r of result.rejected) {
      problems.push(`hylätty (${r.reason}): ${r.id} = ${r.value} "${r.quote}"`);
    }
    const extra = result.values.filter((v) => !fixture.expected.some((e) => e.id === v.id));

    console.log(
      [
        `${label}: ${result.values.length} lukua, ${problems.length} ongelmaa`,
        ...problems.map((p) => `  ✗ ${p}`),
        ...extra.map((v) => `  + ylimääräinen: ${v.id} = ${v.value} "${v.quote}"`),
        ...result.notes.map((n) => `  · ${n}`),
      ].join("\n"),
    );

    expect(problems).toEqual([]);
    expect(result.company.currency).toBe(fixture.company.currency);
    expect(result.company.priceCurrency).toBe(fixture.company.priceCurrency);
  });
});

describe.skipIf(!!apiKey)("poiminta", () => {
  it.skip("vaatii ympäristömuuttujan ANTHROPIC_API_KEY", () => {});
});
