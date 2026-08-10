// REQUIRED ENFORCEMENT TEST — fleet standard MCP-F07.
// FORK-LOCAL: keep this file when rebasing on AtlasCloudAI/mcp-server.
//
// Requests must go through undici's own fetch, never the global one.
//
// getProxyDispatcher() builds a ProxyAgent from the `undici` package. That
// dispatcher is only honoured when the Agent and the request come from the
// same undici module instance — Node's global fetch is served by the copy
// bundled inside Node, so a ProxyAgent from this package is a foreign object
// to it and the `dispatcher` option can be silently ignored. The proxy is then
// bypassed and the request goes out direct, succeeding, with nothing to
// indicate it happened. Whether global fetch honours it varies by Node major,
// so the regression would land at a base-image bump, not at the edit that
// caused it.
//
// A comment has no failure mode. This does.
//
// Source-level on purpose: reproducing the real thing needs a live proxy and a
// specific Node major, which is far more machinery than "don't call the global
// fetch here" warrants. The sibling reference is portainer-mcp's
// test/transport.test.ts, written after the same bug took that server down.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "api-client.ts"), "utf8");

// Strip comments so the prose above — and the explainer in api-client.ts —
// can say "fetch(" without tripping the assertion.
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("api-client transport (MCP-F07)", () => {
  test("never calls global fetch", () => {
    const offenders = code
      .split("\n")
      .map((line, i) => ({ line: line.trim(), no: i + 1 }))
      .filter(({ line }) => /(?<![.\w])fetch\s*\(/.test(line))
      .filter(({ line }) => !/undiciFetch\s*\(/.test(line));

    expect(
      offenders,
      "api-client.ts must not call global fetch — it can ignore the ProxyAgent " +
        "dispatcher, silently bypassing the proxy. Use undiciFetch (undici's " +
        "own spec-compatible fetch, imported at the top of the file).",
    ).toEqual([]);
  });

  test("issues requests through undici's fetch", () => {
    expect(code).toMatch(/import\s*\{[^}]*fetch as undiciFetch[^}]*\}\s*from\s*"undici"/);
    expect(code).toMatch(/undiciFetch\s*\(/);
  });

  test("still builds a ProxyAgent from proxy env vars", () => {
    expect(code).toMatch(/new ProxyAgent\(/);
  });
});
