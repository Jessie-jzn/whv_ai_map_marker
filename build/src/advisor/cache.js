// LLM 推荐结果的本地缓存
// ----------------------------------------------------------------------------
// 目标:同一组 (inputs + provider + model + locale) 的请求不重复消耗 token。
//
// 设计要点
// 1. key 用 SHA-256 摘要,确保:
//      a) 长 notes 不会污染 key 长度;
//      b) 等价输入(空白/大小写差异)走 normalizeForKey 归一化后命中同一条;
//      c) apiKey 不参与 — 同账号换 key 不需要重新请求。
// 2. 存储用 chrome.storage.local(失败回退 localStorage);整条缓存以单 key
//    `aiLlmCache` 保存为 { entries: { [hash]: entry } },写入是整对象覆盖,
//    便于一次性 atomic 更新 + 清理。
// 3. 容量上限 MAX_ENTRIES;超出时按最旧 lastUsed 淘汰(LRU)。
// 4. TTL_MS 过期就视作 miss,但不主动清理;读到过期项时再删一条,惰性 GC。
// 5. 失败 / 空 recommendations 的响应不写缓存。
// ----------------------------------------------------------------------------

export const CACHE_STORAGE_KEY = "aiLlmCache";
export const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
export const MAX_ENTRIES = 30;

/**
 * 把 inputs 归一化为只含必要字段的对象,字段顺序固定,空白/大小写统一,
 * 保证语义相同的输入产生同一 key。
 */
const VALID_PROVIDERS = new Set([
  "cloud",
  "gemini",
  "deepseek",
  "openai",
  "anthropic",
  "openrouter",
]);

function normalizeForKey({ inputs, settings, locale }) {
  const i = inputs || {};
  const s = settings || {};
  return {
    v: 1, // 结构版本号 — 以后改动 schema 时 bump,旧缓存自然 miss
    locale: locale === "zh" ? "zh" : "en",
    provider: VALID_PROVIDERS.has(s.provider) ? s.provider : "local",
    model: (s.model || "").trim().toLowerCase(),
    inputs: {
      currentLocation: (i.currentLocation || "").trim().toLowerCase(),
      canDrive: !!i.canDrive,
      goal: (i.goal || "second").trim(),
      industry: (i.industry || "any").trim(),
      notes: (i.notes || "").replace(/\s+/g, " ").trim(),
    },
  };
}

/**
 * 用 Web Crypto 做 SHA-256;退化路径(测试环境/极旧浏览器)走一个轻量
 * 字符串哈希。返回 16 个 hex 字符,足够分布 30 条不冲突。
 */
async function sha256Hex(text) {
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof TextEncoder !== "undefined"
  ) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);
  }
  // FNV-1a 32-bit,运行在 Node 无 crypto 环境/单元测试时
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export async function buildCacheKey(params) {
  const canonical = JSON.stringify(normalizeForKey(params));
  return sha256Hex(canonical);
}

/* ---------------- 存储抽象(chrome.storage.local 优先,localStorage 兜底) ---------------- */

async function readBucket() {
  try {
    if (chrome?.storage?.local?.get) {
      const r = await chrome.storage.local.get(CACHE_STORAGE_KEY);
      const bucket = r?.[CACHE_STORAGE_KEY];
      if (bucket && typeof bucket === "object" && bucket.entries) return bucket;
    }
  } catch (_) {
    /* swallow */
  }
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.entries) return parsed;
      }
    }
  } catch (_) {
    /* swallow */
  }
  return { entries: {} };
}

async function writeBucket(bucket) {
  try {
    if (chrome?.storage?.local?.set) {
      await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: bucket });
      return;
    }
  } catch (_) {
    /* swallow */
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(bucket));
    }
  } catch (_) {
    /* swallow */
  }
}

/* ---------------- 公共 API ---------------- */

/**
 * 命中返回 { json, cachedAt }(已过期时返回 null 并惰性清除该条);未命中返回 null。
 */
export async function getCachedLlm(key, { ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!key) return null;
  const bucket = await readBucket();
  const entry = bucket.entries[key];
  if (!entry) return null;

  const now = Date.now();
  if (typeof entry.ts !== "number" || now - entry.ts > ttlMs) {
    // 过期,删掉
    delete bucket.entries[key];
    await writeBucket(bucket);
    return null;
  }

  entry.lastUsed = now;
  await writeBucket(bucket);
  return { json: entry.json, cachedAt: entry.ts };
}

/**
 * 写入。失败 / 空 recommendations 的响应不应该调用此函数,这里只做一次保险:
 * 如果 json.recommendations 为空,直接 no-op。
 */
export async function putCachedLlm(key, json, { maxEntries = MAX_ENTRIES } = {}) {
  if (!key) return;
  if (!json || !Array.isArray(json.recommendations) || json.recommendations.length === 0) {
    return;
  }
  const bucket = await readBucket();
  const now = Date.now();
  bucket.entries[key] = { json, ts: now, lastUsed: now };

  // 超容量:按 lastUsed 升序淘汰最早未使用的
  const keys = Object.keys(bucket.entries);
  if (keys.length > maxEntries) {
    const sorted = keys
      .map((k) => ({ k, lu: bucket.entries[k].lastUsed || bucket.entries[k].ts || 0 }))
      .sort((a, b) => a.lu - b.lu);
    const toDrop = sorted.slice(0, keys.length - maxEntries);
    for (const { k } of toDrop) delete bucket.entries[k];
  }
  await writeBucket(bucket);
}

/** 完整清空。 */
export async function clearLlmCache() {
  await writeBucket({ entries: {} });
}

/**
 * 返回当前缓存的统计信息,供 UI 显示:
 *   { count, oldestAt, newestAt }
 * 过期条目也会被计入(不主动 GC,避免每次都 round-trip 写一次)。
 */
export async function getLlmCacheStats() {
  const bucket = await readBucket();
  const entries = Object.values(bucket.entries);
  if (!entries.length) return { count: 0, oldestAt: 0, newestAt: 0 };
  let oldestAt = Infinity;
  let newestAt = 0;
  for (const e of entries) {
    if (typeof e.ts === "number") {
      if (e.ts < oldestAt) oldestAt = e.ts;
      if (e.ts > newestAt) newestAt = e.ts;
    }
  }
  return {
    count: entries.length,
    oldestAt: oldestAt === Infinity ? 0 : oldestAt,
    newestAt,
  };
}
