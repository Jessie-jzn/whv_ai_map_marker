// 国际化（i18n）模块
// ----------------------------------------------------------------------------
// 1. 维护一份完整的 zh / en 词条对照表（界面所有可见字符串都来自这里）。
// 2. 暴露 langPack（当前生效的语言包对象）和切换工具，给 UI 层使用。
// 3. UI 偏好持久化：优先存到 chrome.storage.local，回退到 localStorage。
//
// 重要：langPack 用「内部状态 + 同步函数」而非「在 import 时直接选定」，
// 因为切换语言时其它模块需要拿到最新的 langPack。所以这里改用一个
// getter 包装（getLangPack()）以及一个 currentLangPack 变量给老调用方使用。

const i18n = {
  zh: {
    title: "WHV集签地图助手",
    subtitle: "更快规划，更聪明地标注。",
    langLabel: "界面语言：",
    langOptionAuto: "跟随浏览器",
    langOptionZh: "简体中文",
    langOptionEn: "English",
    sectionListTitle: "1. 列表设置",
    sectionAiAdvisorTitle: "2. AI WHV 建议",
    sectionQuickTitle: "3. 一键按类别标注",
    sectionManualTitle: "4. 手动输入邮编并标注",
    sectionEligibilityTitle: "5. 单个邮编资格校验",
    copyIconTitle: "点击复制列表名",
    label: '请输入澳大利亚邮编（支持顿号、逗号及范围，例如"2832至2836"）：',
    button: "📍 标注到地图",
    hintHtml: `
    ⚠️ 请确保已在 Google 地图中创建上方指定名称的列表。
    <p>📌 使用前请在 <strong>Google 地图</strong> 中手动创建一个保存列表（如"🦘澳洲WHV集签列表"）</p>
    <p>① 打开 Google 地图 → 菜单 → 已保存 → 列表 → 新建列表</p>
    <p>② 创建完成后，请将该列表名称填写在上方输入框中</p>
    <p>③ 然后输入要标记的澳洲邮编，点击下方按钮即可批量加入地图标记</p>
  `,
    placeholder: "例如：2356、2386、2396、2832至2836、2899",
    inputPlaceholder: "请输入邮编",
    customListLabel: "自定义列表名称：",
    defaultListName: "🦘澳洲WHV农场/肉场/建筑类集签列表",
    processingStatus: "正在处理...",
    completeStatus: "处理完成",
    useOnMapsError: "请在谷歌地图页面使用此扩展",
    noListsFound: "没有找到可用的列表",
    loadFailed: "加载用户列表失败:",
    initFailed: "初始化失败:",
    markFailed: "标注失败:",
    errorPrefix: "发生错误：",
    waitElementTimeout: "等待元素 %s 超时",
    skipPostcode: "未找到保存按钮，跳过邮编 %s",
    postcodeAlreadySaved: "邮编 %s 已经保存，跳过",
    postcodeMarked: "已标注邮编: %s",
    postcodeMarkFailed: "标注邮编 %s 失败:",
    postcodePlaceholder: "邮政编码: %s, Australia",
    copyIcon: "📋",
    copied: "已复制",
    eligibilityTitle: "邮编资格即时校验",
    eligibilityLabel: "输入单个邮编：",
    eligibilityPlaceholder: "例如：2832",
    eligibilityInvalid: "请输入 4 位澳洲邮编（例如 0872、2832）。",
    eligibilityNoMatch: "当前内置规则未命中该邮编。",
    eligibilityMatchedPrefix: "命中类别：",
    eligibilityFrom: "可计入起始：",
    eligibilityRuleRemote: "偏远/极偏远地区（Remote / Very Remote）",
    eligibilityRuleNorthern: "北澳地区（Northern Australia）",
    eligibilityRuleRegional: "澳洲偏远地区（Regional Australia）",
    eligibilityRuleBushfire: "山火声明地区（Bushfire declared areas）",
    eligibilityRuleNatural: "自然灾害声明地区（Natural disaster declared areas）",
    eligibilityFromRemote: "2021-06-22（旅游/酒店方向）",
    eligibilityFromNorthern: "当前政策期（需同时满足行业要求）",
    eligibilityFromRegional: "当前政策期（需同时满足行业要求）",
    eligibilityFromBushfire: "2019-07-31 之后（可含志愿）",
    eligibilityFromNatural: "2021-12-31 之后（申请通常需满足 2025-04-05 新规）",
    eligibilityNote:
      "提示：此功能用于快速预判资格，递签前请以 Home Affairs 最新官方清单为准。",
    batchSummaryTitle: "批量校验结果：",
    batchSummaryStats: "总邮编 %s 个；命中至少一类 %s 个；未命中 %s 个。",
    batchNoInput: "输入邮编后，会在这里显示批量资格摘要。",
    batchNoValid: "未识别到有效邮编，请检查输入格式。",
    batchUnmatchedLabel: "未命中：",
    batchHitLabel: "命中：",
    quickActionTitle: "按类别一键标注",
    quickActionButton: "⚡ 一键填充并标注",
    quickActionTooMany: "该类别共有 %s 个邮编，预计执行较久，是否继续？",
    quickActionNoData: "当前类别没有可用邮编。",
    pauseButton: "⏸ 暂停",
    resumeButton: "▶ 继续",
    pausedStatus: "已暂停，点击继续后恢复标注",
    runningLockStatus: "正在标注中，请勿重复点击",
    completeWithStats: "处理完成：成功 %s，已跳过 %s，失败 %s",
    categoryGuidePrefix: "该类别可计入的常见工作：",
    categoryGuideDefault: "请选择类别查看可计入行业与说明。",
    categoryGuideRemote:
      "• 旅游/酒店业（Tourism & Hospitality）\n  如：酒店前台、客房、餐厅、导游、旅游巴士司机等\n• 适用区域：Remote / Very Remote 指定邮编\n• 关键条件：旅游酒店方向一般按 2021-06-22 起的规则判断",
    categoryGuideNorthern:
      "• 旅游/酒店业\n• Plant & Animal（农牧种植/养殖相关）\n• Fishing & Pearling（渔业/珍珠）\n• Tree farming & felling（林业砍伐）\n• Construction（建筑）\n• 关键条件：必须是北澳指定邮编，且岗位本身属于可计入行业",
    categoryGuideRegional:
      "• Plant & Animal（农牧种植/养殖相关）\n• Construction（建筑）\n• 关键条件：需在 Regional 指定邮编，且工作内容符合行业定义",
    categoryGuideBushfire:
      "• 山火恢复相关工作（可带薪或志愿）\n  如：清理、围栏重建、动物救助、道路/桥梁/房屋修复等\n• 关键时间：2019-07-31 之后",
    categoryGuideNatural:
      "• 自然灾害恢复工作（可带薪或志愿）\n  如：灾后清理、拆除、修复、运输支持、协调支持、受灾动物照料等\n• 关键时间：2021-12-31 之后（申请通常按 2025-04-05 新规）",
    aiAdvisorIntro:
      "告诉我你的情况，本地知识库会帮你按需要排个序——不上传任何资料，不调用外部 AI。",
    aiLocationLabel: "当前位置（城市或邮编）：",
    aiLocationPlaceholder: "例如：Brisbane / 4000",
    aiGoalLabel: "主要目标：",
    aiGoalSecond: "集二签",
    aiGoalThird: "集三签",
    aiGoalWork: "找工作（不限集签）",
    aiGoalTravel: "边走边玩",
    aiIndustryLabel: "偏好行业：",
    aiIndustryAny: "任意",
    aiIndustryHospitality: "餐饮 / 酒店",
    aiIndustryFarm: "农场 / 采摘",
    aiIndustryConstruction: "建筑",
    aiIndustryFishing: "渔业",
    aiIndustryTourism: "旅游",
    aiIndustryMining: "矿业",
    aiCanDriveLabel: "我会开车（可以去交通不便的地方）",
    aiNotesLabel: "其他需求（可选）：",
    aiNotesPlaceholder:
      "例如：想去暖和的地方；预算紧；喜欢海边；想接触华人社区；偏向 hospitality 不想下田……",
    aiAskButton: "🤖 Ask AI",
    aiAskAgainButton: "🤖 重新生成",
    aiEmptyState: "填好上面任意一项后，点 Ask AI 就能拿到推荐。",
    aiNoResult:
      "在内置知识库里没找到强匹配。可以放宽行业、勾上「会开车」，或在备注里多说两句。",
    aiSummaryNoCar:
      "你在 %loc%，不打算开车，目标是%goal%。下面这几个地方公共交通更友好，更适合先看：",
    aiSummaryWithCar:
      "你在 %loc%，可以开车，目标是%goal%。下面这几个更灵活的地点值得放进列表：",
    aiSummaryAnonymous: "基于你填写的需求，下面这几个城镇更值得优先看：",
    aiLocFallback: "澳洲",
    aiGoalSummarySecond: "集二签",
    aiGoalSummaryThird: "集三签",
    aiGoalSummaryWork: "稳定找工",
    aiGoalSummaryTravel: "边走边玩",
    aiFillButton: "⚡ 填入手动输入",
    aiAppendButton: "+ 追加到手动输入",
    aiFillAllButton: "📥 一次性把全部推荐写入手动输入",
    aiFillAllSummary: "%n% 个城镇 · %c% 个邮编",
    aiRecPostcodes: "建议邮编：",
    aiDisclaimer:
      "提示：AI 回答可能不准确或过时，仅供参考。签证、集签资格、政策解读等请务必自行查阅 Home Affairs 等官方网站二次核实后再做决定；勿仅依赖本工具递签。",
    aiRankPrefix: "#",
    openInSidePanel: "↗ 在侧边栏打开（更宽，可常驻屏幕侧）",
    sidePanelOpenFailed: "侧边栏打开失败，可右键扩展图标 → 在侧边栏打开。",
    aiSettingsSummary: "⚙️ 在线 AI 设置（可选）",
    aiSettingsDesc:
      "默认走本地知识库。推荐选「智能云路由」：Worker 自动在 Gemini → Groq → OpenRouter → SiliconFlow → Workers AI 间切换，无需 Key。DeepSeek 适合中文推理（须自填 key）。Gemini/OpenRouter 选项保留 BYOK 或兼容旧设置。",
    aiProviderLabel: "AI 提供方：",
    aiProviderLocal: "仅本地知识库（默认）",
    aiProviderCloud: "智能云路由（推荐 · 免费 · 自动切换）",
    aiProviderGemini: "Google Gemini（长文本 · 可走路由）",
    aiProviderDeepSeek: "DeepSeek（中文/推理 · 需自己的 key）",
    aiProviderOpenRouter: "OpenRouter（免费模型 · 备选）",
    aiProviderOpenAI: "OpenAI（需自己的 key）",
    aiProviderAnthropic: "Anthropic（需自己的 key）",
    aiApiKeyLabel: "API Key：",
    aiApiKeyPlaceholder:
      "Gemini/OpenRouter 留空走免费代理；DeepSeek/OpenAI/Anthropic 必填 key",
    aiApiKeyHint:
      "隐私说明：你的 Key 不会上传至扩展作者或 Worker 服务器；BYOK 时由浏览器直连对应 AI 厂商。若你保存设置，Key 仅存在本机 chrome.storage，可随时点「清除 Key」删除。选「智能云路由」时无需填写。",
    aiModelLabel: "模型名（可选）：",
    aiModelPlaceholder:
      "DeepSeek 默认 deepseek-chat；Gemini 默认 gemini-2.0-flash；OpenRouter 默认 openrouter/free",
    aiSaveSettings: "保存设置",
    aiClearKey: "清除 Key",
    aiSettingsSavedLocal: "已保存。当前使用本地知识库。",
    aiSettingsSavedCloud:
      "已保存。Ask AI 将走 Worker AI Router（Gemini→Groq→OpenRouter→SiliconFlow→Workers AI 自动切换）。",
    aiSettingsSavedGemini:
      "已保存。Ask AI 将用你的 AI Studio key 直连 Gemini %model%。",
    aiSettingsSavedGeminiProxy:
      "已保存。Ask AI 将通过代理走 Gemini %model%（免费 · 无需 key · 长 context）。",
    aiSettingsSavedGeminiBuiltin:
      "已保存。Ask AI 将用内置 key 走 Gemini %model%。",
    aiSettingsGeminiModelCleared:
      "已清除无效的 OpenRouter 模型名，将使用默认 gemini-2.0-flash。",
    aiSettingsSavedDeepSeek:
      "已保存。Ask AI 将用你的 DeepSeek key 直连 %model%。",
    aiSettingsDeepseekModelCleared:
      "已清除无效的 OpenRouter 模型名，将使用默认 deepseek-chat。",
    aiSettingsSavedOpenRouter:
      "已保存。Ask AI 将用你填的 key 直连 OpenRouter %model%。",
    aiSettingsSavedOpenRouterProxy:
      "已保存。Ask AI 将通过本扩展代理走 OpenRouter %model%（免费 · 无需 key）。",
    aiSettingsSavedOpenRouterBuiltin:
      "已保存。Ask AI 将用内置 key 走 OpenRouter %model%（无需 key）。",
    aiSettingsSavedOpenAI: "已保存。Ask AI 将调用 OpenAI %model%。",
    aiSettingsSavedAnthropic: "已保存。Ask AI 将调用 Anthropic %model%。",
    aiSettingsCleared: "Key 已清除，回到本地知识库模式。",
    aiSettingsKeyMissing: "请先填写 API Key，或把提供方切回「仅本地知识库」。",
    aiCacheStatsEmpty: "暂无缓存：相同的提问会复用上一次的回答。",
    aiCacheStats: "已缓存 %count% 条 · 最早 %oldest%",
    aiCacheJustNow: "刚刚",
    aiCacheMinutesAgo: "%n% 分钟前",
    aiCacheHoursAgo: "%n% 小时前",
    aiCacheDaysAgo: "%n% 天前",
    aiClearCache: "🧹 清除缓存",
    aiCacheCleared: "缓存已清空。",
    aiCacheTagHit: "📦 缓存 · %time%",
    aiLlmThinking: "正在请求在线模型…",
    aiLlmFailedFallback:
      "在线模型调用失败（%reason%），已自动用本地知识库给你出推荐。",
    aiLlmBadJson: "在线模型返回的不是预期格式，已回退到本地推荐。",
    aiSourceLlmCloud: "智能路由",
    aiSourceLlmGemini: "Gemini",
    aiSourceLlmDeepSeek: "DeepSeek",
    aiSourceLlmOpenAI: "OpenAI",
    aiSourceLlmAnthropic: "Anthropic",
    aiSourceLlmOpenRouter: "OpenRouter",
    aiSourceLocal: "本地",
    sponsorTitle: "更多攻略与支持",
    sponsorDesc:
      "本扩展免费使用。签证、找工、落地等干货在作者个人网站维护，无应用内广告与追踪。若对你有帮助，欢迎打开下方专题页浏览收藏。",
    sponsorButton: "打开 Jessie 的 WHV 专题页 →",
  },
  en: {
    title: "WHV Postcode Marker",
    subtitle: "Plan faster, mark smarter.",
    langLabel: "Interface language:",
    langOptionAuto: "Match browser",
    langOptionZh: "简体中文",
    langOptionEn: "English",
    sectionListTitle: "1. Saved list setup",
    sectionAiAdvisorTitle: "2. AI WHV advisor",
    sectionQuickTitle: "3. One-click mark by category",
    sectionManualTitle: "4. Enter postcodes and mark",
    sectionEligibilityTitle: "5. Single-postcode eligibility",
    copyIconTitle: "Click to copy list name",
    label:
      'Enter Australian postcodes (supports comma, Chinese list comma and range, e.g. "2832 to 2836"):',
    button: "📍 Mark on Map",
    hintHtml: `
    ⚠️ Please make sure you have created a Google Maps list with the name specified above.
    <p>📌 Before using, please manually create a list in <strong>Google Maps</strong> (e.g., "🦘WHV Jobs List").</p>
    <p>① Open Google Maps → Menu → Saved → Lists → New List</p>
    <p>② After creating it, enter the list name into the input box above.</p>
    <p>③ Then input the Australian postcodes and click the button below to mark them in bulk.</p>
  `,
    placeholder: "e.g. 2356, 2386, 2396, 2832 to 2836, 2899",
    inputPlaceholder: "Please enter postcodes",
    customListLabel: "Custom List Name:",
    defaultListName: "🦘澳洲WHV农场/肉场/建筑类集签列表",
    processingStatus: "Processing...",
    completeStatus: "Completed",
    useOnMapsError: "Please use this extension on a Google Maps page",
    noListsFound: "No available lists found",
    loadFailed: "Failed to load user lists:",
    initFailed: "Initialization failed:",
    markFailed: "Marking failed:",
    errorPrefix: "Error occurred: ",
    waitElementTimeout: "Waiting for element %s timed out",
    skipPostcode: "Save button not found, skipping postcode %s",
    postcodeAlreadySaved: "Postcode %s already saved, skipping",
    postcodeMarked: "Marked postcode: %s",
    postcodeMarkFailed: "Failed to mark postcode %s:",
    postcodePlaceholder: "Postcode: %s, Australia",
    copied: "Copied",
    copyIcon: "📋",
    eligibilityTitle: "Instant postcode eligibility check",
    eligibilityLabel: "Enter one postcode:",
    eligibilityPlaceholder: "e.g. 2832",
    eligibilityInvalid: "Please enter a valid 4-digit Australian postcode (e.g. 0872, 2832).",
    eligibilityNoMatch: "No match found in the built-in rule set.",
    eligibilityMatchedPrefix: "Matched categories:",
    eligibilityFrom: "Countable from:",
    eligibilityRuleRemote: "Remote / Very Remote",
    eligibilityRuleNorthern: "Northern Australia",
    eligibilityRuleRegional: "Regional Australia",
    eligibilityRuleBushfire: "Bushfire declared areas",
    eligibilityRuleNatural: "Natural disaster declared areas",
    eligibilityFromRemote: "2021-06-22 (tourism & hospitality stream)",
    eligibilityFromNorthern: "Current policy period (industry requirement still applies)",
    eligibilityFromRegional: "Current policy period (industry requirement still applies)",
    eligibilityFromBushfire: "After 2019-07-31 (volunteer work may count)",
    eligibilityFromNatural:
      "After 2021-12-31 (applications generally follow 2025-04-05 settings)",
    eligibilityNote:
      "Note: This checker is for fast pre-screening. Always verify against the latest Home Affairs list before lodging.",
    batchSummaryTitle: "Batch eligibility summary:",
    batchSummaryStats:
      "Total %s postcodes; %s matched at least one category; %s unmatched.",
    batchNoInput: "Batch eligibility summary will appear here after you enter postcodes.",
    batchNoValid: "No valid postcode detected. Please check the input format.",
    batchUnmatchedLabel: "Unmatched:",
    batchHitLabel: "Matched:",
    quickActionTitle: "One-click mark by category",
    quickActionButton: "⚡ Fill & Mark",
    quickActionTooMany:
      "This category has %s postcodes and may take a while. Continue?",
    quickActionNoData: "No postcodes available for this category.",
    pauseButton: "⏸ Pause",
    resumeButton: "▶ Resume",
    pausedStatus: "Paused. Click Resume to continue.",
    runningLockStatus: "Marking in progress. Please avoid repeated clicks.",
    completeWithStats: "Done: success %s, skipped %s, failed %s",
    categoryGuidePrefix: "Common countable work in this category:",
    categoryGuideDefault: "Select a category to view eligible work guidance.",
    categoryGuideRemote:
      "• Tourism & hospitality\n  e.g. hotel guest service, housekeeping, restaurant work, tour guide, tour bus driver\n• Area requirement: specified postcodes in Remote / Very Remote Australia\n• Time note: tourism/hospitality stream is generally assessed under rules from 2021-06-22",
    categoryGuideNorthern:
      "• Tourism & hospitality\n• Plant & animal cultivation\n• Fishing & pearling\n• Tree farming & felling\n• Construction\n• Key requirement: work must be in eligible Northern Australia postcodes and fit an approved industry",
    categoryGuideRegional:
      "• Plant & animal cultivation\n• Construction\n• Key requirement: work must be in eligible Regional Australia postcodes and fit approved definitions",
    categoryGuideBushfire:
      "• Bushfire recovery work (paid or volunteer)\n  e.g. cleanup, fencing rebuild, wildlife care, road/bridge/building repair\n• Time requirement: after 2019-07-31",
    categoryGuideNatural:
      "• Natural disaster recovery work (paid or volunteer)\n  e.g. cleanup, demolition, repairs, transport support, coordination support, animal care\n• Time requirement: after 2021-12-31 (applications generally follow 2025-04-05 settings)",
    aiAdvisorIntro:
      "Tell me your situation. A local curated knowledge base ranks options for you — no uploads, no external AI calls.",
    aiLocationLabel: "Current location (city or postcode):",
    aiLocationPlaceholder: "e.g. Brisbane / 4000",
    aiGoalLabel: "Main goal:",
    aiGoalSecond: "Second-stamp eligibility",
    aiGoalThird: "Third-stamp eligibility",
    aiGoalWork: "Find work (any visa stage)",
    aiGoalTravel: "Travel-first",
    aiIndustryLabel: "Industry preference:",
    aiIndustryAny: "Any",
    aiIndustryHospitality: "Hospitality / hotel",
    aiIndustryFarm: "Farm / picking",
    aiIndustryConstruction: "Construction",
    aiIndustryFishing: "Fishing",
    aiIndustryTourism: "Tourism",
    aiIndustryMining: "Mining",
    aiCanDriveLabel: "I can drive (open to less transit-friendly spots)",
    aiNotesLabel: "Other needs (optional):",
    aiNotesPlaceholder:
      "e.g. somewhere warm; tight budget; love the beach; prefer hospitality over farm work…",
    aiAskButton: "🤖 Ask AI",
    aiAskAgainButton: "🤖 Re-generate",
    aiEmptyState: "Fill in anything above and tap Ask AI to get tailored suggestions.",
    aiNoResult:
      "No strong matches in the local knowledge base. Try relaxing your industry, ticking \"I can drive\", or adding a few words in the notes.",
    aiSummaryNoCar:
      "You're in %loc%, planning to skip driving, targeting %goal%. These transit-friendly spots are worth looking at first:",
    aiSummaryWithCar:
      "You're in %loc%, with a car, targeting %goal%. These more flexible spots are worth adding to your list:",
    aiSummaryAnonymous: "Based on your inputs, these towns are worth looking at first:",
    aiLocFallback: "Australia",
    aiGoalSummarySecond: "the second stamp",
    aiGoalSummaryThird: "the third stamp",
    aiGoalSummaryWork: "stable work",
    aiGoalSummaryTravel: "a travel-leaning route",
    aiFillButton: "⚡ Fill into manual input",
    aiAppendButton: "+ Append to manual input",
    aiFillAllButton: "📥 Send every suggestion to manual input",
    aiFillAllSummary: "%n% towns · %c% postcodes",
    aiRecPostcodes: "Suggested postcodes:",
    aiDisclaimer:
      "Note: AI answers may be wrong or outdated — for reference only. For visas, eligibility, and policy, always double-check the official Home Affairs site yourself before you act; do not rely on this tool alone when lodging.",
    aiRankPrefix: "#",
    openInSidePanel: "↗ Open in side panel (wider, sticks to your screen)",
    sidePanelOpenFailed: "Could not open side panel. Right-click the extension icon → Open in side panel.",
    aiSettingsSummary: "⚙️ Online AI settings (optional)",
    aiSettingsDesc:
      "Default is the local knowledge base. Recommended: Smart cloud router — Worker auto-failover across Gemini → Groq → OpenRouter → SiliconFlow → Workers AI, no key needed. DeepSeek is BYOK for Chinese reasoning. Gemini/OpenRouter remain for direct BYOK.",
    aiProviderLabel: "AI provider:",
    aiProviderLocal: "Local knowledge base only (default)",
    aiProviderCloud: "Smart cloud router (recommended · free · auto-failover)",
    aiProviderGemini: "Google Gemini (long context · via router if no key)",
    aiProviderDeepSeek: "DeepSeek (Chinese/reasoning · your own key)",
    aiProviderOpenRouter: "OpenRouter (free models · fallback)",
    aiProviderOpenAI: "OpenAI (your own key)",
    aiProviderAnthropic: "Anthropic (your own key)",
    aiApiKeyLabel: "API key:",
    aiApiKeyPlaceholder:
      "Gemini/OpenRouter: blank = free proxy; DeepSeek/OpenAI/Anthropic: key required",
    aiApiKeyHint:
      "Privacy: your key is never sent to us or stored on our Worker. BYOK calls go straight from your browser to the AI provider. If you save settings, the key stays only in this browser (chrome.storage) until you tap Clear key. Smart cloud router needs no key.",
    aiModelLabel: "Model name (optional):",
    aiModelPlaceholder:
      "DeepSeek default deepseek-chat; Gemini default gemini-2.0-flash; OpenRouter default openrouter/free",
    aiSaveSettings: "Save settings",
    aiClearKey: "Clear key",
    aiSettingsSavedLocal: "Saved. Using the local knowledge base.",
    aiSettingsSavedCloud:
      "Saved. Ask AI will use the Worker AI router (Gemini→Groq→OpenRouter→SiliconFlow→Workers AI).",
    aiSettingsSavedGemini:
      "Saved. Ask AI will call Gemini %model% with your AI Studio key.",
    aiSettingsSavedGeminiProxy:
      "Saved. Ask AI will use Gemini %model% via the proxy (free · no key · long context).",
    aiSettingsSavedGeminiBuiltin:
      "Saved. Ask AI will use the built-in key for Gemini %model%.",
    aiSettingsGeminiModelCleared:
      "Invalid OpenRouter-style model name cleared; using default gemini-2.0-flash.",
    aiSettingsSavedDeepSeek:
      "Saved. Ask AI will call DeepSeek %model% with your key.",
    aiSettingsDeepseekModelCleared:
      "Invalid OpenRouter-style model name cleared; using default deepseek-chat.",
    aiSettingsSavedOpenRouter:
      "Saved. Ask AI will hit OpenRouter %model% directly with your key.",
    aiSettingsSavedOpenRouterProxy:
      "Saved. Ask AI will go through the extension's proxy to OpenRouter %model% (free · no key required).",
    aiSettingsSavedOpenRouterBuiltin:
      "Saved. Ask AI will use the built-in key to call OpenRouter %model% — no key required.",
    aiSettingsSavedOpenAI: "Saved. Ask AI will call OpenAI %model%.",
    aiSettingsSavedAnthropic: "Saved. Ask AI will call Anthropic %model%.",
    aiSettingsCleared: "Key cleared. Back to the local knowledge base.",
    aiSettingsKeyMissing: "Please add an API key, or switch the provider back to local.",
    aiCacheStatsEmpty: "No cached answers yet. Repeated questions will reuse the previous response.",
    aiCacheStats: "%count% cached · oldest %oldest%",
    aiCacheJustNow: "just now",
    aiCacheMinutesAgo: "%n% min ago",
    aiCacheHoursAgo: "%n% h ago",
    aiCacheDaysAgo: "%n% d ago",
    aiClearCache: "🧹 Clear cache",
    aiCacheCleared: "Cache cleared.",
    aiCacheTagHit: "📦 Cached · %time%",
    aiLlmThinking: "Calling the online model…",
    aiLlmFailedFallback:
      "Online model call failed (%reason%). Falling back to the local engine.",
    aiLlmBadJson: "The online model didn't return the expected JSON. Falling back to local.",
    aiSourceLlmCloud: "Cloud router",
    aiSourceLlmGemini: "Gemini",
    aiSourceLlmDeepSeek: "DeepSeek",
    aiSourceLlmOpenAI: "OpenAI",
    aiSourceLlmAnthropic: "Anthropic",
    aiSourceLlmOpenRouter: "OpenRouter",
    aiSourceLocal: "Local",
    sponsorTitle: "Guides & support",
    sponsorDesc:
      "This extension is free. Long-form guides live on the author’s website—easier to maintain and no in-extension ads or tracking. If it helps you, open the WHV hub below.",
    sponsorButton: "Open WHV hub →",
  },
};

// ----------------------------------------------------------------------------
// 当前语言状态
// ----------------------------------------------------------------------------
// uiLocalePref : 用户偏好（"auto" | "zh" | "en"），auto 时跟随浏览器
// langPack     : 当前生效的语言包对象。注意它是一个"稳定容器"——syncLangPack()
//                只会在原地清空再 assign 新词条，所以其它模块可以 import 一次
//                之后一直用 langPack.xxx 读最新文案。
// ----------------------------------------------------------------------------

let uiLocalePref = "auto";

/** 稳定对象引用，切换语言时只改它的属性、不替换引用。 */
export const langPack = {};

/** 浏览器语言是否以 zh 开头（用于 auto 模式判断默认语言）。 */
function browserLocaleIsZh() {
  return (navigator.language || navigator.userLanguage || "")
    .toLowerCase()
    .startsWith("zh");
}

/** 在当前 uiLocalePref 下计算应当生效的 locale 字符串（"zh" 或 "en"）。 */
export function resolvedUiLocale() {
  if (uiLocalePref === "zh" || uiLocalePref === "en") return uiLocalePref;
  return browserLocaleIsZh() ? "zh" : "en";
}

/** 把 langPack 重新填充为当前 locale 对应的词条（原地清空 + Object.assign）。 */
export function syncLangPack() {
  const next = resolvedUiLocale() === "zh" ? i18n.zh : i18n.en;
  for (const k of Object.keys(langPack)) delete langPack[k];
  Object.assign(langPack, next);
}

/** 直接读取当前偏好（"auto"|"zh"|"en"），UI 用于设置下拉菜单的选中项。 */
export function getUiLocalePref() {
  return uiLocalePref;
}

/**
 * 从存储里恢复 locale 偏好。
 * 优先用 chrome.storage.local，失败回退到 localStorage（开发态浏览器外预览也能跑）。
 */
export async function loadUiLocalePref() {
  try {
    const r = await chrome.storage.local.get("uiLocale");
    if (r.uiLocale === "zh" || r.uiLocale === "en" || r.uiLocale === "auto") {
      uiLocalePref = r.uiLocale;
    }
  } catch {
    const v = localStorage.getItem("uiLocale");
    if (v === "zh" || v === "en" || v === "auto") uiLocalePref = v;
  }
  syncLangPack();
}

/** 保存新的 locale 偏好（"auto"|"zh"|"en"），并立刻刷新 langPack。 */
export async function saveUiLocalePref(v) {
  uiLocalePref = v;
  syncLangPack();
  try {
    await chrome.storage.local.set({ uiLocale: v });
  } catch {
    localStorage.setItem("uiLocale", v);
  }
}

// 初始化时先调一次 sync，保证模块加载后立刻可读
syncLangPack();
