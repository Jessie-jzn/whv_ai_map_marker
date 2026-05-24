# WHV AI 代理 Worker — AI Router

## 架构

```
Chrome Extension
       ↓
Cloudflare Worker  (POST /v1/ai/chat)
       ↓
    AI Router
       ↓
  多免费上游自动切换
```

| 用途 | 优先链 | 典型模型 |
|------|--------|----------|
| **长文本** `long` | Gemini → Groq → OpenRouter → SiliconFlow → Workers AI | `gemini-2.0-flash` |
| **快速聊天** `fast` | Groq → Gemini → OpenRouter → SiliconFlow → Workers AI | `llama-3.1-8b-instant` |
| **Coding** `code` | SiliconFlow → OpenRouter → Groq → Workers AI | `Qwen/Qwen2.5-Coder-7B-Instruct` |
| **中文推理** | 扩展 BYOK 直连 DeepSeek | `deepseek-chat` / `deepseek-reasoner` |

限流/故障时按链向下切换，例如：

```
Gemini 429 → Groq → OpenRouter 超限 → SiliconFlow → Workers AI (edge)
```

## 路由

| 路径 | 说明 |
|------|------|
| `POST /v1/ai/chat` | **主入口** — AI Router |
| `GET /` | 健康检查 + 各上游是否已配置 secret |
| `POST /v1/gemini/generateContent` | 兼容旧扩展 → 内部转 `purpose=long` |
| `POST /v1/chat/completions` | 兼容旧扩展 → 内部转 `purpose=fast` |

### 请求体示例

```json
{
  "purpose": "long",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.4,
  "response_format": { "type": "json_object" }
}
```

成功响应为 OpenAI Chat Completions 格式，并带 `_whv_router.provider` / 响应头 `X-WHV-Provider`。

## 部署

```bash
cd worker
npm install
wrangler login

# 至少配置一个上游；建议全配以便 failover
wrangler secret put GEMINI_API_KEY      # aistudio.google.com
wrangler secret put GROQ_API_KEY        # console.groq.com
wrangler secret put OPENROUTER_KEY      # openrouter.ai
wrangler secret put SILICONFLOW_API_KEY   # siliconflow.cn

wrangler deploy
```

Workers AI 在 `wrangler.toml` 已启用 `[ai] binding = "AI"`，无需 secret。

把部署 URL 填入 `build/src/config.js` 的 `OPENROUTER_PROXY_URL`。

## 本地开发

```bash
cp .dev.vars.example .dev.vars
# 填入各平台 key
npm run dev
```

## 扩展侧

- **智能云路由** (`provider=cloud`) → `/v1/ai/chat` + `purpose=long`
- **Gemini 无 key** → 同上（长文本链）
- **OpenRouter 无 key** → `purpose=fast`
- **DeepSeek** → 用户自填 key，不经 Worker
