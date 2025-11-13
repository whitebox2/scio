import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@qwik-city-plan": fileURLToPath(new URL("./src/routes/@qwik-city-plan.ts", import.meta.url)),
    },
  },
  test: {
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**", ".git/**", "tmp/**"],
  },
});
