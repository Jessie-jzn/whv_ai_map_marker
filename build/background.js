// Manifest V3 service worker.
// 该文件只承担两件事:
// 1. 安装时把侧栏显式启用(manifest 已配 default_path,这一步是防御性补丁,
//    确保某些 Chrome 版本下侧栏入口可被发现)。
// 2. 当扩展未来若取消 default_popup,点击扩展图标也能直接开侧栏。

chrome.runtime.onInstalled.addListener(async () => {
  try {
    if (chrome.sidePanel?.setOptions) {
      await chrome.sidePanel.setOptions({
        path: "popup.html?ctx=side",
        enabled: true,
      });
    }
  } catch (e) {
    console.warn("sidePanel.setOptions failed:", e);
  }
});

chrome.action?.onClicked?.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    if (chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (e) {
    console.warn("sidePanel.open failed:", e);
  }
});
