// AI Router — 按用途选链,失败自动切换上游
// Chrome Extension → Worker → 本模块 → Gemini / Groq / OpenRouter / SiliconFlow / Workers AI

const OR_REFERER = "https://github.com/zip_to_gmaps";
const OR_TITLE = "WHV Postcode Marker";

/** 用途 → 上游优先级(限流/故障时依次尝试) */
export const PURPOSE_CHAINS = {
  long: ["gemini", "groq", "openrouter", "siliconflow", "workers_ai"],
  fast: ["groq", "gemini", "openrouter", "siliconflow", "workers_ai"],
  code: ["siliconflow", "openrouter", "groq", "workers_ai"],
  default: ["gemini", "groq", "openrouter", "siliconflow", "workers_ai"],
};

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
];

const GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

const OPENROUTER_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "z-ai/glm-4.5-air:free",
  "openai/gpt-oss-20b:free",
];

const SILICONFLOW_BY_PURPOSE = {
  long: ["Qwen/Qwen2.5-7B-Instruct"],
  fast: ["Qwen/Qwen2.5-7B-Instruct"],
  code: ["Qwen/Qwen2.5-Coder-7B-Instruct"],
  default: ["Qwen/Qwen2.5-7B-Instruct"],
};

const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const DEFAULT_PROVIDER_TIMEOUT_MS = 6_000;
const DEFAULT_TOTAL_TIMEOUT_MS = 12_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout(run, timeoutMs) {
  let timer;
  return Promise.race([
    Promise.resolve().then(run),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error("provider_timeout");
        error.name = "TimeoutError";
        reject(error);
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

function failureCategory(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return "timeout";
  }
  return "network_error";
}

function trimKey(env, name) {
  const v = env[name];
  return typeof v === "string" ? v.trim() : "";
}

function hasProvider(env, id) {
  if (id === "workers_ai") {
    return env.AI && typeof env.AI.run === "function";
  }
  const keys = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_KEY",
    siliconflow: "SILICONFLOW_API_KEY",
  };
  return !!trimKey(env, keys[id]);
}

function shouldRetryStatus(status, errText) {
  if (status === 429) return true;
  if (status === 404 || status === 502 || status === 503) return true;
  if (status === 500 && /overload|capacity|unavailable/i.test(errText || "")) {
    return true;
  }
  return false;
}

function normalizePurpose(raw) {
  const p = String(raw || "default").toLowerCase();
  return Object.prototype.hasOwnProperty.call(PURPOSE_CHAINS, p) ? p : "default";
}

function buildMessages(body) {
  if (Array.isArray(body.messages) && body.messages.length) {
    return body.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: String(m.content ?? ""),
    }));
  }
  const out = [];
  if (body.system) out.push({ role: "system", content: String(body.system) });
  if (body.user) out.push({ role: "user", content: String(body.user) });
  return out;
}

function openAiPayload(messages, body, model) {
  return {
    model,
    messages,
    temperature: typeof body.temperature === "number" ? body.temperature : 0.4,
    ...(body.response_format ? { response_format: body.response_format } : {}),
  };
}

async function callOpenAiCompatible(
  url,
  apiKey,
  payload,
  extraHeaders = {},
  timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS
) {
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  }, timeoutMs);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data, text };
}

async function tryGemini(env, messages, body, purpose, timeoutMs) {
  const key = trimKey(env, "GEMINI_API_KEY");
  if (!key) return { skip: true, reason: "no_key" };

  const system = messages.find((m) => m.role === "system")?.content || "";
  const userParts = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n");

  for (const model of GEMINI_MODELS) {
    const geminiBody = {
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents: [{ role: "user", parts: [{ text: userParts }] }],
      generationConfig: {
        temperature: typeof body.temperature === "number" ? body.temperature : 0.4,
        responseMimeType: body.response_format?.type === "json_object"
          ? "application/json"
          : "text/plain",
      },
    };
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(geminiBody),
      },
      timeoutMs
    );
    const text = await res.text();
    if (res.ok) {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { ok: false, status: 502, text };
      }
      const parts = data?.candidates?.[0]?.content?.parts;
      const content = Array.isArray(parts)
        ? parts.map((p) => p?.text || "").join("")
        : "";
      if (!content) {
        return { ok: false, status: 502, text: "empty gemini content" };
      }
      return {
        ok: true,
        provider: "gemini",
        model,
        data: {
          choices: [{ message: { role: "assistant", content } }],
        },
      };
    }
    if (!shouldRetryStatus(res.status, text)) {
      return { ok: false, status: res.status, text };
    }
    await sleep(300);
  }
  return { ok: false, status: 429, text: "gemini models exhausted" };
}

async function tryGroq(env, messages, body, _purpose, timeoutMs) {
  const key = trimKey(env, "GROQ_API_KEY");
  if (!key) return { skip: true, reason: "no_key" };

  for (const model of GROQ_MODELS) {
    const { ok, status, data, text } = await callOpenAiCompatible(
      "https://api.groq.com/openai/v1/chat/completions",
      key,
      openAiPayload(messages, body, model),
      {},
      timeoutMs
    );
    if (ok && data?.choices?.[0]?.message?.content) {
      return { ok: true, provider: "groq", model, data };
    }
    if (!shouldRetryStatus(status, text)) {
      return { ok: false, status, text };
    }
    await sleep(300);
  }
  return { ok: false, status: 429, text: "groq models exhausted" };
}

async function tryOpenRouter(env, messages, body, _purpose, timeoutMs) {
  const key = trimKey(env, "OPENROUTER_KEY");
  if (!key) return { skip: true, reason: "no_key" };

  for (const model of OPENROUTER_MODELS) {
    const { ok, status, data, text } = await callOpenAiCompatible(
      "https://openrouter.ai/api/v1/chat/completions",
      key,
      openAiPayload(messages, body, model),
      { "HTTP-Referer": OR_REFERER, "X-Title": OR_TITLE },
      timeoutMs
    );
    if (ok && data?.choices?.[0]?.message?.content) {
      return { ok: true, provider: "openrouter", model, data };
    }
    if (!shouldRetryStatus(status, text)) {
      return { ok: false, status, text };
    }
    await sleep(300);
  }
  return { ok: false, status: 429, text: "openrouter models exhausted" };
}

async function trySiliconFlow(env, messages, body, purpose, timeoutMs) {
  const key = trimKey(env, "SILICONFLOW_API_KEY");
  if (!key) return { skip: true, reason: "no_key" };

  const models =
    SILICONFLOW_BY_PURPOSE[purpose] || SILICONFLOW_BY_PURPOSE.default;

  for (const model of models) {
    const { ok, status, data, text } = await callOpenAiCompatible(
      "https://api.siliconflow.cn/v1/chat/completions",
      key,
      openAiPayload(messages, body, model),
      {},
      timeoutMs
    );
    if (ok && data?.choices?.[0]?.message?.content) {
      return { ok: true, provider: "siliconflow", model, data };
    }
    if (!shouldRetryStatus(status, text)) {
      return { ok: false, status, text };
    }
    await sleep(300);
  }
  return { ok: false, status: 429, text: "siliconflow models exhausted" };
}

async function tryWorkersAi(env, messages, body) {
  if (!env.AI || typeof env.AI.run !== "function") {
    return { skip: true, reason: "no_binding" };
  }

  try {
    const result = await env.AI.run(WORKERS_AI_MODEL, {
      messages,
      max_tokens: 2048,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.4,
    });
    const content =
      typeof result === "string"
        ? result
        : result?.response ?? result?.result ?? "";
    if (!content) {
      return { ok: false, status: 502, text: "empty workers ai response" };
    }
    return {
      ok: true,
      provider: "workers_ai",
      model: WORKERS_AI_MODEL,
      data: {
        choices: [{ message: { role: "assistant", content } }],
      },
    };
  } catch (e) {
    return { ok: false, status: 502, text: String(e).slice(0, 200) };
  }
}

const PROVIDER_TRY = {
  gemini: (env, messages, body, purpose, timeoutMs) =>
    tryGemini(env, messages, body, purpose, timeoutMs),
  groq: (env, messages, body, purpose, timeoutMs) =>
    tryGroq(env, messages, body, purpose, timeoutMs),
  openrouter: (env, messages, body, purpose, timeoutMs) =>
    tryOpenRouter(env, messages, body, purpose, timeoutMs),
  siliconflow: (env, messages, body, purpose, timeoutMs) =>
    trySiliconFlow(env, messages, body, purpose, timeoutMs),
  workers_ai: (env, messages, body, purpose) =>
    tryWorkersAi(env, messages, body),
};

/**
 * @returns {{ ok: boolean, status: number, body: object, headers?: Record<string,string> }}
 */
export async function routeAiChat(rawBody, env) {
  const purpose = normalizePurpose(rawBody.purpose);
  const messages = buildMessages(rawBody);
  if (!messages.length) {
    return {
      ok: false,
      status: 400,
      body: { error: "missing_messages", hint: "需要 messages 或 system+user" },
    };
  }

  const chain = PURPOSE_CHAINS[purpose];
  const attempts = [];
  let lastFail = { status: 503, text: "no providers configured" };
  const providerTimeoutMs = positiveInt(
    env.AI_PROVIDER_TIMEOUT_MS,
    DEFAULT_PROVIDER_TIMEOUT_MS
  );
  const totalTimeoutMs = positiveInt(
    env.AI_TOTAL_TIMEOUT_MS,
    DEFAULT_TOTAL_TIMEOUT_MS
  );
  const deadline = Date.now() + totalTimeoutMs;

  for (const providerId of chain) {
    if (!hasProvider(env, providerId)) {
      attempts.push({ provider: providerId, skipped: "not_configured" });
      continue;
    }

    const fn = PROVIDER_TRY[providerId];
    if (!fn) continue;

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      attempts.push({ provider: providerId, error: "total_timeout" });
      lastFail = { status: 504, text: "total_timeout" };
      break;
    }

    let result;
    try {
      result = await withTimeout(
        () =>
          fn(
            env,
            messages,
            rawBody,
            purpose,
            Math.min(providerTimeoutMs, remainingMs)
          ),
        Math.min(providerTimeoutMs, remainingMs)
      );
    } catch (error) {
      const category = failureCategory(error);
      attempts.push({ provider: providerId, error: category });
      lastFail = {
        status: category === "timeout" ? 504 : 503,
        text: category,
      };
      continue;
    }
    if (result.skip) {
      attempts.push({ provider: providerId, skipped: result.reason });
      continue;
    }
    if (result.ok) {
      return {
        ok: true,
        status: 200,
        body: {
          ...result.data,
          _whv_router: {
            purpose,
            provider: result.provider,
            model: result.model,
            chain,
          },
        },
        headers: {
          "X-WHV-Provider": result.provider,
          "X-WHV-Model": result.model,
          "X-WHV-Purpose": purpose,
        },
      };
    }

    attempts.push({
      provider: providerId,
      status: result.status,
      error: (result.text || "").slice(0, 120),
    });
    lastFail = { status: result.status || 503, text: result.text || "failed" };

    if (result.status === 400) {
      break;
    }
    await sleep(200);
  }

  return {
    ok: false,
    status: lastFail.status >= 400 ? lastFail.status : 503,
    body: {
      error: "all_providers_failed",
      purpose,
      attempts,
      hint: "检查 wrangler secret: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_KEY, SILICONFLOW_API_KEY; Workers AI 需 wrangler.toml [ai] binding",
    },
  };
}

export function routerHealth(env) {
  const providers = {};
  for (const id of ["gemini", "groq", "openrouter", "siliconflow", "workers_ai"]) {
    providers[id] = hasProvider(env, id) ? "configured" : "missing";
  }
  return {
    service: "whv-ai-router",
    purpose_chains: PURPOSE_CHAINS,
    model_map: {
      long: "Gemini → Groq → OpenRouter → SiliconFlow → Workers AI",
      fast: "Groq → Gemini → OpenRouter → SiliconFlow → Workers AI",
      code: "SiliconFlow (Qwen Coder) → OpenRouter → Groq → Workers AI",
      deepseek: "扩展 BYOK 直连(不经 Worker)",
    },
    providers,
  };
}
