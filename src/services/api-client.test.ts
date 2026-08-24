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
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

let capturedInit: { body?: unknown } | undefined;

vi.mock("undici", async (importOriginal) => {
  const actual = await importOriginal<typeof import("undici")>();
  return {
    ...actual,
    fetch: vi.fn(async (url: string, init?: { body?: unknown }) => {
      if (typeof url === "string" && url.includes("/model/uploadMedia")) {
        capturedInit = init;
        return new Response(
          JSON.stringify({
            data: { download_url: "https://example.com/f.png", filename: "f.png", size: 1 },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      // What undici's fetch() actually throws when its AbortSignal fires
      // mid-flight -- confirmed empirically, not assumed from docs.
      throw new DOMException("This operation was aborted", "AbortError");
    }),
  };
});

const { api, uploadMedia } = await import("./api-client.js");
const { FormData: UndiciFormData } = await import("undici");

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

// FORK-LOCAL PATCH regression test (2026-08-24) -- see the FormData comment
// on uploadMedia() in ./api-client.ts.
//
// uploadMedia() previously built its multipart body with the *global*
// FormData constructor while sending it through undici's own fetch()
// (imported explicitly) -- the same cross-module-instance trap as
// MCP-F07's ProxyAgent fix, just for FormData instead of Dispatcher.
// undici's fetch() only serializes a body as multipart/form-data when it
// is `instanceof` undici's OWN FormData class; a global FormData instance
// fails that check silently, so no multipart boundary or Content-Type
// header is ever emitted, and Atlas Cloud's real API rejects the request
// with "file is required: request Content-Type isn't multipart/form-data"
// (confirmed live against the deployed server, 2026-08-24). This test
// guards the fix: the body handed to undici's fetch must be undici's own
// FormData.
describe("uploadMedia", () => {
  test("sends the multipart body as undici's own FormData, not the global one", async () => {
    process.env.ATLASCLOUD_API_KEY = "test-key";
    const dir = await mkdtemp(join(tmpdir(), "atlascloud-upload-test-"));
    const filePath = join(dir, "test.png");
    await writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    try {
      await uploadMedia(filePath);
      expect(capturedInit?.body).toBeInstanceOf(UndiciFormData);
      // The global FormData is a distinct class -- this is the exact
      // check undici's fetch() itself performs, and the one that
      // silently failed before the fix.
      expect(capturedInit?.body).not.toBeInstanceOf(globalThis.FormData);
    } finally {
      await rm(dir, { recursive: true, force: true });
      delete process.env.ATLASCLOUD_API_KEY;
    }
  });
});
