// DeepSeek Platform — BYOK 直连(OpenAI 兼容)
// ----------------------------------------------------------------------------
// 用户须在 platform.deepseek.com 申请 API key,扩展不提供代理/内置免费额度。
// 适合签证推理、条件判断、政策解释、中文推荐文案。
// ----------------------------------------------------------------------------

import {
  DEFAULT_LLM_MODELS,
  DEEPSEEK_API_BASE,
  DEEPSEEK_MODEL_FALLBACKS,
} from "../config.js";
import { parseLlmJson } from "./llmJson.js";

/** 原生 ID 形如 deepseek-chat；OpenRouter 的 deepseek/...:free 无效。 */
export function normalizeDeepseekModelId(raw) {
  const m = (raw || "").trim();
  if (!m) return "";
  if (m.includes("/") || /:free$/i.test(m)) return "";
  if (!/^deepseek-/i.test(m)) return "";
  return m;
}

function buildDeepseekModelQueue(settings) {
  const primary =
    normalizeDeepseekModelId(settings?.model) || DEFAULT_LLM_MODELS.deepseek;
  const queue = [primary];
  for (const m of DEEPSEEK_MODEL_FALLBACKS) {
    if (!queue.includes(m)) queue.push(m);
  }
  return queue;
}

function shouldRetryDeepseekStatus(status) {
  return status === 404 || status === 429 || status === 503 || status === 502;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 调用 DeepSeek,返回与 askLlm 相同结构的 JSON 对象。
 */
export async function askDeepseek({ system, user, settings }) {
  const userApiKey = (settings.apiKey || "").trim();
  if (!userApiKey) {
    throw new Error("DeepSeek API key required");
  }

  const userModel = normalizeDeepseekModelId(settings.model);
  const autoFallback = !userModel;
  const modelsToTry = autoFallback
    ? buildDeepseekModelQueue(settings)
    : [userModel];

  let lastErr = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const res = await fetch(`${DEEPSEEK_API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      return parseLlmJson(content);
    }

    const errText = await res.text().catch(() => "");
    lastErr = `DeepSeek ${res.status} model=${model} ${errText.slice(0, 160)}`;

    const hasMore = i < modelsToTry.length - 1;
    if (autoFallback && shouldRetryDeepseekStatus(res.status) && hasMore) {
      await sleep(400);
      continue;
    }
    throw new Error(lastErr);
  }

  throw new Error(lastErr || "DeepSeek request failed");
}
