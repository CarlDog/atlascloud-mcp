# Status

**Single source of truth for project state.** Do not duplicate status into
CLAUDE.md, README.md, MEMORY.md, or an OpenChronicle memory — those
reference this file.

**Last updated:** 2026-08-05

## Current phase

**Live on the NAS, fully credentialed.** Fork setup complete and
deployed: fleet-standard Docker/Portainer deployment added on top of
[AtlasCloudAI/mcp-server](https://github.com/AtlasCloudAI/mcp-server)
v1.5.0. Build/test/lint/format, both transport modes (stdio + HTTP), real
CI (Test + gitleaks + Docker publish, all green on GitHub Actions), and
the live Portainer deployment are all verified working end to end. The
operator has added a real `ATLASCLOUD_API_KEY` and `MCP_AUTH_TOKEN`
directly via the Portainer UI (2026-08-05) — confirmed live via
`atlas_get_balance` returning real account data. mnemosyne-mcp is
registered as a client alongside atlascloud-mcp locally. One deliberate,
scoped exception to the "business logic untouched" rule has since landed:
a disk-backed model-catalog cache in `doc-fetcher.ts` (see "Done" below).
Content-policy scope for adult/NSFW use is now researched and documented
(README "Content Policy (Adult/NSFW Content)") — image/video generation
via the platform's named uncensored models is well-supported; the AUP's
exact boundary is inferred from marketing, not confirmed by Atlas Cloud
directly.

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

- **2026-08-05** — **Deployed to Portainer** (stack id 171, endpoint 2).
  Two real issues hit and fixed during deploy, both left as a durable
  record here rather than silently patched:
  - **Docker network address-pool exhaustion.** `docker compose up`
    failed creating `atlascloud-mcp_default` ("could not find an
    available, non-overlapping IPv4 address") — this NAS runs ~30
    stacks, each normally claiming its own subnet. Fixed by adding
    `network_mode: bridge` to `docker-compose.yml`: attaches to Docker's
    pre-existing default bridge instead of allocating a new one. Safe
    here because this is a single-container stack with no
    inter-container DNS needs; `host.docker.internal` still works via
    `extra_hosts` regardless of network mode. Verified locally before
    pushing (container starts, port mapping and healthcheck unchanged).
  - **`HOST_UPLOAD_DIR` didn't exist yet.** The bind mount target
    `/volume1/docker/atlascloud-mcp/uploads` had never been created — an
    expected consequence of `HOST_UPLOAD_DIR` being hard-required with
    no default (see the "Docker" entry above); created via
    filesystem-mcp (`/docker/atlascloud-mcp/uploads`) before retrying.
  - Verified live, not just "stack created": `docker inspect`-equivalent
    via `portainer_get_container` shows `Running: true`,
    `NetworkMode: bridge`, the upload bind mount correctly resolved.
    `curl http://carldog-nas:3010/health` → `{"status":"ok",...}` from
    off-NAS. A full stdio-equivalent HTTP session (initialize ->
    `atlas_get_balance`) against the live container confirms
    `ATLASCLOUD_API_KEY` is genuinely empty (not a stray value) — returns
    upstream's original friendly "not set" error, exactly as designed.
  - `MCP_ALLOWED_HOSTS=carldog-nas,localhost,host.docker.internal`,
    `HOST_PORT=3010`. `ATLASCLOUD_API_KEY`/`MCP_AUTH_TOKEN` deliberately
    left unset by this session — entering an API key/token into a field
    isn't something this session does even when the value could have
    been supplied in chat. The operator adds these directly in the
    Portainer UI's stack environment variables, then redeploys.
- **2026-08-05** — **Operator added real credentials.** `ATLASCLOUD_API_KEY`
  and `MCP_AUTH_TOKEN` (a session-generated random token, added by the
  operator via the Portainer UI, not by this session) are both live —
  confirmed via `atlas_get_balance` returning real account data through
  the deployed HTTP endpoint, and via a 401 on `/mcp` without the bearer
  token.
- **2026-08-05** — **Registered as a client in mnemosyne-mcp.** Added to
  that repo's local (gitignored) `.mcp.json` alongside the `mnemosyne`
  server — no code changes there. Separately recorded (not built) the
  shape of a deeper illustration integration in mnemosyne's own
  STATUS.md/ARCHITECTURE.md, without reopening its "image generation:
  out of scope for v0" decision.
- **2026-08-05** — **Disk-backed model-catalog cache** (the one
  deliberate exception to "business logic untouched" — see CLAUDE.md
  "Relationship to upstream"). `src/services/doc-fetcher.ts`'s
  `getModels()` now checks a JSON snapshot on disk
  (`ATLASCLOUD_CACHE_DIR`, 24h TTL) before falling back to a live
  `/models` fetch, and persists after every live fetch. Verified
  directly: a cold run live-fetched 387 models (~700ms) and wrote the
  cache file; a completely fresh process then loaded the same 387
  models from disk in 3ms with zero network calls; a cache file with
  its `fetchedAt` manually rewound 25h was correctly treated as stale
  and triggered a live re-fetch that refreshed the file. In-memory TTL
  also bumped 5min → 24h to match (now meaningfully backed by the disk
  layer, not just an in-process request-burst guard). Wired into Docker
  via a new required `HOST_CACHE_DIR` bind mount (same
  no-relative-default rule as `HOST_UPLOAD_DIR`, for the same Portainer
  git-stack reason). **Live-deployed same day**: `/volume1/docker/
  atlascloud-mcp/cache` created on the NAS, stack redeployed with
  `HOST_CACHE_DIR` set (via `portainer_set_stack_env` + the git-stack's
  auto-pulled `ConfigHash`), confirmed via a real `atlas_list_models`
  call writing a genuine 571KB `models.json` to that path.
- **2026-08-05** — **Content Policy (Adult/NSFW Content) researched and
  documented** in README.md, correcting an over-literal first read.
  Atlas Cloud's Acceptable Use Policy Section 7 ("Use the Services for
  illegal/adult content, hate speech, or malware") was initially read
  as a blanket ban on all adult content. Re-investigated after the
  operator pushed back with a specific, correct counter-fact: Atlas
  Cloud markets a genuine, dedicated "uncensored" product line for
  image/video generation (named models: FLUX Schnell/Dev/Dev LoRA,
  Z-Image Turbo, Seedream 5.0 Pro, Wan 2.2/2.7 Spicy Infinite, Seedance
  v1.5 Pro Spicy), explicitly for "professional adult content creators."
  The AUP clause is genuinely ambiguous ("illegal content OR adult
  content" vs. "illegal-adult content" i.e. CSAM/non-consent) — the
  narrower reading is far more consistent with the company's own
  marketing, but this is inference from public copy, not a legal
  opinion. Also found: none of this extends to the 62 text/LLM models
  — no "uncensored chat" positioning exists anywhere. See README
  "Content Policy (Adult/NSFW Content)" for the full writeup with
  sources.

## Next

- None outstanding from the original deployment plan.

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
- Deploy: **live** on the NAS (Portainer stack 171, `carldog-nas:3010`),
  `running`/reachable, verified via `portainer_get_container` and a live
  HTTP request — not just a deploy-success toast.

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
