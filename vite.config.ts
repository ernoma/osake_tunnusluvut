/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Suhteelliset polut, jotta build toimii GitHub Pagesin alihakemistossa.
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // tokens.css luetaan kontrastitestissä (?raw), joten Vitest ei saa tyhjentää sitä.
    css: { include: [/tokens\.css/], modules: { classNameStrategy: "non-scoped" } },
  },
});
