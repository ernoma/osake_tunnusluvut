// Poiminta oikeilta sivuilta kopioiduista teksteistä (docs/kasin-testaus.md, vaihe 11e).
// Tekstit ovat kansiossa oikeat_sivut/ (.txt), joka ei kuulu repoon, koska sivustojen tekstiä
// ei tallenneta repoon. Odotettuja lukuja ei ole, joten tuloste tarkistetaan käsin tekstiä
// vasten:
//
//   ANTHROPIC_API_KEY=sk-ant-… npm run eval-real

import { describe, it } from "vitest";
import { DEFAULT_MODEL, modelById, MODELS, type ModelId } from "./apiKey.ts";
import { extractFigures } from "./extract.ts";
import { quoteHasLabel } from "./verify.ts";

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
const apiKey = env?.ANTHROPIC_API_KEY;
const modelId = (env?.EVAL_MODEL ?? DEFAULT_MODEL) as ModelId;

if (!MODELS.some((m) => m.id === modelId)) {
  throw new Error(`Tuntematon EVAL_MODEL: ${modelId}. Vaihtoehdot: ${MODELS.map((m) => m.id)}`);
}

const texts = import.meta.glob<string>("../../oikeat_sivut/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});
const pages = Object.entries(texts).map(([path, text]) => [path.split("/").pop()!, text] as const);

function cell(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\|/g, "\\|");
}

describe.skipIf(!apiKey || pages.length === 0)(
  `oikeat sivut mallilla ${modelId}`,
  { timeout: 180_000 },
  () => {
    it.each(pages)("%s", async (file, text) => {
      const started = Date.now();
      const result = await extractFigures(text, undefined, { apiKey, model: modelById(modelId) });
      const seconds = Math.round((Date.now() - started) / 1000);
      const warnings = result.values.filter((v) => v.check !== "ok").length;
      const unlabeled = result.values.filter((v) => !quoteHasLabel(v.quote)).length;

      console.log(
        [
          `## ${file}`,
          "",
          `${result.values.length} lukua, ${warnings} ⚠, ${result.rejected.length} hylättyä, ${unlabeled} lainausta ilman nimeä, ${seconds} s. ` +
            `Yhtiö: ${result.company.name}, valuutta ${result.company.currency ?? "-"}, ` +
            `kurssin valuutta ${result.company.priceCurrency ?? "-"}.`,
          "",
          "| id | arvo | valuutta | kausi | vuosi | tarkistus | lainaus |",
          "| --- | --- | --- | --- | --- | --- | --- |",
          ...result.values.map(
            (v) =>
              `| ${v.id} | ${v.value} | ${v.currency ?? ""} | ${v.period} | ${v.year ?? ""} | ` +
              `${v.check === "ok" ? "ok" : `⚠ ${cell(v.warning ?? "")}`} | ${cell(v.quote)} |`,
          ),
          "",
          ...result.rejected.map(
            (r) => `- hylätty (${r.reason}): ${r.id} = ${r.value} "${cell(r.quote)}"`,
          ),
          ...result.notes.map((n) => `- huomio: ${n}`),
          "",
        ].join("\n"),
      );
    });
  },
);

describe.skipIf(!!apiKey && pages.length > 0)("oikeat sivut", () => {
  it.skip("vaatii ympäristömuuttujan ANTHROPIC_API_KEY ja tekstit kansiossa oikeat_sivut/", () => {});
});
