import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/**/*.test.ts"],
          environment: "nuxt",
        },
      }),
      {
        test: {
          name: "e2e",
          include: ["test/e2e/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
