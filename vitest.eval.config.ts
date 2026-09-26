// npm run eval-extract: tekoälyhaun laatu oikeaa mallia vasten (src/ai/extract.eval.ts).
// Ajetaan Nodessa ilman jsdomia, jotta pyynnöt menevät oikeaan rajapintaan.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/ai/**/*.eval.ts"],
    // Ajot rajapintaan peräkkäin, ettei nopeusraja ylity.
    fileParallelism: false,
  },
});
