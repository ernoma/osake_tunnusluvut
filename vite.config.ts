/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** CSP:n tiiviste skriptille: 'sha256-…'. */
async function sha256(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`;
}

/**
 * Content-Security-Policy julkaistavaan sivuun (suunnitelman kohta 11.3). API-avain on
 * selaimen muistissa, joten sivu saa ladata skriptejä vain omasta osoitteestaan ja ottaa
 * yhteyttä vain omaan sivustoon, Clauden rajapintaan ja valuuttakurssien rajapintaan (kohta 11.10). index.html:n oma skripti (teema ennen
 * ensimmäistä piirtoa) sallitaan tiivisteellä.
 *
 * Vain buildissa, koska kehityspalvelin lisää sivulle omia skriptejään.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      async handler(html) {
        const inlineScripts = [
          ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
        ];
        const hashes = await Promise.all(inlineScripts.map(([, code = ""]) => sha256(code)));
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(" ")}`.trim(),
          "style-src 'self'",
          "img-src 'self' data:",
          "connect-src 'self' https://api.anthropic.com https://api.frankfurter.dev",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ");
        // Heti merkistön jälkeen, ennen ensimmäistä skriptiä.
        return html.replace(
          /(<meta charset="UTF-8" \/>)/,
          `$1\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // Suhteelliset polut, jotta build toimii GitHub Pagesin alihakemistossa.
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // tokens.css luetaan kontrastitestissä (?raw), joten Vitest ei saa tyhjentää sitä.
    css: { include: [/tokens\.css/], modules: { classNameStrategy: "non-scoped" } },
  },
});
