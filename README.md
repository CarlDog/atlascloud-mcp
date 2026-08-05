<!-- fleet-confidence -->
<!-- /fleet-confidence -->

<p align="center">
  <img src="https://www.atlascloud.ai/logo.svg" alt="Atlas Cloud" width="80" />
</p>

<h1 align="center">Atlas Cloud MCP Server</h1>

> **This is a fork** of [AtlasCloudAI/mcp-server](https://github.com/AtlasCloudAI/mcp-server)
> (MIT). Upstream's tool surface (image/video/audio/LLM generation, chat,
> uploads, balance/usage) is unmodified; this fork adds Docker/Portainer
> deployment support (dual stdio/HTTP transport, session management, a
> Host/Origin allowlist, optional bearer auth) for self-hosting on a home
> NAS/server fleet, rather than the `npx`-per-launch stdio-only model
> upstream ships. See [CLAUDE.md](CLAUDE.md) "Relationship to upstream" and
> [STATUS.md](STATUS.md) for what's changed and what's deliberately not.

<p align="center">
  <a href="https://www.npmjs.com/package/atlascloud-mcp"><img src="https://img.shields.io/npm/v/atlascloud-mcp.svg?style=flat&colorA=18181B&colorB=28CF8D" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/atlascloud-mcp"><img src="https://img.shields.io/npm/dm/atlascloud-mcp.svg?style=flat&colorA=18181B&colorB=28CF8D" alt="npm downloads" /></a>
  <a href="https://github.com/AtlasCloudAI/mcp-server"><img src="https://img.shields.io/github/license/AtlasCloudAI/mcp-server?style=flat&colorA=18181B&colorB=28CF8D" alt="license" /></a>
  <a href="https://github.com/AtlasCloudAI/mcp-server"><img src="https://img.shields.io/github/stars/AtlasCloudAI/mcp-server?style=flat&colorA=18181B&colorB=28CF8D" alt="github stars" /></a>
  <a href="https://github.com/AtlasCloudAI/mcp-server/pulls"><img src="https://img.shields.io/badge/PRs-welcome-28CF8D.svg?style=flat&colorA=18181B&colorB=28CF8D" alt="PRs Welcome" /></a>
</p>

<p align="center">
  English | <a href="./docs/README.zh-CN.md">中文</a> | <a href="./docs/README.ja.md">日本語</a> | <a href="./docs/README.ko.md">한국어</a> | <a href="./docs/README.es.md">Español</a> | <a href="./docs/README.fr.md">Français</a>
</p>

<p align="center">
  Use <a href="https://www.atlascloud.ai?utm_source=github&utm_campaign=mcp-server">Atlas Cloud</a>'s 300+ image / video / LLM models in Claude Code, Codex, Gemini CLI, Cursor, Cline and more. Generate images, videos & chat via standard MCP tools.
</p>

<p align="center">
  <a href="https://www.atlascloud.ai/console/api-keys?utm_source=github&utm_campaign=mcp-server"><b>→ Get your free Atlas Cloud API key</b></a> · 300+ models · OpenAI-compatible
</p>

---

## Supported Models

> **Snapshot, not live.** This fork removed `.github/workflows/sync-models.yml`
> (it depended on a reusable workflow in `AtlasCloudAI/.github` this fork
> doesn't control), so the list below is a point-in-time snapshot from when
> this fork was created, not auto-refreshed. See
> [atlascloud.ai/models](https://www.atlascloud.ai/models) for the live
> catalog, or ask the `atlas_list_models` tool.

<!-- ATLAS-MODELS:START lang=en campaign=mcp-server -->
<!-- ⚠️ Auto-generated from the live model catalog by AtlasCloudAI/.github/scripts/update-models-readme.mjs — do not edit by hand. Snapshot only in this fork; see note above. -->
- 🎬 **Video** (181) — MiniMax H3 · Youchuan V8.2 · Wan 2.7 Spicy · Seedance 2.0 Mini · HappyHorse-1.1 · Gemini Omni Flash
- 🎨 **Image** (112) — Reve 2.1 · Youchuan V8.2 · Seedream v5.0 Pro · Nano Banana 2 Lite
- 🧊 **3D** (7) — Seed3D 2.0 · Hunyuan 3D Rapid · Hunyuan 3D Pro · Tripo H3.1
- 💬 **LLM** (62) — Qwen3.8 Max · Kimi K3 · Grok 4.5 · KAT Coder Pro V2.5
- 🔊 **Audio (TTS · Music · ASR)** (11) — Seed Audio 1.0 · xAI TTS v1 · ElevenLabs v3 · Gemini 3.1 Flash TTS

- 📚 **Explore more** — [all 385 live models »](https://www.atlascloud.ai/models?utm_source=github&utm_campaign=mcp-server)
<!-- ATLAS-MODELS:END -->

## Contents

- [What You Can Do](#what-you-can-do)
- [Content Policy (Adult/NSFW Content)](#content-policy-adultnsfw-content)
- [Quick Start](#quick-start)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [More Atlas Cloud Tools](#more-atlas-cloud-tools)
- [License](#license)

## What You Can Do

Ask your AI assistant in plain language — it discovers the right model, builds the parameters, and submits the job:

- 🎨 **"Make a hero image for this blog post"** — text-to-image across Nano Banana Pro, GPT Image 2, Flux 2, Seedream, Imagen…
- 🎬 **"Turn this product photo into a 5-second ad"** — image-to-video with Kling 3, Seedance 2, Veo 3.1, Sora 2…
- 🧊 **"Make a 3D model from this photo"** — image-to-3D / text-to-3D with Hunyuan 3D (GLB/OBJ/USDZ output)
- 🔊 **"Read this script aloud"** — text-to-speech with Seed Audio, ElevenLabs, xAI TTS
- 🎵 **"Write a theme song for my app"** — music generation with Suno, MiniMax Music
- 📝 **"Transcribe this meeting recording"** — speech-to-text with Seed ASR, xAI STT
- 🎞️ **"Storyboard this script into 6 shots"** — chain LLM → image → video inside one conversation
- ✏️ **"Edit this image — add a hat"** — upload a local file, then run an image-editing model
- 💸 **"How much credit is left, and what did I spend this month?"** — check balance, usage, and cost breakdowns
- 💬 **"Summarize this PDF with DeepSeek"** — OpenAI-compatible LLM chat with Claude, GPT, DeepSeek, Qwen, GLM…

Under the hood: model discovery, dynamic per-model parameter schemas (validated before every request so invalid params fail fast without spending credits), media upload, one-step quick-generate, account balance & usage, and documentation search — all exposed as standard MCP tools (see [Available Tools](#available-tools)).

## Content Policy (Adult/NSFW Content)

**Image/video generation: Atlas Cloud runs a genuine, first-party "uncensored"
product line**, not a loophole. Their own marketing: "the industry's only
fully uncensored multi-model AI platform," built for "professional adult
content creators who need full creative control without content moderation
barriers," generated content "never used for training and never reviewed by
anyone," 18+ required. Specific model variants are marketed for this: FLUX
Schnell/Dev/Dev LoRA, Z-Image Turbo, Seedream 5.0 Pro (image); Wan 2.2/2.7
Spicy Infinite, Seedance v1.5 Pro Spicy (video). Sources:
[best-uncensored-nsfw-ai-image-generators](https://www.atlascloud.ai/blog/guides/best-uncensored-nsfw-ai-image-generators),
[models/explore/uncensored](https://www.atlascloud.ai/models/explore/uncensored).

**The Acceptable Use Policy's wording is genuinely ambiguous — read it
yourself rather than taking any summary at face value.** Section 7 (verbatim,
[atlascloud.ai/acceptable-use](https://www.atlascloud.ai/acceptable-use)):

> "Use the Services for illegal/adult content, hate speech, or malware."

Read literally, "illegal/adult content" supports two different readings:
"illegal content, OR adult content" (a blanket ban on all adult content), or
"illegal adult content" as a compound — content that is both illegal AND
adult (CSAM, non-consensual depictions) — leaving legal adult content between
consenting adults unrestricted. Given the company's own extensive, dedicated
marketing built entirely around legal NSFW image/video generation, the
narrower reading is far more consistent with their actual product and stated
boundary (CSAM/non-consent/18+, not "no adult content at all"). But this is
inference from public marketing copy, not a legal opinion — **if you need
certainty, ask Atlas Cloud support directly what Section 7 means before
relying on it.**

**This does NOT extend to the 62 text/LLM models.** Every "uncensored" claim
found (marketing pages, named models, blog guides) is specifically about
image/video generation. No equivalent "uncensored chat" product positioning
exists for `atlas_chat` — those are general-purpose models from mainstream
labs (OpenAI, DeepSeek, Qwen, etc.) with no stated NSFW policy either way.
Treat text-model content moderation as an open question, not settled by
anything found here.

**Practical takeaway**: for adult content, use the specifically-named
uncensored/Spicy image and video models via `atlas_generate_image` /
`atlas_generate_video` / `atlas_quick_generate` — that's the platform's
actual, intended, marketed use case. Don't assume the same latitude applies
to `atlas_chat`.

## Quick Start

### Prerequisites

- Node.js >= 18
- Atlas Cloud API Key — [Get one free at atlascloud.ai](https://www.atlascloud.ai/console/api-keys?utm_source=github&utm_campaign=mcp-server)

See [`.env.example`](./.env.example) for the environment variable to set.

### CLI agents (one-line install)

The fastest path — these AI coding agents add the server with a single command:

```bash
# Claude Code
claude mcp add atlascloud -- npx -y atlascloud-mcp

# OpenAI Codex CLI
codex mcp add atlascloud -- npx -y atlascloud-mcp

# Gemini CLI
gemini mcp add atlascloud -- npx -y atlascloud-mcp

# Goose CLI
goose mcp add atlascloud -- npx -y atlascloud-mcp
```

> Set the `ATLASCLOUD_API_KEY` environment variable in your shell first.

### IDEs, editors & extensions (JSON config)

Add this to your client's MCP configuration — works with every MCP-compatible client:

```json
{
  "mcpServers": {
    "atlascloud": {
      "command": "npx",
      "args": ["-y", "atlascloud-mcp"],
      "env": {
        "ATLASCLOUD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

| Client | Where to add it |
|--------|-----------------|
| [Cursor](https://cursor.com) | Settings → MCP → Add Server |
| [Cline](https://github.com/cline/cline) | MCP Marketplace → Add Server |
| [Continue](https://continue.dev) | `config.yaml` → MCP |
| [Windsurf](https://codeium.com/windsurf) | Settings → MCP → Add Server |
| [VS Code (Copilot)](https://code.visualstudio.com) | `.vscode/mcp.json` or Settings → MCP |
| [Trae](https://trae.ai) | Settings → MCP → Add Server |
| [JetBrains IDEs](https://www.jetbrains.com) | Settings → Tools → AI Assistant → MCP |
| [ChatGPT Desktop](https://openai.com/chatgpt/desktop) | Settings → MCP |
| [Amazon Q Developer](https://aws.amazon.com/q/developer/) | MCP Configuration |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | Settings → MCP → Add Server |

### Prefer Skills?

If you'd rather use Skills than MCP, we also ship an [Atlas Cloud Skills](https://github.com/AtlasCloudAI/atlas-cloud-skills) package for Claude Code and other skill-compatible agents.

### Docker (Streamable HTTP) — self-hosted deployment

The same image supports two transports, selected at start time:

- **stdio (default)** — used when `MCP_PORT` is unset. Standard mode for
  `docker run -i` invocation by an MCP client, matching every install
  method above.
- **HTTP (Streamable HTTP)** — used when `MCP_PORT` is set. Listens on
  `0.0.0.0:$MCP_PORT` with `POST/GET/DELETE /mcp` (per-session
  `mcp-session-id`) and `GET /health` (liveness probe). Meant for a
  long-lived deployment (Portainer, plain Compose) rather than a
  per-client-launch process.

```bash
git clone https://github.com/CarlDog/atlascloud-mcp.git
cd atlascloud-mcp
cp .env.example .env   # fill in ATLASCLOUD_API_KEY, MCP_ALLOWED_HOSTS, HOST_UPLOAD_DIR
docker compose up -d --build
curl http://localhost:3010/health
# {"status":"ok","version":"1.5.0"}
```

`MCP_ALLOWED_HOSTS` and `HOST_UPLOAD_DIR` are **required** — the container
refuses to start without them (see "Securing the HTTP endpoint" below and
"atlas_upload_media over HTTP" further down). Set both on your Portainer
stack's environment variables *before* the first deploy.

### Securing the HTTP endpoint

Every tool call on this server can spend real Atlas Cloud credits, so
treat the HTTP endpoint's exposure deliberately:

- **`MCP_ALLOWED_HOSTS`** (required) — comma-separated **bare hostnames**
  (no port — the allowlist check strips the port from the incoming `Host`
  header before comparing) this server accepts on `/mcp`, e.g.
  `MCP_ALLOWED_HOSTS=your-nas`. The MCP SDK's own DNS-rebinding options are
  deprecated in favor of external middleware, so this is hand-rolled
  instead. Without it, a page loaded in a LAN browser could rebind its own
  hostname to this container's IP and drive tools (including billable
  generation calls) as a confused deputy — binding `0.0.0.0` inside a
  container is not itself an access control. The same list also covers the
  `Origin` header; there is no separate `MCP_ALLOWED_ORIGINS` variable.
- **`MCP_AUTH_TOKEN`** (optional, recommended) — a bearer token compared
  with a constant-time check. Unlike some read-mostly, LAN-only MCP
  servers that skip this, every tool call here is potentially billable, so
  the extra setup step is worth it. Send `Authorization: Bearer <token>`.
- **`MCP_SESSION_IDLE_MS`** (optional, default 30 minutes) — evicts an
  idle MCP session so a client that disappears uncleanly doesn't leak it
  forever in this long-running container.
- **`MCP_BIND_HOST`** — defaults to `127.0.0.1` (safe outside a
  container); `docker-compose.yml` sets it to `0.0.0.0` since a container
  must bind wide to be reachable at all — the allowlist above is the real
  boundary, not the bind address.

### `atlas_upload_media` over HTTP

`atlas_upload_media` takes a local `file_path` — fine in stdio mode (the
MCP process runs on your own machine, co-located with the file), but under
HTTP transport the path must refer to somewhere **inside the container**,
not your desktop. `docker-compose.yml` mounts `HOST_UPLOAD_DIR` (a
required env var, no default — see the compose file's comment for why a
relative default is unsafe under a Portainer git-stack redeploy) to
`/data/uploads` inside the container. To upload a file over HTTP
transport: place it under the directory `HOST_UPLOAD_DIR` points at on the
host, then call `atlas_upload_media` with
`file_path: "/data/uploads/<name>"`.

### Model catalog cache

Upstream caches the `/models` catalog (used by `atlas_list_models`,
`atlas_search_docs`, and internally by every generate tool) in memory for
24 hours. This fork adds a **disk-backed** layer underneath that in-memory
cache (`src/services/doc-fetcher.ts`): on a cache miss, it first checks a
JSON snapshot on disk before hitting the live API, and writes a fresh
snapshot after any live fetch. This means a container restart doesn't
pay for a live re-fetch as long as the snapshot is under 24h old — useful
since this NAS runs the container as a long-lived Portainer stack that
can restart (redeploys, host reboots) far more often than the catalog
itself changes.

- **Docker**: `HOST_CACHE_DIR` (required, no relative default — same
  Portainer git-stack redeploy risk as `HOST_UPLOAD_DIR` above) is
  mounted to `/data/cache`.
- **stdio/local**: no setup needed — defaults to a directory under the
  OS temp dir. Override with `ATLASCLOUD_CACHE_DIR` if you want a stable
  location.
- The cache is unauthenticated-catalog data only (the same response
  regardless of API key), so there's nothing sensitive in the cache file.
- A stale (>24h) or corrupt/missing cache file is silently treated as a
  miss and triggers a normal live fetch — this is purely a performance
  optimization, never a hard dependency.

## Available Tools

| Tool | Description |
|------|-------------|
| `atlas_search_docs` | Search Atlas Cloud documentation and models by keyword |
| `atlas_list_models` | List all available models, optionally filtered by type (Text/Image/Video/Audio) |
| `atlas_get_model_info` | Get detailed model info including API schema, parameters, and usage examples |
| `atlas_generate_image` | Generate images and 3D models (image-to-3D / text-to-3D) with any supported Image model |
| `atlas_generate_video` | Generate videos with any supported video model |
| `atlas_generate_audio` | Generate audio — speech (TTS) and music/songs (Suno, MiniMax Music) — with any supported audio model |
| `atlas_transcribe_audio` | Transcribe speech to text (ASR) — meetings, interviews, voice notes |
| `atlas_quick_generate` | One-step image/video/audio generation — auto-finds model by keyword, builds params, and submits |
| `atlas_upload_media` | Upload local files to get a URL for use with image-edit / image-to-video models |
| `atlas_chat` | Chat with LLM models (OpenAI-compatible format) |
| `atlas_get_prediction` | Check status and result of image/video/audio/3D generation tasks |
| `atlas_get_balance` | Get the account balance and credit summary for your API key |
| `atlas_get_model_usage` | Get daily model usage (requests, tokens, image/video counts) over a date range |
| `atlas_get_model_costs` | Get daily model cost (spend) buckets over a date range |

## Usage Examples

### Search for models

> "Search Atlas Cloud for video generation models"

Your AI assistant will use `atlas_search_docs` or `atlas_list_models` to find relevant models.

### Generate an image

> "Generate an image of a cat in space using Seedream"

The assistant will:
1. Use `atlas_list_models` to find Seedream image models
2. Use `atlas_get_model_info` to get the model's parameters
3. Use `atlas_generate_image` with the correct parameters

### Generate a video

> "Create a video of a rocket launch using Kling v3"

The assistant will:
1. Find the Kling video model
2. Get its schema to understand required parameters
3. Use `atlas_generate_video` with appropriate parameters

### Upload a local image for editing or video generation

> "Edit this image ./photos/cat.jpg to add a hat"

The assistant will:
1. Use `atlas_upload_media` to upload the local file and get a URL
2. Find an image-editing model
3. Use `atlas_generate_image` with the uploaded URL

> **Note**: Uploaded files are for temporary use with Atlas Cloud generation tasks only. Files may be cleaned up periodically. Do not use this as permanent file hosting — abuse may result in API key suspension.

### Generate speech (TTS)

> "Read this sentence aloud with Seed Audio: Welcome to Atlas Cloud"

The assistant will:
1. Use `atlas_list_models` with `type="Audio"` to find the TTS model
2. Use `atlas_generate_audio` with the text to synthesize
3. Use `atlas_get_prediction` to retrieve the generated audio URL

### Generate music

> "Make a 30-second upbeat synthwave track for my product demo with Suno"

Music models (Suno Chirp, MiniMax Music) are Audio-type models, so the assistant uses `atlas_generate_audio` with a song description (and optionally lyrics), then retrieves the audio URL via `atlas_get_prediction`.

### Transcribe audio (speech-to-text)

> "Transcribe this interview recording: https://example.com/interview.mp3"

The assistant uses `atlas_transcribe_audio` with a speech-to-text model (e.g., `bytedance/seed-asr-2.0`) and the `audio_url`, then retrieves the transcript via `atlas_get_prediction`. For local files, it first calls `atlas_upload_media` to get a URL.

### Generate a 3D model

> "Turn this product photo into a 3D model with Hunyuan 3D"

3D models are Image-type models, so the assistant uses `atlas_generate_image` with the `image` parameter and retrieves a GLB/OBJ/USDZ file via `atlas_get_prediction`.

### Chat with an LLM

> "Ask Qwen to explain quantum computing"

The assistant will use `atlas_chat` with the Qwen model.

### Check balance and usage

> "How much Atlas Cloud credit do I have left, and what did I spend this month?"

The assistant will use `atlas_get_balance` for the current balance and `atlas_get_model_costs` for the spend breakdown.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Typecheck (includes tests)
npm run typecheck

# Test
npm test

# Lint / format
npm run lint
npm run format:check

# Run in development mode (stdio)
npm run dev
```

`eslint.config.js` and `.prettierignore` both carve out upstream's original
`src/services/`, `src/tools/`, `src/utils/`, `src/types.ts`, and
`src/constants.ts` from the two rules they predate (`no-explicit-any`,
`no-unused-vars`, and prettier's own formatting) — that code is left
untouched deliberately, so `git fetch upstream && git merge` stays
low-conflict. See [CLAUDE.md](CLAUDE.md) for the full list of deliberate
deviations from the fleet's usual conventions.

## More Atlas Cloud Tools

- 🧰 **Want to use it from the terminal?** → [atlascloud-cli](https://github.com/AtlasCloudAI/cli)
- 🤖 **Want to use it in Claude Code / Cursor?** → [Atlas Cloud MCP Server](https://github.com/AtlasCloudAI/mcp-server)
- 🎬 **Want it as a Claude Code / Codex / Gemini CLI Skill?** → [atlas-cloud-skills](https://github.com/AtlasCloudAI/atlas-cloud-skills)
- 🎨 **ComfyUI nodes** → [atlascloud_comfyui](https://github.com/AtlasCloudAI/atlascloud_comfyui)
- 🔁 **n8n nodes** → [n8n-nodes-atlascloud](https://github.com/AtlasCloudAI/n8n-nodes-atlascloud)
- 💬 **Join our Discord** → [discord.gg/MWmMr4q9es](https://discord.gg/MWmMr4q9es)
- 🌐 **Website** → [atlascloud.ai](https://www.atlascloud.ai?utm_source=github&utm_campaign=mcp-server)

## License

MIT
