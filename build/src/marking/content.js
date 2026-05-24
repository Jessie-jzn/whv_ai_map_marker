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
  // 一个简单的"等待 DOM 元素出现"实现，避免 Maps 渲染慢时直接 querySelector 拿到 null
  function waitFor(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeout)
          return reject(
            new Error(lang.waitElementTimeout.replace("%s", selector))
          );
        setTimeout(check, 100);
      })();
    });
  }

  try {
    // 1) 把"Postcode: xxxx, Australia"塞进搜索框
    const inputBox = await waitFor('input[name="q"]');
    inputBox.value = lang.postcodePlaceholder.replace("%s", postcode);
    inputBox.dispatchEvent(new Event("input", { bubbles: true }));

    // 2) 触发搜索按钮
    const searchBtn = await waitFor(
      'button[aria-label="搜索"], button[aria-label="Search"]'
    );
    searchBtn.click();

    // 等地点详情面板渲染出来
    await new Promise((r) => setTimeout(r, 2000));

    // 3) 找"保存"按钮（中/英两种界面）
    const saveBtn = document.querySelector(
      'button[aria-label="保存"], button[aria-label="Save"], button[aria-label="已保存"], button[aria-label="Saved"]'
    );
    if (!saveBtn) {
      console.log(lang.skipPostcode.replace("%s", postcode));
      return { status: "failed", reason: "save_btn_not_found" };
    }

    // 如果按钮当前已经是"已保存/Saved"，说明这个点已经在某个列表里，跳过
    const saveBtnLabel = (
      saveBtn.getAttribute("aria-label") ||
      saveBtn.textContent ||
      ""
    ).toLowerCase();
    if (saveBtnLabel.includes("已保存") || saveBtnLabel.includes("saved")) {
      console.log(lang.postcodeAlreadySaved.replace("%s", postcode));
      return { status: "skipped", reason: "already_saved" };
    }

    // 4) 弹出"加入到列表"的菜单
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    await waitFor('div[role="menuitemradio"]', 7000).catch(() => null);
    const items = document.querySelectorAll('div[role="menuitemradio"]');

    // 5) 找到目标列表项并选中
    const normalizedTarget = (targetListName || "")
      .replace(/\s+/g, " ")
      .trim();
    let matchedTargetList = false;
    for (const item of items) {
      const label = (item.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (label === normalizedTarget || label.includes(normalizedTarget)) {
        // 如果该列表已经勾上了，说明这个邮编之前已加入，直接收尾
        if (item.getAttribute("aria-checked") === "true") {
          console.log(lang.postcodeAlreadySaved.replace("%s", postcode));
          const doneBtn = await waitFor(
            'button[aria-label="已保存"], button[aria-label="Saved"]'
          );
          doneBtn.click();
          return { status: "skipped", reason: "already_in_list" };
        }
        item.click();
        matchedTargetList = true;
        break;
      }
    }

    if (!matchedTargetList) {
      console.warn(`Target list not found: ${normalizedTarget}`);
      return { status: "failed", reason: "target_list_not_found" };
    }

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
