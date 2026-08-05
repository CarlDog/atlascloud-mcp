// Repo-specific config for atlascloud-mcp. Extends the fleet's shared
// BaseConfig with one fail-fast check specific to running this server over
// HTTP (see docker-compose.yml / README "Securing the HTTP endpoint").
//
// Deliberately does NOT read ATLASCLOUD_API_KEY: src/services/api-client.ts's
// getApiKey() already reads it lazily and throws a helpful, tool-scoped error
// only when an authenticated tool is actually invoked. Atlas Cloud's own API
// allows unauthenticated catalog browsing (atlas_list_models /
// atlas_search_docs call GET /models with requireAuth: false), so forcing an
// eager startup failure here — the pattern the rest of the fleet uses for its
// own required credentials — would break that legitimate no-key use case.

import { loadBaseConfig, type BaseConfig } from "./shared/config.js";
import { logger } from "./shared/log.js";

const log = logger("config");

export type Config = BaseConfig;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const config = loadBaseConfig(env);

  // MCP_ALLOWED_HOSTS is required whenever HTTP transport is on. The MCP
  // SDK's own DNS-rebinding options are deprecated, so the shared
  // http-transport.ts hand-rolls this allowlist — but it treats an empty
  // list as "open" so it can also serve repos that only need it optionally.
  // For a billable API, "open by default" is the wrong failure mode: fail
  // closed instead.
  if (
    config.port !== undefined &&
    (!config.allowedHosts || config.allowedHosts.length === 0)
  ) {
    log.error(
      "MCP_ALLOWED_HOSTS is required when MCP_PORT is set — comma-separated Host header values this server accepts on /mcp (e.g. 'your-nas:3010'). See README 'Securing the HTTP endpoint'.",
    );
    process.exit(1);
  }

  return config;
}
