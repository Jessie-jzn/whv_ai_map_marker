// 批量标注主流程
// ----------------------------------------------------------------------------
// 这一层"协调"了：
//   - 全局状态（state.js）
//   - 进度条 UI（progress.js）
//   - 注入脚本（content.js）
//   - 自定义列表名持久化
//
// 单个邮编的页面交互在 content.js 里，runner 不直接操 DOM。
// ----------------------------------------------------------------------------

import { langPack } from "../i18n.js";
import {
  parsePostcodesInput,
  normalizeListName,
} from "../eligibility/postcodes.js";
import { getMatchedEligibility } from "../eligibility/rules.js";
import { markSinglePostcode } from "./content.js";
import {
  isMarking,
  setMarking,
  setPaused,
  clearProgressResetTimer,
} from "./state.js";
import {
  setButtonsRunningState,
  setProgress,
  startProgress,
  finishProgress,
  resetProgressLater,
  waitWhilePaused,
} from "./progress.js";

/**
 * "一键按类别"功能用到的邮编缓存。
 * 第一次访问某类别时全量扫描 200-9999 区间，命中类别就 push；之后直接复用。
 * 邮编以 4 位 0 填充的字符串形式存（"0872"），符合 Google Maps 的搜索习惯。
 */
const categoryPostcodeCache = {};

/**
 * 返回某资格类别下的全部邮编（字符串数组，4 位补零）。
 * 第一次扫描略慢（一次性遍历 ~10k 个邮编），之后命中缓存。
 */
export function getPostcodesByCategoryId(categoryId) {
  if (categoryPostcodeCache[categoryId]) {
    return categoryPostcodeCache[categoryId];
  }

  const result = [];
  for (let postcode = 200; postcode <= 9999; postcode++) {
    const matched = getMatchedEligibility(postcode);
    if (matched.some((item) => item.id === categoryId)) {
      result.push(String(postcode).padStart(4, "0"));
    }
  }
  categoryPostcodeCache[categoryId] = result;
  return result;
}

/**
 * 批量标注主入口。
 * 流程：
 *   1) 防重入：如果已在跑，直接提示用户。
 *   2) 校验输入和当前 tab 必须是 Google Maps。
 *   3) 解析邮编列表，进入循环逐个调 markSinglePostcode（通过 executeScript 注入）。
 *   4) 每一步累加 success/skipped/failed 计数。
 *   5) 结尾汇总状态文案 + 进度条 + 自动隐藏。
 *
 * 任何异常都会被捕获并显示在 #status 上。
 */
export async function runMarking(postcodeInput) {
  const status = document.getElementById("status");

  if (isMarking()) {
    status.textContent = langPack.runningLockStatus;
    status.className = "status processing";
    status.style.display = "block";
    return;
  }

  if (!postcodeInput) {
    status.textContent = langPack.inputPlaceholder;
    status.className = "status error";
    status.style.display = "block";
    return;
  }

  try {
    setMarking(true);
    setPaused(false);
    clearProgressResetTimer();
    setButtonsRunningState(true);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab.url || "";

    if (!/https:\/\/www\.google\.[^/]+\/maps/.test(url)) {
      clearProgressResetTimer();
      setProgress(0);
      const wrap = document.getElementById("progressWrap");
      if (wrap) wrap.style.display = "none";
      status.textContent = langPack.useOnMapsError;
      status.className = "status error";
      status.style.display = "block";
      return;
    }

    status.textContent = langPack.processingStatus;
    status.className = "status processing";
    status.style.display = "block";

    const customListName =
      normalizeListName(document.getElementById("customListName").value) ||
      langPack.defaultListName;

    // 把 langPack 里 content script 需要的几个文案打包传过去
    // （注入脚本是另一个 JS realm，不能直接读 popup 这边的 langPack）
    const contentLang = {
      waitElementTimeout: langPack.waitElementTimeout,
      skipPostcode: langPack.skipPostcode,
      postcodeAlreadySaved: langPack.postcodeAlreadySaved,
      postcodeMarked: langPack.postcodeMarked,
      postcodeMarkFailed: langPack.postcodeMarkFailed,
      postcodePlaceholder: langPack.postcodePlaceholder,
    };

    const postcodes = parsePostcodesInput(postcodeInput);
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const total = postcodes.length;
    if (total === 0) {
      status.textContent = langPack.batchNoValid;
      status.className = "status error";
      status.style.display = "block";
      setProgress(0);
      const wrap = document.getElementById("progressWrap");
      if (wrap) wrap.style.display = "none";
      return;
    }

    startProgress(total);

    for (let i = 0; i < postcodes.length; i++) {
      await waitWhilePaused();
      const postcode = postcodes[i];
      const injections = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: markSinglePostcode,
        args: [postcode, contentLang, customListName],
      });
      const result = injections?.[0]?.result;
      if (result?.status === "marked") successCount += 1;
      else if (result?.status === "skipped") skippedCount += 1;
      else failedCount += 1;
      const progress = ((i + 1) / total) * 100;
      setProgress(progress);
    }

    finishProgress();

    status.textContent = langPack.completeWithStats
      .replace("%s", String(successCount))
      .replace("%s", String(skippedCount))
      .replace("%s", String(failedCount));
    status.className = "status complete";
    status.style.display = "block";

    setTimeout(() => {
      status.textContent = "";
      status.className = "status";
      status.style.display = "none";
    }, 3000);
    resetProgressLater();
  } catch (error) {
    clearProgressResetTimer();
    console.error(langPack.markFailed, error);
    status.textContent = langPack.errorPrefix + error.message;
    status.className = "status error";
    status.style.display = "block";
    setProgress(0);
  } finally {
    setMarking(false);
    setPaused(false);
    setButtonsRunningState(false);
  }
}

/**
 * 读取用户自定义的列表名。
 * 优先用 chrome.storage.local，失败时降级到 localStorage；最终都没有就用 i18n 默认值。
 */
export async function getCustomListName() {
  try {
    const result = (await chrome.storage?.local?.get("customListName")) || {};
    return normalizeListName(result.customListName) || langPack.defaultListName;
  } catch (error) {
    const local = localStorage.getItem("customListName");
    return normalizeListName(local) || langPack.defaultListName;
  }
}

/** 写回用户自定义的列表名，对应 getCustomListName 的反向操作。 */
export async function saveCustomListName(name) {
  const normalized = normalizeListName(name);
  try {
    await chrome.storage?.local?.set({ customListName: normalized });
  } catch (error) {
    localStorage.setItem("customListName", normalized);
  }
}
