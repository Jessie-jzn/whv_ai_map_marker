// Google AI Studio (Gemini) — BYOK 直连,或走 Worker AI Router (purpose=long)

import {
  DEFAULT_LLM_MODELS,
  GEMINI_API_BASE,
  GEMINI_FREE_MODEL_FALLBACKS,
  BUILTIN_GEMINI_KEY,
} from "../config.js";
import { parseLlmJson } from "./llmJson.js";
import { askCloudRouter, hasCloudRouter } from "./cloudRouter.js";

export function hasGeminiProxy() {
  return hasCloudRouter();
}

export function hasBuiltinGeminiKey() {
  return typeof BUILTIN_GEMINI_KEY === "string" && BUILTIN_GEMINI_KEY.length > 0;
}

export function describeGeminiRoute(settings) {
  const userApiKey = (settings?.apiKey || "").trim();
  if (userApiKey) return "direct-user-key";
  if (hasGeminiProxy()) return "router-long";
  if (hasBuiltinGeminiKey()) return "direct-builtin";
  return "none";
}

export function normalizeGeminiModelId(raw) {
  const m = (raw || "").trim();
  if (!m) return "";
  if (m.includes("/") || /:free$/i.test(m)) return "";
  if (!/^gemini-/i.test(m)) return "";
  return m;
}

function buildGeminiPayload(system, user) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  };
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new Error("empty gemini response");
  const text = parts.map((p) => p?.text || "").join("").trim();
  if (!text) throw new Error("empty gemini text");
  return text;
}

export async function askGemini({ system, user, settings }) {
  const userApiKey = (settings.apiKey || "").trim();

  if (!userApiKey && hasCloudRouter()) {
    const { json } = await askCloudRouter({ system, user, purpose: "long" });
    return json;
  }

  if (!userApiKey && !BUILTIN_GEMINI_KEY) {
    throw new Error("Gemini no API key available");
  }

  const userModel = normalizeGeminiModelId(settings.model);
  const model = userModel || DEFAULT_LLM_MODELS.gemini;
  const apiKey = userApiKey || BUILTIN_GEMINI_KEY;
  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(buildGeminiPayload(system, user)),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Gemini ${res.status} [route:${describeGeminiRoute(settings)}] model=${model} ${errText.slice(0, 160)}`
    );
  }

  const data = await res.json();
  return parseLlmJson(extractGeminiText(data));
}
