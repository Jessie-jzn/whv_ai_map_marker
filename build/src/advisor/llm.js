// LLM (BYOK) 集成
// ----------------------------------------------------------------------------
// 这是给"高级用户"的可选通道：
//   - 默认走本地 recommend.js 推荐引擎；
//   - 若用户在设置里填了 OpenAI 或 Anthropic 的 API key，Ask AI 会改成调他们
//     自己账号下的模型，得到更自由的解释；
//   - 任何失败都会被 UI 层捕获并静默回退到本地引擎。
//
// 我们刻意把 prompt 里塞了一份 LOCAL_TOWNS 摘要，让模型从"可信邮编"出发去做
// 推荐，避免它瞎编邮编。
// ----------------------------------------------------------------------------

import {
  DEFAULT_LLM_MODELS,
  OPENROUTER_REFERRER,
  OPENROUTER_APP_TITLE,
  BUILTIN_OPENROUTER_KEY,
  OPENROUTER_PROXY_URL,
  OPENROUTER_FREE_MODEL_FALLBACKS,
} from "../config.js";
import { WHV_TOWNS } from "../data/whvTowns.js";
import { parseLlmJson } from "./llmJson.js";
import { askGemini } from "./gemini.js";
import { askDeepseek } from "./deepseek.js";
import { askCloudRouter, hasCloudRouter } from "./cloudRouter.js";

/**
 * 是否构建包内置了 OpenRouter 免费 key(legacy / 应急 fallback)。
 * UI 层据此决定:选了 OpenRouter 而 apiKey 为空时是放行还是要求用户填。
 */
export function hasBuiltinOpenrouterKey() {
  return typeof BUILTIN_OPENROUTER_KEY === "string" && BUILTIN_OPENROUTER_KEY.length > 0;
}

/**
 * 是否配置了 Cloudflare Worker 代理 URL。
 * 配置了的话 —— provider=openrouter + 用户空 key 会走 worker,
 * 真 key 永远不出云端。
 */
export function hasOpenrouterProxy() {
  return hasCloudRouter();
}

/** 诊断用:OpenRouter 请求会走哪条路径(不含任何 secret)。 */
export function describeOpenrouterRoute(settings) {
  const userApiKey = (settings?.apiKey || "").trim();
  if (userApiKey) return "direct-user-key";
  if (hasOpenrouterProxy()) return "proxy";
  if (hasBuiltinOpenrouterKey()) return "direct-builtin";
  return "none";
}

/** 429/503 时按此顺序轮换免费模型;用户指定模型排第一。 */
function buildOpenrouterFreeModelQueue(settings) {
  const primary =
    (settings?.model || "").trim() || DEFAULT_LLM_MODELS.openrouter;
  const queue = [primary];
  for (const m of OPENROUTER_FREE_MODEL_FALLBACKS) {
    if (!queue.includes(m)) queue.push(m);
  }
  return queue;
}

function shouldRetryOpenrouterStatus(status, errText) {
  if (status === 429 && /rate_limited/.test(errText || "")) {
    // Worker 侧 IP 限速,换模型没用
    return false;
  }
  // 404 = 模型 ID 已下架;429/502/503 = 限流或上游故障 → 换下一个
  return status === 404 || status === 429 || status === 503 || status === 502;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 从 chrome.storage.local 读取用户的 AI 设置。
 * 返回标准化后的 { provider, apiKey, model }，任何读取失败都给安全默认值。
 */
export async function loadAiSettings() {
  try {
    const r = (await chrome.storage?.local?.get("aiLlmSettings")) || {};
    const s = r.aiLlmSettings || {};
    const validProviders = new Set([
      "cloud",
      "gemini",
      "deepseek",
      "openai",
      "anthropic",
      "openrouter",
    ]);
    return {
      provider: validProviders.has(s.provider) ? s.provider : "local",
      apiKey: typeof s.apiKey === "string" ? s.apiKey.trim() : "",
      model: typeof s.model === "string" ? s.model.trim() : "",
    };
  } catch (e) {
    return { provider: "local", apiKey: "", model: "" };
  }
}

/** 写回 AI 设置；存储失败时静默——这只是用户偏好，不算关键数据。 */
export async function saveAiSettings(settings) {
  try {
    await chrome.storage?.local?.set({ aiLlmSettings: settings });
  } catch (e) {
    // 静默失败：这是非关键设置
  }
}

/**
 * 构造给 LLM 的 prompt。提供本地知识库摘要，让模型从可信邮编出发去做推荐。
 * 返回 { system, user } 两段，调用方按厂商 API 形态自己拼。
 */
export function buildLlmPrompt(inputs, locale) {
  const localCorpus = WHV_TOWNS.map((t) => ({
    name: t.name,
    state: t.state,
    postcodes: t.postcodes,
    industries: t.industries,
    transportFriendly: t.transportFriendly,
    categories: t.categories,
  }));

  const isZh = locale === "zh";
  const system = isZh
    ? "你是澳大利亚 Working Holiday Visa(WHV)集签规划助手。基于用户的情况,给出最适合先看的 3-5 个城镇。必须严格返回 JSON,不要任何 markdown / 代码块 / 解释文字。"
    : "You are an Australian Working Holiday Visa (WHV) planning assistant. Recommend 3 to 5 towns the user should look at first, based on their situation. Return STRICT JSON only — no markdown, no code fences, no commentary.";

  const schemaInstr = isZh
    ? `JSON 结构:
{
  "summary": "一句话总结建议方向,用中文。",
  "recommendations": [
    {
      "name": "城镇英文名",
      "state": "QLD/NSW/VIC/SA/WA/NT/TAS/ACT 之一",
      "postcodes": [4670, 4671],
      "reasons": ["原因 1(中文,具体可执行)", "原因 2", "原因 3"]
    }
  ]
}
要求:每个推荐 2-3 条具体原因(交通、行业、命中资格类别等),不要空话。优先用我下面 LOCAL_TOWNS 里的邮编;如果你认为某个未列出的地方更合适,也可以推荐它,但邮编要正确。`
    : `JSON shape:
{
  "summary": "One-sentence rationale in English.",
  "recommendations": [
    {
      "name": "Town name",
      "state": "QLD/NSW/VIC/SA/WA/NT/TAS/ACT",
      "postcodes": [4670, 4671],
      "reasons": ["concrete reason 1", "reason 2", "reason 3"]
    }
  ]
}
Requirements: 2-3 concrete reasons per town (transport, industry, eligibility category, etc.). Prefer postcodes from the LOCAL_TOWNS list below; if you add a town outside that list, double-check the postcode.`;

  const user = JSON.stringify({
    user_inputs: {
      currentLocation: inputs.currentLocation || "",
      canDrive: !!inputs.canDrive,
      goal: inputs.goal || "second",
      industry: inputs.industry || "any",
      notes: inputs.notes || "",
    },
    LOCAL_TOWNS: localCorpus,
  });

  return { system: `${system}\n\n${schemaInstr}`, user };
}

export { parseLlmJson } from "./llmJson.js";

/**
 * 真正发请求。
 * @param inputs   用户输入
 * @param settings { provider, apiKey, model }
 * @param locale   "zh" | "en"
 * @returns 解析后的 LLM JSON 对象（{ summary?, recommendations[] }）
 */
export async function askLlm(inputs, settings, locale) {
  const { system, user } = buildLlmPrompt(inputs, locale);

  if (settings.provider === "cloud") {
    const { json } = await askCloudRouter({ system, user, purpose: "long" });
    return json;
  }

  if (settings.provider === "gemini") {
    return askGemini({ system, user, settings });
  }

  if (settings.provider === "deepseek") {
    return askDeepseek({ system, user, settings });
  }

  if (settings.provider === "openai") {
    const model = settings.model || DEFAULT_LLM_MODELS.openai;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
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
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status} ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return parseLlmJson(content);
  }

  if (settings.provider === "openrouter") {
    // OpenRouter 是 OpenAI 兼容协议;请求体 / 响应体跟 OpenAI 一致,
    // 区别只有 base URL + 推荐的两个统计头。
    // 默认走 ":free" 后缀的免费模型,用户也可以在设置里换成任意 OR 模型。
    //
    // 三档优先级(从高到低):
    //   ① 用户填了 apiKey
    //      → 直连 openrouter.ai,带用户 key。BYOK 经验不变,绕开 worker,
    //        他自己掏钱用付费模型也行。
    //   ② 用户没填 apiKey 但 OPENROUTER_PROXY_URL 配置了
    //      → 调 Cloudflare worker,不带 Authorization。worker 在云端注入
    //        真 key。**这是推荐方案 —— key 永远不暴露给客户端**。
    //   ③ 都没有但 BUILTIN_OPENROUTER_KEY 有值(legacy)
    //      → 直连 openrouter.ai 带打包 key。会暴露 key,只用于应急。
    //   ④ 啥都没 → 抛错,UI 层会捕获并降级到本地引擎。
    //
    // 必须 trim:storage 里若残留空格会被当成"有 key",从而直连 OR 却带
    // Authorization: Bearer (空) → OpenRouter 401 Missing Authentication header。
    const userApiKey = (settings.apiKey || "").trim();
    const route = describeOpenrouterRoute(settings);
    // 走 proxy / 内置免费 key 时,429 自动换队列里下一个 :free 模型。
    // 用户 BYOK 且指定了非 free 模型时不自动换,避免悄悄降级。
    const userModel = (settings.model || "").trim();
    const autoFallback =
      !userApiKey ||
      !userModel ||
      userModel === "openrouter/free" ||
      userModel.endsWith(":free");

    let url;
    let extraHeaders;
    if (userApiKey) {
      url = "https://openrouter.ai/api/v1/chat/completions";
      extraHeaders = {
        Authorization: `Bearer ${userApiKey}`,
        "HTTP-Referer": OPENROUTER_REFERRER,
        "X-Title": OPENROUTER_APP_TITLE,
      };
    } else if (hasOpenrouterProxy()) {
      const { json } = await askCloudRouter({ system, user, purpose: "fast" });
      return json;
    } else if (BUILTIN_OPENROUTER_KEY) {
      url = "https://openrouter.ai/api/v1/chat/completions";
      extraHeaders = {
        Authorization: `Bearer ${BUILTIN_OPENROUTER_KEY}`,
        "HTTP-Referer": OPENROUTER_REFERRER,
        "X-Title": OPENROUTER_APP_TITLE,
      };
    } else {
      throw new Error("OpenRouter no API key available");
    }

    const modelsToTry = autoFallback
      ? buildOpenrouterFreeModelQueue(settings)
      : [userModel || DEFAULT_LLM_MODELS.openrouter];

    let lastErr = null;
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const requestBody = {
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        return parseLlmJson(content);
      }

      const errText = await res.text().catch(() => "");
      lastErr = `OpenRouter ${res.status} [route:${route}] model:${model} ${errText.slice(0, 160)}`;

      const hasMore = i < modelsToTry.length - 1;
      if (autoFallback && shouldRetryOpenrouterStatus(res.status, errText) && hasMore) {
        await sleep(400);
        continue;
      }
      throw new Error(lastErr);
    }

    throw new Error(lastErr || "OpenRouter request failed");
  }

  if (settings.provider === "anthropic") {
    const model = settings.model || DEFAULT_LLM_MODELS.anthropic;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        // 浏览器直连必须显式声明，这是 Anthropic 提供给 BYOK 客户端的逃生通道
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status} ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.content?.[0]?.text;
    return parseLlmJson(content);
  }

  throw new Error("unsupported provider");
}

/**
 * 把 LLM 返回的城镇映射成 UI 可渲染的 { town, activeTags, llmReasons } 形态。
 * 优先从 WHV_TOWNS 里按 name 精确匹配；匹配不到则按 postcodes 寻找；再不行就
 * 现造一个最小 town 对象，保证 UI 渲染不崩。
 */
export function adaptLlmRecommendations(llmJson, locale) {
  const out = [];
  for (const rec of llmJson.recommendations.slice(0, 5)) {
    if (!rec || typeof rec !== "object") continue;
    const recName = String(rec.name || "").trim();
    const recPostcodes = Array.isArray(rec.postcodes)
      ? rec.postcodes.map((p) => Number(p)).filter((n) => Number.isInteger(n))
      : [];
    if (!recName && recPostcodes.length === 0) continue;

    let matched = WHV_TOWNS.find(
      (t) => t.name.toLowerCase() === recName.toLowerCase()
    );
    if (!matched && recPostcodes.length) {
      matched = WHV_TOWNS.find((t) =>
        t.postcodes.some((p) => recPostcodes.includes(p))
      );
    }

    const town = matched
      ? {
          ...matched,
          // 让 LLM 给的邮编（如果存在）覆盖本地的，以反映模型的最新建议
          postcodes: recPostcodes.length ? recPostcodes : matched.postcodes,
        }
      : {
          id: `llm-${out.length}`,
          name: recName || "Unknown",
          cnName: "",
          state: typeof rec.state === "string" ? rec.state : "",
          postcodes: recPostcodes,
          categories: [],
          industries: [],
          transportFriendly: false,
          climate: "",
          coastal: false,
          backpackerHub: false,
          pros: [],
        };

    const reasons = Array.isArray(rec.reasons)
      ? rec.reasons.filter((r) => typeof r === "string" && r.trim()).slice(0, 4)
      : [];

    // locale 参数当前没在 reasons 里用到，但保留签名便于后续做翻译/本地化
    void locale;
    out.push({
      town,
      activeTags: ["llm"],
      llmReasons: reasons,
    });
  }
  return out;
}
