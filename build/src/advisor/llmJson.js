/** 解析 LLM 返回的 JSON 文本(兼容 markdown 代码块包裹)。 */
export function parseLlmJson(text) {
  if (typeof text !== "string") throw new Error("empty response");
  let trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fence) trimmed = fence[1].trim();
  if (!trimmed.startsWith("{")) {
    const idx = trimmed.indexOf("{");
    if (idx >= 0) trimmed = trimmed.slice(idx);
  }
  const obj = JSON.parse(trimmed);
  if (!obj || !Array.isArray(obj.recommendations)) {
    throw new Error("missing recommendations array");
  }
  return obj;
}
