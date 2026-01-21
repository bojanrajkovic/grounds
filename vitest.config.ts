// pattern: Imperative Shell
import { defineConfig } from "vitest/config";

// Note: vitest requires default export for config files
export default defineConfig({
  test: {
    include: ["packages/*/tests/**/*.test.ts"],
    passWithNoTests: true,
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/*/src/index.ts", "packages/test-utils/**"],
      reporter: ["text", "lcov"],
    },
  },
});
