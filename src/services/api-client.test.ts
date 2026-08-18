// FORK-LOCAL PATCH regression test (2026-08-18, fleet standard MCP-F08
// amendment) -- see the `fetchWithCause()` comment in ./api-client.ts.
//
// A prior version of `fetchWithCause()` always threw `new Error(...)` from
// its catch block, even when there was no `.cause` to fold into the
// message. That reset `.name` to the generic "Error" on every path,
// including a timeout abort -- whose real rejection (verified against a
// live aborted undici fetch, not just read from source) is a DOMException
// with `.name === "AbortError"` and no distinct `.cause`. Since
// `isRetryable()` branches on `error.name === "AbortError"`, the
// unconditional rewrap silently turned every request timeout into a
// non-retryable error fleet-wide. This test guards the fix: when
// `undici`'s `fetch` rejects with an AbortError and nothing to enrich, the
// error surfaces out of the request layer with its original `.name` intact.
import { describe, expect, test, vi } from "vitest";

vi.mock("undici", async (importOriginal) => {
  const actual = await importOriginal<typeof import("undici")>();
  return {
    ...actual,
    fetch: vi.fn(async () => {
      // What undici's fetch() actually throws when its AbortSignal fires
      // mid-flight -- confirmed empirically, not assumed from docs.
      throw new DOMException("This operation was aborted", "AbortError");
    }),
  };
});

const { api } = await import("./api-client.js");

describe("fetchWithCause (exercised via api-client's request())", () => {
  test("preserves AbortError's .name when there is no cause to fold in", async () => {
    // requireAuth: false avoids needing ATLASCLOUD_API_KEY set; maxRetries:
    // 0 forces a single attempt so the test doesn't wait on backoff.
    await expect(
      api("/whatever", { requireAuth: false, maxRetries: 0 })
    ).rejects.toMatchObject({
      name: "AbortError",
      message: "This operation was aborted",
    });
  });
});
