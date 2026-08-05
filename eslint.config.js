import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
  { ignores: ["dist/**", "node_modules/**", "coverage/**", ".serena/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Underscore-prefixed args are the conventional "deliberately unused"
      // marker; flagging them trains people to ignore the rule.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // stdout is the JSON-RPC wire under stdio transport. Diagnostics go
      // through shared/log.ts (stderr). This is the lint-level backstop for
      // reference/rules/stdout-stderr-contract.md.
      "no-console": ["error", { allow: ["error", "warn"] }],
    },
  },
  {
    // Upstream's original business logic (kept untouched deliberately, so
    // `git fetch upstream && git merge` stays low-conflict — see README
    // "Relationship to upstream"). It predates this fork's lint config and
    // has pre-existing `any` usage and a couple of unused imports; relaxing
    // just these two rules here avoids hand-editing that code purely to
    // satisfy a rule it was never written against. no-console (the one rule
    // that actually matters for stdio safety) still applies fleet-wide.
    files: ["src/services/**", "src/tools/**", "src/utils/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // prettierConfig LAST: it turns off stylistic rules that would otherwise
  // fight the formatter. Anything after it can silently re-enable them.
  prettierConfig,
];
