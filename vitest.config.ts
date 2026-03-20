import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/ui/**"],
    },
  },
  resolve: {
    alias: {
      obsidian: path.resolve(__dirname, "__mocks__/obsidian.ts"),
    },
  },
});
