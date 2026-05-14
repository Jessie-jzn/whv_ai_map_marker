// 语言包
const i18n = {
  zh: {
    title: "WHV集签地图助手",
    subtitle: "更快规划，更聪明地标注。",
    langLabel: "界面语言：",
    langOptionAuto: "跟随浏览器",
    langOptionZh: "简体中文",
    langOptionEn: "English",
    sectionListTitle: "1. 列表设置",
    sectionQuickTitle: "2. 一键按类别标注",
    sectionManualTitle: "3. 手动输入邮编并标注",
    sectionEligibilityTitle: "4. 单个邮编资格校验",
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
    sectionQuickTitle: "2. One-click mark by category",
    sectionManualTitle: "3. Enter postcodes and mark",
    sectionEligibilityTitle: "4. Single-postcode eligibility",
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
    sponsorTitle: "Guides & support",
    sponsorDesc:
      "This extension is free. Long-form guides live on the author’s website—easier to maintain and no in-extension ads or tracking. If it helps you, open the WHV hub below.",
    sponsorButton: "Open WHV hub →",
  },
};

let uiLocalePref = "auto";

function browserLocaleIsZh() {
  return (navigator.language || navigator.userLanguage || "")
    .toLowerCase()
    .startsWith("zh");
}

function resolvedUiLocale() {
  if (uiLocalePref === "zh" || uiLocalePref === "en") return uiLocalePref;
  return browserLocaleIsZh() ? "zh" : "en";
}

let langPack;

function syncLangPack() {
  langPack = resolvedUiLocale() === "zh" ? i18n.zh : i18n.en;
}

syncLangPack();

async function loadUiLocalePref() {
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

async function saveUiLocalePref(v) {
  uiLocalePref = v;
  syncLangPack();
  try {
    await chrome.storage.local.set({ uiLocale: v });
  } catch {
    localStorage.setItem("uiLocale", v);
  }
}

const SPONSOR_WHV_URL = "https://www.jessieontheroad.com/zh/whv/";

function normalizeListName(name = "") {
  return name.replace(/\s+/g, " ").trim();
}

function inRanges(postcode, ranges = []) {
  return ranges.some(([start, end]) => postcode >= start && postcode <= end);
}

function inList(postcode, list = []) {
  return list.includes(postcode);
}

function parsePostcodesInput(str) {
  const postcodes = [];
  const seen = new Set();
  const input = (str || "").replace(/[、，；;]/g, ",");

  function addPostcode(n) {
    if (!Number.isInteger(n) || n < 200 || n > 9999 || seen.has(n)) return;
    seen.add(n);
    postcodes.push(n);
  }

  input.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

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

    const singleMatch = trimmed.match(/^(\d{3,4})$/);
    if (singleMatch) addPostcode(parseInt(singleMatch[1], 10));
  });

  return postcodes;
}

function getMatchedEligibility(postcode) {
  const rules = [
    {
      id: "remote",
      label: langPack.eligibilityRuleRemote,
      from: langPack.eligibilityFromRemote,
      match: (p) =>
        inList(p, [4406, 4416, 4498, 7215, 2356, 2386, 2387, 2396, 2898, 2899]) ||
        inRanges(p, [
          [2832, 2836],
          [4477, 4482],
          [4486, 4494],
          [4854, 4856],
          [4868, 4888],
          [4890, 4892],
          [5220, 5223],
          [5602, 5607],
          [5722, 5725],
          [5730, 5734],
          [6335, 6338],
          [6418, 6429],
          [6445, 6448],
          [6466, 6468],
          [6475, 6477],
          [6487, 6490],
          [6517, 6519],
          [6612, 6614],
          [6630, 6632],
          [6638, 6640],
          [7255, 7257],
          [7466, 7470],
        ]),
    },
    {
      id: "northern",
      label: langPack.eligibilityRuleNorthern,
      from: langPack.eligibilityFromNorthern,
      match: (p) =>
        inRanges(p, [
          [800, 899],
          [4699, 4707],
          [4709, 4714],
          [4720, 4728],
          [4730, 4733],
          [4735, 4746],
          [4798, 4812],
          [4814, 4825],
          [4828, 4830],
          [4854, 4856],
          [4858, 4861],
          [4868, 4888],
          [4890, 4892],
          [6710, 6714],
          [6720, 6722],
        ]) ||
        inList(p, [
          872, 6537, 6642, 6646, 6701, 6705, 6707, 6716, 6718, 6725, 6726, 6728,
          6740, 6743, 6751, 6753, 6754, 6758, 6760, 6762, 6765, 6770, 4472, 4478,
          4481, 4482, 4680, 4694, 4695, 4697, 4717, 4750, 4751, 4753, 4754, 4756,
          4757, 4849, 4850, 4852, 4865, 4895,
        ]),
    },
    {
      id: "regional",
      label: langPack.eligibilityRuleRegional,
      from: langPack.eligibilityFromRegional,
      match: (p) =>
        inRanges(p, [
          [5000, 5799],
          [7000, 7999],
          [800, 899],
          [2311, 2312],
          [2328, 2411],
          [2420, 2490],
          [2536, 2551],
          [2575, 2594],
          [2618, 2739],
          [2787, 2898],
          [3211, 3334],
          [3340, 3424],
          [3430, 3649],
          [3658, 3749],
          [3810, 3909],
          [3921, 3925],
          [3945, 3974],
          [3981, 3996],
          [4307, 4499],
          [4522, 4899],
          [6200, 6799],
        ]) ||
        inList(p, [2899, 3139, 3753, 3756, 3758, 3762, 3764, 3778, 3781, 3783, 3797, 3799, 4124, 4125, 4133, 4211, 4275, 4280, 4285, 4287, 4510, 4512]),
    },
    {
      id: "bushfire",
      label: langPack.eligibilityRuleBushfire,
      from: langPack.eligibilityFromBushfire,
      match: (p) =>
        inRanges(p, [
          [2069, 2076],
          [2224, 2234],
          [2256, 2265],
          [2315, 2331],
          [2333, 2341],
          [2352, 2356],
          [2369, 2372],
          [2386, 2388],
          [2397, 2406],
          [2420, 2431],
          [2439, 2441],
          [2443, 2450],
          [2452, 2456],
          [2462, 2466],
          [2469, 2490],
          [2515, 2519],
          [2536, 2541],
          [2548, 2551],
          [2568, 2588],
          [2618, 2633],
          [2649, 2653],
          [2658, 2661],
          [2725, 2727],
          [2747, 2750],
          [2752, 2754],
          [2756, 2760],
          [2773, 2780],
          [2782, 2787],
          [2790, 2795],
          [2797, 2800],
          [2803, 2808],
          [2824, 2826],
          [2828, 2835],
          [2838, 2840],
          [2844, 2850],
          [2864, 2868],
        ]) ||
        inList(p, [2172, 2173, 2178, 2250, 2251, 2267, 2278, 2289, 2290, 2305, 2306, 2311, 2312, 2350, 2365, 2390, 2415, 2460, 2500, 2502, 2505, 2506, 2508, 2525, 2526, 2530, 2545, 2546, 2555, 2560, 2590, 2594, 2611, 2640, 2642, 2644, 2678, 2702, 2710, 2716, 2720, 2722, 2729, 2730, 2733, 2745, 2765, 2818, 2820, 2822, 2870, 2873, 2877]),
    },
    {
      id: "natural",
      label: langPack.eligibilityRuleNatural,
      from: langPack.eligibilityFromNatural,
      match: (p) =>
        inRanges(p, [
          [2018, 2022],
          [2038, 2042],
          [2048, 2050],
          [2069, 2077],
          [2079, 2087],
          [2092, 2097],
          [2099, 2108],
          [2112, 2122],
          [2125, 2128],
          [2130, 2133],
          [2141, 2148],
          [2150, 2168],
          [2170, 2179],
          [2190, 2200],
          [2203, 2214],
          [2216, 2234],
          [2256, 2263],
          [2315, 2331],
          [2333, 2347],
          [2352, 2361],
          [2369, 2372],
          [2379, 2382],
          [2386, 2388],
          [2395, 2406],
          [2408, 2411],
          [2420, 2431],
          [2439, 2441],
          [2443, 2450],
          [2452, 2456],
          [2462, 2466],
          [2469, 2490],
          [2515, 2530],
          [2533, 2541],
          [2548, 2551],
          [2555, 2560],
          [2563, 2588],
          [2618, 2633],
          [2640, 2653],
          [2658, 2661],
          [2700, 2703],
          [2705, 2707],
          [2710, 2717],
          [2720, 2722],
          [2725, 2727],
          [2729, 2739],
          [2747, 2750],
          [2752, 2754],
          [2756, 2763],
          [2765, 2770],
          [2773, 2780],
          [2782, 2787],
          [2790, 2795],
          [2797, 2800],
          [2803, 2810],
          [2820, 2836],
          [2838, 2840],
          [2842, 2850],
          [2864, 2871],
          [2873, 2880],
          [3002, 3004],
          [3039, 3041],
          [3051, 3054],
          [3065, 3067],
          [3101, 3104],
          [3121, 3133],
          [3135, 3141],
          [3145, 3156],
          [3158, 3163],
          [3165, 3175],
          [3177, 3180],
          [3194, 3202],
          [3211, 3227],
          [3264, 3272],
          [3280, 3283],
          [3292, 3294],
          [3300, 3305],
          [3321, 3325],
          [3328, 3334],
          [3335, 3338],
          [3340, 3342],
          [3350, 3352],
          [3355, 3358],
          [3360, 3364],
          [3373, 3375],
          [3377, 3381],
          [3440, 3442],
          [3446, 3448],
          [3460, 3465],
          [3467, 3469],
          [3505, 3507],
          [3515, 3518],
          [3520, 3523],
          [3529, 3531],
          [3549, 3551],
          [3555, 3559],
          [3561, 3568],
          [3570, 3573],
          [3579, 3581],
          [3583, 3586],
          [3588, 3591],
          [3594, 3597],
          [3616, 3618],
          [3620, 3624],
          [3629, 3631],
          [3633, 3641],
          [3658, 3660],
          [3662, 3666],
          [3697, 3701],
          [3707, 3709],
          [3711, 3715],
          [3717, 3720],
          [3725, 3728],
          [3737, 3741],
          [3756, 3767],
          [3777, 3779],
          [3781, 3783],
          [3785, 3789],
          [3791, 3793],
          [3795, 3797],
          [3802, 3810],
          [3812, 3816],
          [3820, 3825],
          [3831, 3833],
          [3850, 3852],
          [3856, 3860],
          [3869, 3871],
          [3873, 3875],
          [3885, 3893],
          [3902, 3904],
          [3909, 3913],
          [3918, 3920],
          [3925, 3931],
          [3936, 3946],
          [3956, 3960],
          [3964, 3967],
          [3975, 3981],
          [3990, 3992],
          [4005, 4014],
          [4017, 4022],
          [4030, 4032],
          [4034, 4037],
          [4053, 4055],
          [4059, 4061],
          [4064, 4070],
          [4073, 4078],
          [4101, 4125],
          [4127, 4133],
          [4151, 4161],
          [4163, 4165],
          [4169, 4174],
          [4207, 4218],
          [4223, 4228],
          [4303, 4307],
          [4309, 4314],
          [4340, 4344],
          [4352, 4365],
          [4370, 4378],
          [4380, 4385],
          [4400, 4408],
          [4410, 4413],
          [4415, 4428],
          [4486, 4494],
          [4514, 4521],
          [4550, 4575],
          [4610, 4615],
          [4625, 4627],
          [4676, 4678],
          [4699, 4702],
          [4714, 4720],
          [4722, 4724],
          [4804, 4812],
          [4814, 4816],
          [4822, 4825],
          [4828, 4830],
          [4854, 4856],
          [4858, 4861],
          [4868, 4888],
          [4890, 4892],
          [6030, 6038],
          [6063, 6069],
          [6077, 6079],
          [6227, 6230],
          [6280, 6282],
          [6284, 6286],
          [6429, 6434],
          [6436, 6438],
          [6630, 6632],
          [6712, 6714],
          [6720, 6722],
        ]) ||
        inList(p, [2011, 2031, 2032, 2035, 2036, 2044, 2045, 2063, 2067, 2250, 2251, 2287, 2289, 2307, 2308, 2311, 2312, 2350, 2365, 2390, 2415, 2460, 2500, 2502, 2505, 2506, 2508, 2545, 2546, 2590, 2594, 2611, 2655, 2656, 2663, 2665, 2666, 2668, 2669, 2671, 2672, 2675, 2678, 2680, 2681, 2745, 2817, 2818, 2852, 2898, 3644, 3707, 4000, 4025, 4051, 4183, 4184, 4220, 4221, 4270, 4272, 4275, 4280, 4285, 4287, 4300, 4301, 4346, 4347, 4350, 4387, 4388, 4390, 4454, 4455, 4461, 4462, 4465, 4467, 4468, 4470, 4472, 4474, 4477, 4580, 4581, 4600, 4601, 4605, 4606, 4608, 4620, 4621, 4630, 4650, 4655, 4659, 4660, 4662, 4670, 4671, 4673, 4674, 4680, 4694, 4695, 4697, 4709, 4712, 4727, 4730, 4733, 4735, 4736, 4741, 4800, 4818, 4819, 4849, 4850, 4852, 4865, 4895, 5157, 5172, 5301, 5302, 5304, 6055, 6083, 6090, 6232, 6233, 6236, 6254, 6275, 6288, 6290, 6302, 6304, 6306, 6336, 6337, 6346, 6385, 6440, 6442, 6443, 6450, 6528, 6532, 6535, 6536, 6623, 6628, 6635, 6639, 6640, 6642, 6646, 6701, 6705, 6710, 6718, 6725, 6726, 6728, 6740, 6743, 6753, 6758, 6760, 6762, 6765, 6770, 872, 822, 847, 852, 854, 860, 862, 870, 886]),
    },
  ];

  return rules.filter((rule) => rule.match(postcode));
}

const categoryPostcodeCache = {};
let progressResetTimer = null;
let isMarking = false;
let isPaused = false;

function setButtonsRunningState(running) {
  const markButton = document.getElementById("markButton");
  const quickMarkButton = document.getElementById("quickMarkButton");
  const pauseButton = document.getElementById("pauseButton");
  const resumeButton = document.getElementById("resumeButton");
  if (markButton) markButton.disabled = running;
  if (quickMarkButton) quickMarkButton.disabled = running;
  if (pauseButton) pauseButton.style.display = running ? "block" : "none";
  if (resumeButton) resumeButton.style.display = "none";
}

function setProgress(percent) {
  const wrap = document.getElementById("progressWrap");
  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  if (!wrap || !fill || !text) return;
  const n = Number(percent);
  const safe = Math.max(
    0,
    Math.min(100, Math.round(Number.isFinite(n) ? n : 0))
  );
  wrap.style.display = "block";
  fill.style.width = `${safe}%`;
  text.textContent = `${safe}%`;
}

function startProgress(total) {
  clearTimeout(progressResetTimer);
  progressResetTimer = null;
  if (total > 0) {
    setProgress((1 / total) * 5);
  } else {
    setProgress(0);
  }
}

function finishProgress() {
  setProgress(100);
}

function resetProgressLater() {
  clearTimeout(progressResetTimer);
  progressResetTimer = setTimeout(() => {
    progressResetTimer = null;
    const wrap = document.getElementById("progressWrap");
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (!wrap || !fill || !text) return;
    wrap.style.display = "none";
    fill.style.width = "0%";
    text.textContent = "0%";
  }, 1200);
}

async function waitWhilePaused() {
  while (isPaused) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function getPostcodesByCategoryId(categoryId) {
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

async function runMarking(postcodeInput) {
  const status = document.getElementById("status");

  if (isMarking) {
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
    isMarking = true;
    isPaused = false;
    clearTimeout(progressResetTimer);
    progressResetTimer = null;
    setButtonsRunningState(true);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab.url || "";

    if (!/https:\/\/www\.google\.[^/]+\/maps/.test(url)) {
      clearTimeout(progressResetTimer);
      progressResetTimer = null;
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
    clearTimeout(progressResetTimer);
    progressResetTimer = null;
    console.error(langPack.markFailed, error);
    status.textContent = langPack.errorPrefix + error.message;
    status.className = "status error";
    status.style.display = "block";
    setProgress(0);
  } finally {
    isMarking = false;
    isPaused = false;
    setButtonsRunningState(false);
  }
}

/**
 * 异步函数：从浏览器的本地存储（Chrome extension 提供的 API）中获取自定义列表名称
 * 本地存储的 key 是 'customListName'
 * 如果用户从未设置过，就返回默认值 langPack.defaultListName
 */
// 从本地存储获取自定义列表名称
async function getCustomListName() {
  try {
    const result = (await chrome.storage?.local?.get("customListName")) || {};
    return normalizeListName(result.customListName) || langPack.defaultListName;
  } catch (error) {
    const local = localStorage.getItem("customListName");
    return normalizeListName(local) || langPack.defaultListName;
  }
}

/**
 * 异步函数：将用户输入的列表名称保存到浏览器本地存储中
 * 保存点就是 'customListName' 这个 key
 * chrome.storage.local.set 方法会把数据存储在用户本地的浏览器中
 */
async function saveCustomListName(name) {
  const normalized = normalizeListName(name);
  try {
    await chrome.storage?.local?.set({ customListName: normalized });
  } catch (error) {
    localStorage.setItem("customListName", normalized);
  }
}

/**
 * 页面加载完成后，进行初始化操作
 * 设置语言、占位提示文本、默认值、绑定事件等
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadUiLocalePref();

    const batchResult = document.getElementById("batchEligibilityResult");
    const quickCategory = document.getElementById("quickCategory");
    const quickMarkButton = document.getElementById("quickMarkButton");
    const categoryGuide = document.getElementById("categoryGuide");
    const pauseButton = document.getElementById("pauseButton");
    const resumeButton = document.getElementById("resumeButton");
    const copyIcon = document.getElementById("copyIcon");
    const eligibilityInput = document.getElementById("eligibilityPostcode");
    const eligibilityResult = document.getElementById("eligibilityResult");
    const postcodesInput = document.getElementById("postcodes");
    const uiLocaleSelect = document.getElementById("uiLocale");

    const renderEligibility = () => {
      const raw = eligibilityInput.value.trim();
      if (!raw) {
        eligibilityResult.textContent = "";
        return;
      }
      if (!/^\d{4}$/.test(raw)) {
        eligibilityResult.textContent = langPack.eligibilityInvalid;
        return;
      }
      const postcode = parseInt(raw, 10);
      const matched = getMatchedEligibility(postcode);
      if (!matched.length) {
        eligibilityResult.textContent = langPack.eligibilityNoMatch;
        return;
      }

      const lines = [langPack.eligibilityMatchedPrefix];
      matched.forEach((item, index) => {
        lines.push(
          `${index + 1}. ${item.label}\n   ${langPack.eligibilityFrom} ${item.from}`
        );
      });
      eligibilityResult.textContent = lines.join("\n");
    };

    const renderBatchEligibility = () => {
      const raw = postcodesInput.value.trim();
      if (!raw) {
        batchResult.textContent = langPack.batchNoInput;
        return;
      }

      const list = parsePostcodesInput(raw);
      if (!list.length) {
        batchResult.textContent = langPack.batchNoValid;
        return;
      }

      const matchedItems = [];
      const unmatched = [];
      list.forEach((postcode) => {
        const matched = getMatchedEligibility(postcode);
        if (!matched.length) {
          unmatched.push(postcode);
          return;
        }
        matchedItems.push({
          postcode,
          categories: matched.map((item) => item.label),
        });
      });

      const statLine = langPack.batchSummaryStats
        .replace("%s", String(list.length))
        .replace("%s", String(matchedItems.length))
        .replace("%s", String(unmatched.length));

      const lines = [langPack.batchSummaryTitle, statLine, ""];
      matchedItems.slice(0, 80).forEach((item) => {
        lines.push(
          `${langPack.batchHitLabel} ${item.postcode} -> ${item.categories.join(", ")}`
        );
      });
      if (matchedItems.length > 80) {
        lines.push(`... +${matchedItems.length - 80}`);
      }
      if (unmatched.length) {
        lines.push("");
        lines.push(`${langPack.batchUnmatchedLabel} ${unmatched.join(", ")}`);
      }

      batchResult.textContent = lines.join("\n");
    };

    const renderCategoryGuide = () => {
      const categoryId = quickCategory.value;
      const map = {
        remote: langPack.categoryGuideRemote,
        northern: langPack.categoryGuideNorthern,
        regional: langPack.categoryGuideRegional,
        bushfire: langPack.categoryGuideBushfire,
        natural: langPack.categoryGuideNatural,
      };
      const body = map[categoryId] || langPack.categoryGuideDefault;
      categoryGuide.textContent = `${langPack.categoryGuidePrefix}\n${body}`;
    };

    function rebuildQuickCategoryOptions() {
      const saved = quickCategory.value;
      const quickCategories = [
        { id: "remote", label: langPack.eligibilityRuleRemote },
        { id: "northern", label: langPack.eligibilityRuleNorthern },
        { id: "regional", label: langPack.eligibilityRuleRegional },
        { id: "bushfire", label: langPack.eligibilityRuleBushfire },
        { id: "natural", label: langPack.eligibilityRuleNatural },
      ];
      const ids = new Set(quickCategories.map((c) => c.id));
      quickCategory.innerHTML = quickCategories
        .map((item) => `<option value="${item.id}">${item.label}</option>`)
        .join("");
      if (ids.has(saved)) quickCategory.value = saved;
    }

    function applyLocalizedStrings() {
      syncLangPack();

      document.getElementById("title").textContent = langPack.title;
      document.getElementById("subtitle").textContent = langPack.subtitle;
      document.getElementById("langLabel").textContent = langPack.langLabel;
      if (uiLocaleSelect) {
        const opts = uiLocaleSelect.options;
        if (opts[0]) opts[0].textContent = langPack.langOptionAuto;
        if (opts[1]) opts[1].textContent = langPack.langOptionZh;
        if (opts[2]) opts[2].textContent = langPack.langOptionEn;
        uiLocaleSelect.value = uiLocalePref;
      }

      document.getElementById("sectionListTitle").textContent =
        langPack.sectionListTitle;
      document.getElementById("sectionQuickTitle").textContent =
        langPack.sectionQuickTitle;
      document.getElementById("sectionManualTitle").textContent =
        langPack.sectionManualTitle;
      document.getElementById("sectionEligibilityTitle").textContent =
        langPack.sectionEligibilityTitle;

      document.getElementById("label").textContent = langPack.label;
      document.getElementById("markButton").textContent = langPack.button;
      document.getElementById("hint").innerHTML = langPack.hintHtml;
      postcodesInput.placeholder = langPack.placeholder;

      document.getElementById("customListLabel").textContent =
        langPack.customListLabel;
      document.getElementById("customListName").placeholder =
        langPack.inputPlaceholder;

      copyIcon.textContent = langPack.copyIcon;
      copyIcon.title = langPack.copyIconTitle;

      document.getElementById("eligibilityTitle").textContent =
        langPack.eligibilityTitle;
      document.getElementById("eligibilityLabel").textContent =
        langPack.eligibilityLabel;
      eligibilityInput.placeholder = langPack.eligibilityPlaceholder;
      document.getElementById("eligibilityNote").textContent =
        langPack.eligibilityNote;

      batchResult.style.display = "block";
      document.getElementById("quickActionTitle").textContent =
        langPack.quickActionTitle;
      quickMarkButton.textContent = langPack.quickActionButton;
      pauseButton.textContent = langPack.pauseButton;
      resumeButton.textContent = langPack.resumeButton;

      document.getElementById("sponsorTitleEl").textContent =
        langPack.sponsorTitle;
      document.getElementById("sponsorDescEl").textContent =
        langPack.sponsorDesc;
      document.getElementById("sponsorButton").textContent =
        langPack.sponsorButton;

      rebuildQuickCategoryOptions();
      renderCategoryGuide();

      document.documentElement.lang =
        resolvedUiLocale() === "zh" ? "zh" : "en";
      document.title = langPack.title;

      renderBatchEligibility();
      renderEligibility();
    }

    applyLocalizedStrings();

    uiLocaleSelect.addEventListener("change", async (e) => {
      await saveUiLocalePref(e.target.value);
      applyLocalizedStrings();
    });

    const customListInput = document.getElementById("customListName");
    customListInput.value = await getCustomListName();

    console.log("customListInput.value", customListInput.value);

    document
      .getElementById("copyableListName")
      .querySelector("span:first-child").textContent = customListInput.value;

    customListInput.addEventListener("input", async (e) => {
      const newListName = e.target.value;
      await saveCustomListName(newListName);
      document
        .getElementById("copyableListName")
        .querySelector("span:first-child").textContent = newListName;
      window.currentListName = newListName;
    });

    copyIcon.addEventListener("click", async () => {
      console.log("点击了复制按钮");
      try {
        const listName = document.getElementById("customListName").value;
        await navigator.clipboard.writeText(listName);

        copyIcon.textContent = langPack.copied;
        document.getElementById("copyableListName").style.borderColor =
          "#34d399";
        setTimeout(() => {
          copyIcon.textContent = langPack.copyIcon;
          document.getElementById("copyableListName").style.borderColor = "";
        }, 1500);
      } catch (err) {
        alert(`${langPack.errorPrefix} ${err.message || err}`);
      }
    });

    eligibilityInput.addEventListener("input", () => {
      eligibilityInput.value = eligibilityInput.value.replace(/[^\d]/g, "");
      renderEligibility();
    });

    postcodesInput.addEventListener("input", renderBatchEligibility);

    quickMarkButton.addEventListener("click", async () => {
      const categoryId = quickCategory.value;
      const postcodes = getPostcodesByCategoryId(categoryId);
      if (!postcodes.length) {
        alert(langPack.quickActionNoData);
        return;
      }

      if (postcodes.length > 300) {
        const confirmed = window.confirm(
          langPack.quickActionTooMany.replace("%s", String(postcodes.length))
        );
        if (!confirmed) return;
      }

      postcodesInput.value = postcodes.join(", ");
      renderBatchEligibility();
      await runMarking(postcodesInput.value.trim());
    });
    pauseButton.addEventListener("click", () => {
      if (!isMarking) return;
      isPaused = true;
      pauseButton.style.display = "none";
      resumeButton.style.display = "block";
      const status = document.getElementById("status");
      status.textContent = langPack.pausedStatus;
      status.className = "status paused";
      status.style.display = "block";
    });
    resumeButton.addEventListener("click", () => {
      if (!isMarking) return;
      isPaused = false;
      resumeButton.style.display = "none";
      pauseButton.style.display = "block";
      const status = document.getElementById("status");
      status.textContent = langPack.processingStatus;
      status.className = "status processing";
      status.style.display = "block";
    });
    quickCategory.addEventListener("change", renderCategoryGuide);

    document.getElementById("sponsorButton").addEventListener("click", () => {
      try {
        chrome.tabs.create({ url: SPONSOR_WHV_URL });
      } catch (e) {
        window.open(SPONSOR_WHV_URL, "_blank", "noopener,noreferrer");
      }
    });
  } catch (error) {
    console.error(langPack.initFailed, error);
  }
});

// 获取用户保存的列表（在页面上下文中执行）
function extractUserLists() {
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

// 点击"标注"按钮
document.getElementById("markButton").addEventListener("click", async () => {
  const postcodeInput = document.getElementById("postcodes").value.trim();
  await runMarking(postcodeInput);
});

// 页面上下文中执行，处理单个邮编标注
async function markSinglePostcode(postcode, lang, targetListName) {
  // 等待页面元素加载
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
    const inputBox = await waitFor('input[name="q"]');
    inputBox.value = lang.postcodePlaceholder.replace("%s", postcode);
    inputBox.dispatchEvent(new Event("input", { bubbles: true }));

    const searchBtn = await waitFor(
      'button[aria-label="搜索"], button[aria-label="Search"]'
    );
    searchBtn.click();

    await new Promise((r) => setTimeout(r, 2000));

    const saveBtn = document.querySelector(
      'button[aria-label="保存"], button[aria-label="Save"], button[aria-label="已保存"], button[aria-label="Saved"]'
    );
    if (!saveBtn) {
      console.log(lang.skipPostcode.replace("%s", postcode));
      return { status: "failed", reason: "save_btn_not_found" };
    }

    const saveBtnLabel = (
      saveBtn.getAttribute("aria-label") ||
      saveBtn.textContent ||
      ""
    ).toLowerCase();
    if (saveBtnLabel.includes("已保存") || saveBtnLabel.includes("saved")) {
      console.log(lang.postcodeAlreadySaved.replace("%s", postcode));
      return { status: "skipped", reason: "already_saved" };
    }

    saveBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    await waitFor('div[role="menuitemradio"]', 7000).catch(() => null);
    const items = document.querySelectorAll('div[role="menuitemradio"]');

    const normalizedTarget = (targetListName || "")
      .replace(/\s+/g, " ")
      .trim();
    let matchedTargetList = false;
    for (const item of items) {
      const label = (item.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (label === normalizedTarget || label.includes(normalizedTarget)) {
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
