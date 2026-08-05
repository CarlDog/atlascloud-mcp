import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { api, fetchExternal } from "./api-client.js";
import type { Model, ModelsResponse } from "../types.js";
import { logger } from "../shared/log.js";

const log = logger("doc-fetcher");

// In-memory cache for models list
let modelsCache: Model[] | null = null;
let modelsCacheTime = 0;
// 24 hours — the catalog churns at most daily, and this is now disk-persisted
// across restarts (see loadDiskCache/saveDiskCache below), not just an
// in-process guard against request bursts within a single hot process.
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Disk cache location. Defaults to the OS temp dir for stdio/local use
// (harmless, no assumption about cwd writability); override to a mounted
// volume path in Docker via ATLASCLOUD_CACHE_DIR (see docker-compose.yml's
// HOST_CACHE_DIR).
const CACHE_DIR =
  process.env.ATLASCLOUD_CACHE_DIR || join(tmpdir(), "atlascloud-mcp-cache");
const CACHE_FILE = join(CACHE_DIR, "models.json");

interface DiskCache {
  fetchedAt: number;
  models: Model[];
}

// Loads the disk cache only if it parses AND is still within CACHE_TTL of its
// OWN fetchedAt (not of the moment it's loaded) -- otherwise an in-memory
// cache populated from a stale-but-just-loaded disk file would look fresh for
// a full new TTL window, silently doubling the true data age.
async function loadDiskCache(): Promise<DiskCache | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as DiskCache;
    if (Array.isArray(parsed.models) && Date.now() - parsed.fetchedAt < CACHE_TTL) {
      return parsed;
    }
    return null;
  } catch {
    return null; // missing, unreadable, or malformed -- treat as a cache miss
  }
}

// Best-effort: a disk-cache write failure must never break the tool call that
// triggered it -- the in-memory cache and the live fetch already succeeded;
// this is purely an optimization for next time.
async function saveDiskCache(models: Model[]): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    const payload: DiskCache = { fetchedAt: Date.now(), models };
    await writeFile(CACHE_FILE, JSON.stringify(payload), "utf8");
  } catch (error) {
    log.warn("failed to write model cache to disk", { error: String(error) });
  }
}

// Fetch and cache all models
export async function getModels(): Promise<Model[]> {
  const now = Date.now();
  if (modelsCache && now - modelsCacheTime < CACHE_TTL) {
    return modelsCache;
  }

  const fromDisk = await loadDiskCache();
  if (fromDisk) {
    modelsCache = fromDisk.models;
    modelsCacheTime = fromDisk.fetchedAt;
    return fromDisk.models;
  }

  const response = await api<ModelsResponse>("/models", { requireAuth: false });
  const models = (response.data || []).filter((m) => m.display_console !== false);
  modelsCache = models;
  modelsCacheTime = now;
  void saveDiskCache(models);
  return models;
}

// Normalize string for fuzzy matching: remove separators, collapse spaces
function normalize(s: string): string {
  return s.toLowerCase().replace(/[-_./]/g, " ").replace(/\s+/g, " ").trim();
}

// Check if all query words appear in the target string
function fuzzyMatch(target: string, queryWords: string[]): boolean {
  const normalizedTarget = normalize(target);
  return queryWords.every((w) => normalizedTarget.includes(w));
}

// Find a model by model ID (e.g., "deepseek-ai/deepseek-v3.2"), supports exact and normalized match
export async function findModel(modelId: string): Promise<Model | undefined> {
  const models = await getModels();
  const normalizedInput = normalize(modelId);

  return models.find(
    (m) =>
      m.model === modelId ||
      m.model.toLowerCase() === modelId.toLowerCase() ||
      m.displayName.toLowerCase() === modelId.toLowerCase() ||
      normalize(m.model) === normalizedInput ||
      normalize(m.displayName) === normalizedInput
  );
}

// Fetch model OpenAPI schema
export async function getModelSchema(
  model: Model
): Promise<Record<string, unknown> | null> {
  if (!model.schema) return null;
  try {
    const schema = await fetchExternal(model.schema);
    return schema as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Fetch model README
export async function getModelReadme(model: Model): Promise<string | null> {
  if (!model.readme) return null;
  try {
    const content = await fetchExternal(model.readme);
    return typeof content === "string" ? content : null;
  } catch {
    return null;
  }
}

// Search models by keyword with fuzzy matching
export async function searchModels(query: string): Promise<Model[]> {
  const models = await getModels();
  const queryWords = normalize(query).split(" ").filter(Boolean);

  if (queryWords.length === 0) return [];

  return models.filter((m) => {
    const fields = [
      m.model,
      m.displayName,
      m.profile || "",
      m.type || "",
      m.organization || "",
      ...(m.tags || []),
      ...(m.categories || []),
    ];
    return fields.some((f) => fuzzyMatch(f, queryWords));
  });
}
