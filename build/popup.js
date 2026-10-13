// 扩展弹窗（popup）入口
// ----------------------------------------------------------------------------
// 这个文件只做"装配"：
//   - 用 ES module 形态被 popup.html 通过 <script type="module"> 引入；
//   - 启动时调用 src/ui/init.js 完成所有初始化与事件绑定。
//
// 业务逻辑全在 src/ 下，按"职责"分目录组织：
//   src/config.js              常量
//   src/i18n.js                语言包 + locale 切换
//   src/data/whvTowns.js       城镇知识库 + 州邻接
//   src/advisor/recommend.js   本地推荐引擎
//   src/advisor/llm.js         OpenAI / Anthropic BYOK
//   src/eligibility/postcodes  邮编输入解析
//   src/eligibility/rules      WHV 邮编资格规则数据
//   src/marking/state          标注流程的全局状态
//   src/marking/progress       进度条 & 暂停 UI
//   src/marking/content        注入到 Google Maps 页面的脚本
//   src/marking/runner         批量标注主流程
//   src/ui/init                DOM 绑定与渲染（这里调用的总入口）
// ----------------------------------------------------------------------------

import { initPopup } from "./src/ui/init.js";

// ES module 是默认 deferred，会在文档解析完成后才执行；但为了保险起见，
// 兼容 document 已经 ready 的情况——直接调一次 initPopup 即可。
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPopup);
} else {
  initPopup();
}
