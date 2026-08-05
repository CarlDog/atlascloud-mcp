# atlascloud-mcp

MCP server for Atlas Cloud (400+ image/video/audio/LLM models,
OpenAI-compatible chat) — a fork of
[AtlasCloudAI/mcp-server](https://github.com/AtlasCloudAI/mcp-server) (MIT)
that adds fleet-standard Docker/Portainer deployment on top of upstream's
tool surface.

**Fleet standards:** ts-mcp-server v1.0 — audited 2026-08-05

## Status

See [STATUS.md](STATUS.md) — the single source of truth for project state.
**Do not duplicate status here.**

## Stack and layout

- **Stack:** TypeScript (Node 22+, ESM, `NodeNext`-adjacent module
  resolution — see "Deliberate deviations" below), `@modelcontextprotocol/sdk`,
  `zod` for tool input schemas, `express` for the HTTP transport, `undici`
  (upstream's HTTP client for the Atlas Cloud API).
- **Entry point:** `src/index.ts` — decides transport based on `MCP_PORT`,
  wraps tool registration in a `createServer()` factory.
- **Layout:**
  - `src/config.ts` — repo-specific config wrapper (adds the
    fail-fast `MCP_ALLOWED_HOSTS` check on top of the shared base loader).
  - `src/shared/` — **canonical fleet files, copied verbatim** from
    `claude-fleet-kit`'s `ts-mcp-server` template
    (`http-transport.ts`, `log.ts`, `redact.ts`, `version.ts`, `config.ts`).
    Fix bugs upstream (in claude-fleet-kit) and re-propagate; a local edit
    here is drift.
  - `src/services/`, `src/tools/`, `src/utils/`, `src/types.ts`,
    `src/constants.ts` — **upstream's original business logic, mostly
    untouched.** Two deliberate, user-approved exceptions:
    - `src/services/doc-fetcher.ts`'s `getModels()` gained a disk-backed
      cache layer underneath its existing in-memory one (2026-08-05) —
      see README "Model catalog cache".
    - `src/tools/upload.ts`'s `atlas_upload_media` description (and its
      `file_path` schema `.describe()`) was extended to explain that
      "local" means a different filesystem depending on transport —
      the caller's own machine under stdio, vs. somewhere already
      inside the container under this fork's HTTP transport
      (2026-08-05). Text-only; no behavior change. Written because a
      calling LLM only ever sees a tool's own description, never this
      repo's README — upstream's original wording assumed stdio-only
      and gave zero signal that HTTP mode needs a different kind of
      path, so an LLM would hit a raw `ENOENT` with no way to
      self-correct.

    Everything else in these directories stays untouched; edit only to
    pull in an upstream `git merge` — see "Relationship to upstream"
    below.
  - `Dockerfile`, `docker-compose.yml` — multi-stage build + Compose/
    Portainer deployment, added by this fork.

## Relationship to upstream

This is a **deployment-layer fork**, mostly. Business logic
(`src/services/`, `src/tools/*.ts`, `src/utils/`) stays untouched from
upstream so `git fetch upstream && git merge` should stay low-conflict —
with two deliberate exceptions (`doc-fetcher.ts`'s disk cache and
`upload.ts`'s transport-aware description, see above). The first is a
scoped, additive change (new imports, new helper functions, one call
site touched); the second is text-only (a description string, no logic
touched at all). Both are kept minimal specifically to keep a future
upstream merge on either file tractable rather than a full rewrite. Two
real, known gaps still exist and are deliberately deferred rather than
silently patched — see "Known gaps" in [STATUS.md](STATUS.md).

An `upstream` remote points at `AtlasCloudAI/mcp-server`. To pull in
upstream's tool improvements:

```bash
git fetch upstream
git merge upstream/main
```

## Common commands

```bash
npm run build          # tsc -> dist/
npm run typecheck      # tsc -p tsconfig.typecheck.json (includes tests)
npm test                # vitest run
npm run lint            # eslint .
npm run format:check    # prettier --check .
npm run dev              # tsx watch src/index.ts (stdio)
docker compose up --build   # HTTP transport, Portainer-style
```

## Conventions

- **Deliberate deviations from the ts-mcp-server standard**, all to avoid
  touching upstream's original code:
  - `tsconfig.json` keeps upstream's original `module`/`moduleResolution`
    (`Node16`) and `declaration: true` rather than the canonical template's
    `NodeNext`/`noUncheckedIndexedAccess`/`declaration: false` — adopting
    those could surface new type errors in untouched business logic or
    change this package's emitted `.d.ts` shape. Only the test-file
    exclusion was added (needed so `npm run build` doesn't require
    `vitest`).
  - `eslint.config.js` and `.prettierignore` both carve out
    `src/services/`, `src/tools/`, `src/utils/`, `src/types.ts`,
    `src/constants.ts` — upstream's pre-existing `any` usage, two unused
    imports, and its own formatting are left alone rather than mass-edited
    to satisfy a lint/format rule they were never written against.
    `no-console` (the rule that actually matters for stdio safety) still
    applies fleet-wide.
  - `MCP_ALLOWED_HOSTS` entries are **bare hostnames, no port** — the
    shared `hostAllowed()` strips the port from the incoming `Host` header
    before comparing.
  - There is no separate `MCP_ALLOWED_ORIGINS` variable: the shared
    `http-transport.ts` checks both `Host` and `Origin` against the single
    `MCP_ALLOWED_HOSTS` list.
  - `ATLASCLOUD_API_KEY` is read lazily by upstream's own
    `src/services/api-client.ts::getApiKey()`, NOT eagerly validated at
    startup like the rest of the fleet's own credentials — Atlas Cloud's
    API allows unauthenticated catalog browsing
    (`atlas_list_models`/`atlas_search_docs`), and an eager startup failure
    would break that legitimate no-key use case.
- Upstream's own `.github/workflows/sync-models.yml` (a daily cron syncing
  the model catalog into the README) was deleted — it depends on a
  reusable workflow in `AtlasCloudAI/.github` this fork doesn't control.

## Phase-end audit checklist (project-specific)

Extends `~/.claude/rules/phase-end-audit.md` with checks only this repo
needs:

- Re-diff `src/services/`, `src/tools/`, `src/utils/`, `src/types.ts`,
  `src/constants.ts` against `upstream/main` — confirm they're still
  byte-identical (or note exactly what upstream changed) before assuming
  a merge went cleanly.
- Re-check `src/shared/*` against `claude-fleet-kit`'s current template —
  confirm no drift (`/repo-standards-audit` hash-compares these).
