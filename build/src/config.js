// 全局常量配置：所有"魔法字符串/数字"集中放在这里，方便统一维护。

// 赞助页跳转链接（菜单里"打开 Jessie 的 WHV 专题页"按钮使用）
export const SPONSOR_WHV_URL = "https://www.jessieontheroad.com/zh/whv/";

// BYOK 模式下，用户没有显式指定模型时的默认模型名。
// 选择标准：在各家厂商里挑"便宜 + 速度快 + 跟随 JSON 指令稳定"的型号。
//
// OpenRouter 免费模型队列 —— 默认 + 404/429 时自动轮换。
// 必须带 ":free" 后缀,或特殊路由 "openrouter/free"(Worker 白名单已放行)。
// 模型 ID 会变:404 = 已下架,429 = 限流;扩展会自动试下一个。
export const OPENROUTER_FREE_MODEL_FALLBACKS = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "z-ai/glm-4.5-air:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-v4-flash:free",
];

// Google AI Studio (Gemini) —— 推荐优先使用的免费在线模型
// 免费额度大、context 长、支持多模态(后续可扩展上传签证/PDF/截图)。
// Key: https://aistudio.google.com/apikey
export const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_FREE_MODEL_FALLBACKS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
];

export const GEMINI_AISTUDIO_KEY_URL = "https://aistudio.google.com/apikey";

// DeepSeek Platform —— 中文 / 推理 / 代码强,按量计费但便宜
// Key: https://platform.deepseek.com/api_keys
export const DEEPSEEK_API_BASE = "https://api.deepseek.com";

/** deepseek-chat = V3 对话(默认); deepseek-reasoner = R1 推理(签证/政策判断更强) */
export const DEEPSEEK_MODEL_FALLBACKS = [
  "deepseek-chat",
  "deepseek-reasoner",
];

export const DEEPSEEK_PLATFORM_KEY_URL = "https://platform.deepseek.com/api_keys";

export const DEFAULT_LLM_MODELS = {
  gemini: GEMINI_FREE_MODEL_FALLBACKS[0],
  deepseek: DEEPSEEK_MODEL_FALLBACKS[0],
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  openrouter: OPENROUTER_FREE_MODEL_FALLBACKS[0],
};

// OpenRouter 推荐发请求时带这两个头，便于他们做应用统计 + 在 leaderboard 上
// 把流量归到你的"应用"下；不带也不会报错。
export const OPENROUTER_REFERRER = "https://github.com/zip_to_gmaps";
export const OPENROUTER_APP_TITLE = "WHV Postcode Marker";

// ============================================================================
// Cloudflare Worker 代理 URL —— 推荐方案,key 不暴露给客户端
// ============================================================================
//
// 部署 worker 后(见 ../worker/README.md),把 wrangler 打印的 URL 填到这里。
// 形如:"https://whv-or-proxy.<你的子域>.workers.dev"
//
// 注意:**只填到根 URL,不要带路径**。扩展主要请求:
//   POST /v1/ai/chat  — AI Router(多模型自动切换)
//
// 架构: Extension → Worker → AI Router →
//   长文本: Gemini → Groq → OpenRouter → SiliconFlow → Workers AI
//   快速:   Groq → Gemini → OpenRouter → SiliconFlow → Workers AI
//   代码:   SiliconFlow (Qwen Coder) → OpenRouter → Groq → Workers AI
//   中文推理: DeepSeek BYOK 直连(不经 Worker)
//
// Worker secrets: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_KEY, SILICONFLOW_API_KEY
// Workers AI: wrangler.toml [ai] binding, 无需 secret
// ----------------------------------------------------------------------------
export const OPENROUTER_PROXY_URL = "https://whv-or-proxy.jessie-whv-marker.workers.dev";

// ============================================================================
// 内置的 OpenRouter API key —— Legacy / 应急 fallback
// ============================================================================
//
// 这个常量是 v1 设计("开箱即用免费版,key 直接打包进扩展")的产物。
// 现在推荐的做法是用上面的 OPENROUTER_PROXY_URL 走 worker 代理 —— key 永远
// 不离开 Cloudflare 后端,扩展用户解包也拿不到。
//
// **如果你部署了 worker,请保持这个常量为空字符串 ""**。它只在以下边缘
// 场景下还有用:
//   - 你不想/还没部署 worker,接受 key 出现在扩展包里
//   - worker 临时挂了,你想用扩展端的 key 作为应急兜底(需要重新发版才生效)
//
// ⚠️ 如果你确实要填这把 key,请遵守以下规则
// ----------------------------------------------------------------------------
//   1. 这把 key 仅用于免费模型(":free" 后缀)。不要填带付费额度的主账号 key
//   2. 在 https://openrouter.ai/settings/keys 给它单独设 Credit Limit = $0
//   3. 不要 commit 真 key 到 public Git 仓库 —— 默认空字符串,本地打包时再替换
//   4. 想撤销时回 OpenRouter 控制台一键 Revoke,扩展会自动 fallback 到本地引擎
// ----------------------------------------------------------------------------
export const BUILTIN_OPENROUTER_KEY = "";

// Legacy:打包内置 Gemini key(不推荐;请用 worker + GEMINI_API_KEY secret)
export const BUILTIN_GEMINI_KEY = "";
