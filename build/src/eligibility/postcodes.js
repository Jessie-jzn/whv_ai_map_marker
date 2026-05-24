// 邮编解析工具
// ----------------------------------------------------------------------------
// 把"用户在输入框敲的随手字符串"标准化成数字邮编数组，并提供两个最常用的
// 区间/列表匹配 helper（rules.js 里高频使用）。
// ----------------------------------------------------------------------------

/**
 * 去掉多余空格，把字符串规范成"单空格 + trim"形式。
 * 用于自定义列表名前后的清洗，避免因首尾空格导致 Google Maps 匹配不到。
 */
export function normalizeListName(name = "") {
  return name.replace(/\s+/g, " ").trim();
}

/**
 * postcode 是否落在任一闭区间内。
 * 注意 ranges 元素是 [start, end] 二元数组，匹配规则是 start <= postcode <= end。
 */
export function inRanges(postcode, ranges = []) {
  return ranges.some(([start, end]) => postcode >= start && postcode <= end);
}

/** postcode 是否出现在白名单列表里。 */
export function inList(postcode, list = []) {
  return list.includes(postcode);
}

/**
 * 解析用户输入的邮编串，返回去重后的整数数组。
 * 支持以下分隔/格式：
 *   - 西文逗号、中文顿号、全角逗号、分号
 *   - 区间："2832 至 2836"、"2832 to 2836"、"2832-2836"、"2832~2836"
 *   - 起止反着写也允许，会自动倒序展开
 * 不合法的项会被忽略而不是抛错。
 */
export function parsePostcodesInput(str) {
  const postcodes = [];
  const seen = new Set();

  // 先把各种分隔符统一成西文逗号
  const input = (str || "").replace(/[、，；;]/g, ",");

  function addPostcode(n) {
    // 200-9999 是澳大利亚邮编合理范围（最小如 ACT 的 0200/200）
    if (!Number.isInteger(n) || n < 200 || n > 9999 || seen.has(n)) return;
    seen.add(n);
    postcodes.push(n);
  }

  input.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    // 先按"区间"形态匹配
    const rangeMatch = trimmed.match(/^(\d{3,4})\s*(?:至|to|-|~)\s*(\d{3,4})$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start <= end) {
        for (let i = start; i <= end; i++) addPostcode(i);
      } else {
        for (let i = start; i >= end; i--) addPostcode(i);
      }
      return;
    }

    // 再尝试单个邮编
    const singleMatch = trimmed.match(/^(\d{3,4})$/);
    if (singleMatch) addPostcode(parseInt(singleMatch[1], 10));
  });

  return postcodes;
}
