#!/usr/bin/env node

/**
 * Atlas Cloud MCP Server
 *
 * Provides tools for AI assistants to interact with Atlas Cloud platform:
 * - Search documentation and model info
 * - List and explore available models
 * - Generate images and videos
 * - Chat with LLM models (OpenAI-compatible)
 * - Check generation results
 *
 * Transport: stdio by default (MCP_PORT unset) — the standard mode for
 * `docker run -i` / direct invocation by an MCP client. When MCP_PORT is set,
 * serves Streamable HTTP instead, for a long-lived Portainer/Compose
 * deployment. See README "Docker (Streamable HTTP)" for the full picture.
 */

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDocsTools } from "./tools/docs.js";
import { registerModelTools } from "./tools/models.js";
import { registerImageTools } from "./tools/image.js";
import { registerVideoTools } from "./tools/video.js";
import { registerAudioTools } from "./tools/audio.js";
import { registerLLMTools } from "./tools/llm.js";
import { registerQuickGenerateTools } from "./tools/quick-generate.js";
import { registerUploadTools } from "./tools/upload.js";
import { registerAccountTools } from "./tools/account.js";
import { loadConfig } from "./config.js";
import { mountMcpHttp } from "./shared/http-transport.js";
import { logger } from "./shared/log.js";
import { SERVER_VERSION } from "./shared/version.js";

const log = logger("server");

/**
 * Builds a NEW McpServer with every tool registered. Must stay a factory, not
 * a shared instance — a single McpServer reused across HTTP sessions breaks
 * after the first one (and works fine under stdio, so light testing misses
 * it). See src/shared/http-transport.ts.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: "atlascloud-mcp",
    version: SERVER_VERSION,
  });

  registerDocsTools(server);
  registerModelTools(server);
  registerImageTools(server);
  registerVideoTools(server);
  registerAudioTools(server);
  registerLLMTools(server);
  registerQuickGenerateTools(server);
  registerUploadTools(server);
  registerAccountTools(server);

  return server;
}

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.port === undefined) {
    // Default: stdio transport (docker run -i, or a local Claude Code / MCP
    // client config).
    const server = createServer();
    await server.connect(new StdioServerTransport());
    log.info("atlascloud-mcp ready", {
      transport: "stdio",
      version: SERVER_VERSION,
    });
    return;
  }

  // HTTP transport — long-lived server for NAS / Portainer-stack deployment.
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: SERVER_VERSION });
  });

  const mcp = mountMcpHttp(app, "/mcp", {
    createServer,
    authToken: config.authToken,
    allowedHosts: config.allowedHosts,
    sessionIdleMs: config.sessionIdleMs,
  });

  const httpServer = app.listen(config.port, config.bindHost, () => {
    log.info("atlascloud-mcp ready", {
      transport: "http",
      version: SERVER_VERSION,
      bindHost: config.bindHost,
      port: config.port,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    log.info("shutting down", { signal });
    await mcp.dispose();
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  log.error("fatal error", { error: String(error) });
  process.exit(1);
});
