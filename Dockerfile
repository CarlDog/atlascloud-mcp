# Multi-stage build — standard MCP-E01.

# ── build ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
# Manifests first: this layer is cached until dependencies actually change.
COPY package.json package-lock.json ./
# npm ci, never npm install. ci fails on a lockfile that does not match the
# manifest; install silently rewrites it, so the image ships a dependency graph
# no lockfile describes. See fleet/lessons/npm-version-skew.
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── production dependencies only ────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── runtime ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Non-root, named `mcp` fleet-wide (the survey found four different names).
RUN addgroup -S mcp && adduser -S mcp -G mcp

COPY --from=deps  --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=build --chown=mcp:mcp /app/dist ./dist
COPY --chown=mcp:mcp package.json ./

USER mcp
EXPOSE 3000

# Conditional on MCP_PORT: in stdio mode there is no HTTP server and no
# /health endpoint at all, so an unconditional probe would mark every
# `docker run -i` container permanently unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c '[ -z "$MCP_PORT" ] || wget -q -O- "http://127.0.0.1:$MCP_PORT/health" || exit 1'

CMD ["node", "dist/index.js"]
