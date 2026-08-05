# Status

**Single source of truth for project state.** Do not duplicate status into
CLAUDE.md, README.md, MEMORY.md, or an OpenChronicle memory — those
reference this file.

**Last updated:** 2026-08-05

## Current phase

Initial fork setup complete: fleet-standard Docker/Portainer deployment
added on top of [AtlasCloudAI/mcp-server](https://github.com/AtlasCloudAI/mcp-server)
v1.5.0, without touching its business logic. Build/test/lint/format, both
transport modes (stdio + HTTP), and real CI (Test + gitleaks +
Docker publish, all green on GitHub Actions) are verified working, and the
image is live on GHCR. Not yet deployed to Portainer — that's the next and
final step, pending explicit
go-ahead (deploying a new stack is shared-infra, not a solo decision).

## Done

- **2026-08-05** — Forked, renamed, cloned; `upstream` remote added; MIT
  `LICENSE` added (upstream never shipped one despite claiming MIT);
  stale `sync-models.yml` workflow removed.
- **2026-08-05** — Adopted the fleet's canonical `src/shared/*` deployment
  layer verbatim (`http-transport.ts`, `log.ts`, `redact.ts`, `version.ts`,
  `config.ts`, `version-sync.test.ts`) — fixed a real pre-existing bug as a
  side effect: `src/index.ts` hardcoded `version: "1.4.0"` while
  `package.json` said `"1.5.0"`.
- **2026-08-05** — `src/index.ts` wired for dual transport (stdio default,
  Streamable HTTP when `MCP_PORT` is set): fresh `McpServer` per session,
  idle-session eviction, hand-rolled Host/Origin allowlist (required in
  HTTP mode — fails startup if unset), optional bearer auth via
  `MCP_AUTH_TOKEN`. All verified locally (see "Live validation" below).
- **2026-08-05** — Docker: 3-stage `node:22-alpine` build, non-root `mcp`
  user, `MCP_PORT`-conditional healthcheck; `docker-compose.yml` with the
  full env-var set, port `3010` (fleet registry), required
  `HOST_UPLOAD_DIR`/`MCP_ALLOWED_HOSTS` (no unsafe relative/open defaults).
  Verified: image builds, both transports work in-container, healthcheck
  transitions to `healthy`, `docker compose config` fails without the
  required vars set.
- **2026-08-05** — Fleet scaffolding: pre-commit hook (gitleaks + PII +
  author-identity, verified passing), `.gitattributes`/`.editorconfig`,
  `.gitleaks.toml`, Dependabot (npm/actions/docker), `gitleaks.yml` +
  `test.yml` + `docker-publish.yml` workflows, eslint/prettier (scoped
  away from upstream's untouched business logic — see CLAUDE.md
  "Conventions"), `CLAUDE.md`, this file.

## Next

- **Deploy to Portainer — needs explicit go-ahead**: set
  `MCP_ALLOWED_HOSTS`/`HOST_UPLOAD_DIR` on the stack's environment
  variables *before* the first deploy (a redeploy landing with
  enforcement on but the allowlist unset is a startup crash-loop, not a
  soft-fail), then verify with `docker inspect`. This is the only
  remaining step from the original plan.

## Known gaps

Deliberately deferred, not silently patched — both would require touching
upstream's business logic, which this fork avoids to stay mergeable:

- **MCP-F02 (honour `Retry-After`)** — upstream's
  `src/services/api-client.ts` retries GET/PUT requests on 429/5xx with a
  fixed exponential backoff and never reads the `Retry-After` header.
- **MCP-T01/T02 (tool-naming aggregator + annotations)** — upstream's 9
  `src/tools/*.ts` files each export `registerXTools(server)` directly,
  not through the fleet template's `src/tools/index.ts` aggregator, and
  don't set the `readOnlyHint`/`destructiveHint`/etc. MCP annotations the
  template's `annotations.test.ts` would check for.

## Health

- Tests: 2 passed (version-sync only — upstream has no test suite of its
  own; this fork doesn't add coverage for business logic it didn't write).
- Lint: clean (`npm run lint`, with upstream's `src/services|tools|utils`
  scoped out of the two rules it predates).
- Format: clean (`npm run format:check`, same scoping).
- CI: green on `main` (Test matrix, quality, gitleaks, Publish Docker
  image all passed on the real GitHub Actions run, not just local
  reproduction). Image published: `ghcr.io/carldog/atlascloud-mcp:latest`.
- npm audit: 3 vulnerabilities remain (1 low, 2 moderate), all in
  transitive dependencies of `@modelcontextprotocol/sdk` not exercised by
  this server's runtime code (a dev-server-only `esbuild` flaw, a Windows
  path-traversal issue in `hono`'s static-file serving — this server uses
  Express, not Hono). Left for Dependabot rather than a manual force-bump
  of the SDK's pinned version.
- Deploy: not yet deployed. Local Docker Compose verified working.

## Live validation (2026-08-05)

Ran directly, not just read: `npm run build`/`typecheck`/`test`/`lint`/
`format:check` all clean. stdio transport: raw `initialize` request over
`node dist/index.js` returns a clean single-line JSON-RPC response on
stdout with the log line correctly isolated to stderr, version correctly
`1.5.0`. HTTP transport: `MCP_PORT` set without `MCP_ALLOWED_HOSTS` exits 1
immediately (both via plain `node` and inside the built container);
`docker compose config` fails the same way without `MCP_ALLOWED_HOSTS`/
`HOST_UPLOAD_DIR` set. With both set: `/health` returns
`{"status":"ok","version":"1.5.0"}`; wrong `Host` header -> 403; correct
Host + no bearer token when `MCP_AUTH_TOKEN` is set -> 401; correct Host +
correct token -> 200 with an `mcp-session-id` header and a working
`initialize` response. Docker healthcheck transitions `starting` ->
`healthy`; confirmed a no-op (exit 0) when `MCP_PORT` is unset.

One real gotcha found during validation: `MCP_ALLOWED_HOSTS` entries must
be **bare hostnames, no port** (e.g. `your-nas`, not `your-nas:3010`) —
`hostAllowed()` strips the port from the incoming `Host` header before
comparing. Documented in `docker-compose.yml`'s inline comment and
CLAUDE.md.

Full stdio round-trip with `ATLASCLOUD_API_KEY` unset, against the real
Atlas Cloud API (not mocked): `atlas_list_models` with `type="Image"`
returned 121 real, current models — confirms unauthenticated catalog
browsing actually works end-to-end, not just that the code compiles.
`atlas_get_balance` (an authenticated tool) in the same no-key session
returned `isError: true` with upstream's original friendly
"ATLASCLOUD_API_KEY is not set" message — confirms the fail-gracefully
path (Phase 2's whole point) rather than a startup crash.

## Open questions (still to validate)

- Real end-to-end test of `atlas_upload_media` over HTTP transport with a
  file placed under the mounted `HOST_UPLOAD_DIR` (the mitigation for its
  local-`file_path` assumption breaking across the stdio/HTTP boundary) —
  needs a real, funded Atlas Cloud API key (the upload endpoint requires
  auth), not yet run.
- A real `ATLASCLOUD_API_KEY`-backed smoke test of a billable tool
  (`atlas_generate_image`, `atlas_chat`) succeeding end-to-end — validation
  so far confirms the unauthenticated path and the no-key failure path,
  not a real generation call.
