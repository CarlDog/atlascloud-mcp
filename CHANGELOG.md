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

### Fixed

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
