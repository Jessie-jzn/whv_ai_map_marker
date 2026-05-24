// Worker AI Router 客户端 — 统一免费云模型入口
// Chrome Extension → Cloudflare Worker (/v1/ai/chat) → 多上游自动切换

import { OPENROUTER_PROXY_URL } from "../config.js";
import { parseLlmJson } from "./llmJson.js";

export function hasCloudRouter() {
  return (
    typeof OPENROUTER_PROXY_URL === "string" &&
    /^https?:\/\//.test(OPENROUTER_PROXY_URL)
  );
}

/**
 * @param {object} opts
 * @param {string} opts.system
 * @param {string} opts.user
 * @param {'long'|'fast'|'code'|'default'} [opts.purpose] WHV 推荐用 long(长文本/Gemini 优先)
 * @returns {Promise<{ json: object, provider: string, model: string }>}
 */
export async function askCloudRouter({ system, user, purpose = "long" }) {
  if (!hasCloudRouter()) {
    throw new Error("Cloud AI router URL not configured");
  }

  const url = `${OPENROUTER_PROXY_URL.replace(/\/$/, "")}/v1/ai/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-WHV-Client": "whv-ext" },
    body: JSON.stringify({
      purpose,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  const errText = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `CloudRouter ${res.status} ${errText.slice(0, 200)}`
    );
  }

  let data;
  try {
    data = JSON.parse(errText);
  } catch {
    throw new Error("CloudRouter invalid JSON response");
  }

  const provider =
    res.headers.get("X-WHV-Provider") ||
    data?._whv_router?.provider ||
    "cloud";
  const model =
    res.headers.get("X-WHV-Model") || data?._whv_router?.model || "";

  const content = data?.choices?.[0]?.message?.content;
  const json = parseLlmJson(content);
  return { json, provider, model };
}
