// WHV AI 代理 Worker
// Chrome Extension → Worker → AI Router → Gemini / Groq / OpenRouter / SiliconFlow / Workers AI

import { routeAiChat, routerHealth } from "./aiRouter.js";

const ROUTE_AI_CHAT = "/v1/ai/chat";
const ROUTE_OPENROUTER = "/v1/chat/completions";
const ROUTE_GEMINI = "/v1/gemini/generateContent";
const MAX_BODY_CHAT = 512 * 1024;
const MAX_BODY_LEGACY = 64 * 1024;
const ALLOWED_ORIGIN_PREFIX = "chrome-extension://";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-WHV-Client",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return jsonResponse({ ok: true, ...routerHealth(env) }, 200);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    if (url.pathname === ROUTE_AI_CHAT) {
      return handleAiChat(request, env);
    }
    if (url.pathname === ROUTE_OPENROUTER) {
      return handleLegacyOpenRouter(request, env);
    }
    if (url.pathname === ROUTE_GEMINI) {
      return handleLegacyGemini(request, env);
    }

    return jsonResponse(
      {
        error: "not_found",
        hint: `请使用 POST ${ROUTE_AI_CHAT} (AI Router)`,
      },
      404
    );
  },
};

async function guardRequest(request, env, maxBody) {
  const origin = request.headers.get("Origin") || "";
  if (!origin.startsWith(ALLOWED_ORIGIN_PREFIX)) {
    return {
      error: jsonResponse(
        { error: "forbidden_origin", got: origin || "(empty)" },
        403
      ),
    };
  }

  const contentLength = parseInt(
    request.headers.get("Content-Length") || "0",
    10
  );
  if (contentLength > maxBody) {
    return {
      error: jsonResponse(
        { error: "payload_too_large", limit: maxBody },
        413
      ),
    };
  }

  const clientIP =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  if (env.RATE_LIMITER && typeof env.RATE_LIMITER.limit === "function") {
    try {
      const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
      if (!success) {
        return {
          error: jsonResponse(
            { error: "rate_limited", retry_after_seconds: 60 },
            429
          ),
        };
      }
    } catch (e) {
      console.warn("rate limit check failed:", e);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch (_e) {
    return { error: jsonResponse({ error: "invalid_json" }, 400) };
  }

  return { body };
}

async function handleAiChat(request, env) {
  const guard = await guardRequest(request, env, MAX_BODY_CHAT);
  if (guard.error) return guard.error;

  const result = await routeAiChat(guard.body, env);
  const headers = { ...CORS_HEADERS, ...(result.headers || {}) };
  return jsonResponse(result.body, result.status, headers);
}

/** 旧扩展兼容:OpenRouter 直连 → 转 AI Router (purpose=fast) */
async function handleLegacyOpenRouter(request, env) {
  const guard = await guardRequest(request, env, MAX_BODY_LEGACY);
  if (guard.error) return guard.error;
  const body = guard.body;
  const messages = body.messages || [];
  const result = await routeAiChat(
    {
      purpose: "fast",
      messages,
      temperature: body.temperature,
      response_format: body.response_format,
    },
    env
  );
  const headers = { ...CORS_HEADERS, ...(result.headers || {}) };
  return jsonResponse(result.body, result.status, headers);
}

/** 旧扩展兼容:Gemini 体 → 转 AI Router (purpose=long) */
async function handleLegacyGemini(request, env) {
  const guard = await guardRequest(request, env, MAX_BODY_CHAT);
  if (guard.error) return guard.error;
  const body = guard.body;
  const system =
    body.systemInstruction?.parts?.map((p) => p.text).join("") || "";
  const user =
    body.contents?.[0]?.parts?.map((p) => p.text).join("") || "";
  const result = await routeAiChat(
    {
      purpose: "long",
      system,
      user,
      temperature: body.generationConfig?.temperature,
      response_format:
        body.generationConfig?.responseMimeType === "application/json"
          ? { type: "json_object" }
          : undefined,
    },
    env
  );
  if (!result.ok) {
    const headers = { ...CORS_HEADERS, ...(result.headers || {}) };
    return jsonResponse(result.body, result.status, headers);
  }
  const text = result.body?.choices?.[0]?.message?.content || "";
  const geminiShape = {
    candidates: [{ content: { parts: [{ text }] } }],
    _whv_router: result.body._whv_router,
  };
  const headers = { ...CORS_HEADERS, ...(result.headers || {}) };
  return jsonResponse(geminiShape, 200, headers);
}

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
