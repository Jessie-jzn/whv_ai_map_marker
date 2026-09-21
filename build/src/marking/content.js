// Google Maps 页面注入脚本
// ----------------------------------------------------------------------------
// 这些函数会被 chrome.scripting.executeScript({ func: ... }) 序列化到目标
// tab 的页面上下文里执行，所以：
//   * 不能引用本模块外的任何符号（包括 import 的东西）；
//   * 不能闭包带变量；
//   * 所有依赖必须通过参数传进来（比如多语言文案 lang、目标列表名）。
// 任何对这两个函数的修改，需要严格遵守上述自洽要求。
// ----------------------------------------------------------------------------

/**
 * 处理单个邮编的"搜索 → 打开保存菜单 → 选中目标列表 → 关闭菜单"流程。
 * @returns {Promise<{status: "marked"|"skipped"|"failed", reason?: string}>}
 *   marked  : 成功新增到目标列表
 *   skipped : 该邮编已经在目标列表里，或已是 saved 状态
 *   failed  : 任何流程异常（含找不到列表）
 *
 * 注意：因为 Google Maps 没有官方 API，本流程依赖具体的 DOM 选择器和
 * `aria-label`。Google 改版时这里可能要跟着改。
 */
export async function markSinglePostcode(postcode, lang, targetListName) {
  function waitUntil(predicate, timeout = 7000, interval = 100) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        let value;
        try {
          value = predicate();
        } catch (error) {
          reject(error);
          return;
        }
        if (value) return resolve(value);
        if (Date.now() - start >= timeout) {
          return reject(new Error("wait_timeout"));
        }
        setTimeout(check, interval);
      })();
    });
  }

  function waitFor(selector, timeout = 5000) {
    return waitUntil(() => document.querySelector(selector), timeout).catch(
      (error) => {
        if (error?.message !== "wait_timeout") throw error;
        throw new Error(lang.waitElementTimeout.replace("%s", selector));
      }
    );
  }

  try {
    // 1) 把"Postcode: xxxx, Australia"塞进搜索框
    const inputBox = await waitFor('input[name="q"]');
    const searchQuery = lang.postcodePlaceholder.replace("%s", postcode);
    inputBox.value = searchQuery;
    inputBox.dispatchEvent(new Event("input", { bubbles: true }));

    // 2) 触发搜索按钮
    const searchBtn = await waitFor(
      'button[aria-label="搜索"], button[aria-label="Search"]'
    );
    searchBtn.click();

    // 3) 等待地点详情面板出现，不再为每个邮编固定等待两秒。
    const saveBtn = await waitFor(
      'button[aria-label="保存"], button[aria-label="Save"], button[aria-label="已保存"], button[aria-label="Saved"]',
      10000
    ).catch(() => null);
    if (!saveBtn) {
      console.log(lang.skipPostcode.replace("%s", postcode));
      return { status: "failed", reason: "save_btn_not_found" };
    }

    // 4) 即使地点已保存在其他列表，也要打开菜单检查本次指定的目标列表。
    saveBtn.click();
    const firstItem = await waitFor(
      'div[role="menuitemradio"]',
      7000
    ).catch(() => null);
    if (!firstItem) {
      return { status: "failed", reason: "list_menu_not_found" };
    }
    const items = document.querySelectorAll('div[role="menuitemradio"]');

    // 5) 精确找到目标列表项，避免 "WHV" 误命中 "WHV Archive"。
    const normalizedTarget = (targetListName || "")
      .replace(/\s+/g, " ")
      .trim();
    const targetItem = Array.from(items).find((item) => {
      const label = (item.textContent || "").replace(/\s+/g, " ").trim();
      return label === normalizedTarget;
    });

    if (!targetItem) {
      console.warn(`Target list not found: ${normalizedTarget}`);
      return { status: "failed", reason: "target_list_not_found" };
    }

    if (targetItem.getAttribute("aria-checked") === "true") {
      console.log(lang.postcodeAlreadySaved.replace("%s", postcode));
      const doneBtn = await waitFor(
        'button[aria-label="已保存"], button[aria-label="Saved"]'
      );
      doneBtn.click();
      return { status: "skipped", reason: "already_in_list" };
    }

    targetItem.click();
    await waitUntil(
      () => targetItem.getAttribute("aria-checked") === "true",
      5000
    );

    // 6) 关闭菜单（点击"已保存"按钮即可收起 popover）
    const doneBtn = await waitFor(
      'button[aria-label="已保存"], button[aria-label="Saved"]'
    );
    doneBtn.click();
    console.log(lang.postcodeMarked.replace("%s", postcode));
    return { status: "marked" };
  } catch (err) {
    console.warn(lang.postcodeMarkFailed.replace("%s", postcode), err);
    return { status: "failed", reason: err?.message || "unknown" };
  }
}

/**
 * 抓取当前 Google Maps 页面"已保存 → 列表"里的所有列表名。
 * 目前未被 UI 真正使用，但保留作为后续"自动发现列表"功能的入口。
 *
 * 同样的注入注意事项：必须是自洽函数，不能依赖外部变量。
 */
export function extractUserLists() {
  return new Promise((resolve) => {
    const savedButton = document.querySelector(
      'button[aria-label="已保存"], button[aria-label="Saved"]'
    );
    if (!savedButton) return resolve([]);

    savedButton.click();
    setTimeout(() => {
      const listElements = document.querySelectorAll('div[role="listitem"]');
      const lists = Array.from(listElements)
        .map((el) => {
          const title = el.querySelector('div[role="heading"]');
          return title ? { name: title.textContent.trim() } : null;
        })
        .filter(Boolean);

      resolve(lists);
    }, 2000);
  });
}
