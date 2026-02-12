import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      exclude: ["packages/db/**", "apps/order-api/__mocks__/**"],
    },
  },
});
