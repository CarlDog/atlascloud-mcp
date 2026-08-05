import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Colocated tests — standard MCP-D02. New repos put a test next to the
    // code it covers; existing repos with a tests/ directory are explicitly
    // NOT a retrofit item.
    include: ["src/**/*.test.ts"],
    // Integration suites opt in via an env guard inside the file itself, so a
    // plain `npm test` never needs credentials or a live upstream.
    environment: "node",
  },
});
