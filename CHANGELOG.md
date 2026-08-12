# Changelog

All notable changes to this fork are documented here. Upstream's own
changelog (if any) covers the business logic this fork doesn't touch; this
file covers the deployment layer added on top.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This fork tracks upstream's version number (currently `1.5.0`) rather than
its own independent SemVer line, since it ships upstream's code unmodified
plus a deployment layer.

## [Unreleased]

### Added

- Forked from [AtlasCloudAI/mcp-server](https://github.com/AtlasCloudAI/mcp-server)
  v1.5.0 (MIT). Added a `LICENSE` file (upstream never shipped one despite
  claiming MIT in `package.json`).
- Dual transport: stdio (default, unchanged from upstream) and Streamable
  HTTP (`MCP_PORT`), for Portainer/Compose deployment. Fresh `McpServer`
  per session, idle-session eviction, hand-rolled Host/Origin allowlist
  (required in HTTP mode), optional bearer auth via `MCP_AUTH_TOKEN`.
- `src/shared/*` — the fleet's canonical deployment-layer files
  (`http-transport.ts`, `log.ts`, `redact.ts`, `version.ts`, `config.ts`),
  copied verbatim from `claude-fleet-kit`'s `ts-mcp-server` template.
- Docker: multi-stage `node:22-alpine` build, non-root `mcp` user,
  `MCP_PORT`-conditional healthcheck; `docker-compose.yml` for NAS/
  Portainer deployment (port `3010` per the fleet's port registry).
- Fleet scaffolding: pre-commit hook (gitleaks + PII + author-identity),
  `.gitattributes`/`.editorconfig`/`.gitleaks.toml`, Dependabot, CI
  (`gitleaks.yml`, `test.yml`, `docker-publish.yml`), eslint/prettier
  (scoped to exclude upstream's untouched business logic), `CLAUDE.md`,
  `STATUS.md`.
- Disk-backed model-catalog cache (`src/services/doc-fetcher.ts`): a JSON
  snapshot under `ATLASCLOUD_CACHE_DIR` (24h TTL) checked before falling
  back to a live `/models` fetch, refreshed after every live fetch.
  In-memory TTL bumped 5min → 24h to match. One of two deliberate
  exceptions to "business logic untouched" — see CLAUDE.md "Relationship
  to upstream". New required `HOST_CACHE_DIR` bind mount in
  `docker-compose.yml` (same no-relative-default rule as
  `HOST_UPLOAD_DIR`).
- README "Content Policy (Adult/NSFW Content)": documents Atlas Cloud's
  genuine, first-party uncensored image/video product line, the
  Acceptable Use Policy's ambiguous wording, and that none of it extends
  to the text/LLM models — with sources.

### Changed

- `atlas_upload_media`'s description and `file_path` schema made
  transport-aware: "local" means the caller's own machine under stdio
  but somewhere already inside the container under this fork's HTTP
  transport. Text-only, no logic touched — the second of two deliberate
  exceptions to "business logic untouched". Upstream's original wording
  assumed stdio-only and gave an LLM no signal that HTTP mode needs a
  different kind of path, surfacing as an unguided raw `ENOENT` instead.

### Fixed

- A session the server no longer knows now answers **HTTP 404, not 400**.
  Idle sessions are evicted after 30 minutes by design, but the Streamable
  HTTP spec (2025-06-18, Session Management §3/§4) makes 404 the client's
  *only* defined signal to start a new session by re-initializing. Returning
  400 read as a generic protocol error, so a routine eviction presented to
  the client as a dead connection until it was restarted by hand — observed
  live on servarr-mcp, then found identically in six fleet servers and in
  the canonical `http-transport.ts` they all copy.
- Bumped `@modelcontextprotocol/sdk` to `^1.30.0`. The lockfile had pinned
  1.27.1, where driving `StreamableHTTPServerTransport` overflows the stack
  (`RangeError: Maximum call stack size exceeded` in
  `webStandardStreamableHttp.js`). Every other fleet repo was already on
  1.30.0; this one was the outlier.
- `SERVER_VERSION` hardcoded `"1.4.0"` in `src/index.ts` while
  `package.json` said `"1.5.0"` — now sourced from `src/shared/version.ts`
  and asserted equal to `package.json` by `version-sync.test.ts`.

### Removed

- `.github/workflows/sync-models.yml` — depended on a reusable workflow in
  `AtlasCloudAI/.github` this fork doesn't control, and isn't useful for a
  personal deployment fork.

### Known gaps (deliberate, not fixed here)

- `Retry-After` is not honoured on 429 responses (upstream's
  `src/services/api-client.ts`).
- No tool-naming aggregator or MCP annotations (`readOnlyHint` etc.) on
  upstream's 9 `src/tools/*.ts` files.

Both would require editing upstream's business logic, which this fork
avoids to stay mergeable with `git fetch upstream && git merge`.
