// AI WHV Advisor —— 本地推荐引擎
// ----------------------------------------------------------------------------
// 输入：用户在 UI 上填的 { currentLocation, canDrive, goal, industry, notes }
// 输出：评分排序后的城镇列表（最多 5 个），形如 [{ town, score, activeTags }]
//
// 设计原则：
//   1. 完全跑在本地，零网络请求；
//   2. 评分逻辑是"加权打分"，每条规则只加几分，避免一个维度压倒一切；
//   3. 同时做"地理多样性约束"，避免推荐里全是同一个州。
// ----------------------------------------------------------------------------

import { WHV_TOWNS, STATE_NEIGHBORS } from "../data/whvTowns.js";

/**
 * 把用户输入的"位置"解析成州代码。
 * 优先看是否是 3–4 位数字邮编（按邮编段映射到州），
 * 然后再按常见城市/州关键字（中英文都覆盖）做命中。
 *
 * @param {string} location
 * @returns {string|null} 州代码（QLD/NSW/.../ACT）或 null
 */
export function detectStateFromLocation(location) {
  if (!location) return null;
  const raw = location.toLowerCase();

  const numeric = raw.match(/\b(\d{3,4})\b/);
  if (numeric) {
    const p = parseInt(numeric[1], 10);
    if (p >= 200 && p <= 299) return "ACT";
    if (p >= 800 && p <= 899) return "NT";
    if ((p >= 1000 && p <= 2599) || (p >= 2619 && p <= 2899)) return "NSW";
    if (p >= 3000 && p <= 3999) return "VIC";
    if (p >= 4000 && p <= 4999) return "QLD";
    if (p >= 5000 && p <= 5799) return "SA";
    if (p >= 6000 && p <= 6797) return "WA";
    if (p >= 7000 && p <= 7799) return "TAS";
  }

  const map = [
    { state: "QLD", keys: ["brisbane", "qld", "queensland", "cairns", "gold coast", "布里斯班", "昆士兰", "凯恩斯", "黄金海岸"] },
    { state: "NSW", keys: ["sydney", "nsw", "new south wales", "悉尼", "新南威尔士"] },
    { state: "VIC", keys: ["melbourne", "vic", "victoria", "墨尔本", "维多利亚"] },
    { state: "SA", keys: ["adelaide", "sa", "south australia", "阿德莱德", "南澳"] },
    { state: "WA", keys: ["perth", "wa", "western australia", "珀斯", "西澳"] },
    { state: "NT", keys: ["darwin", "nt", "northern territory", "达尔文", "北领地"] },
    { state: "TAS", keys: ["hobart", "tas", "tasmania", "塔斯", "霍巴特"] },
    { state: "ACT", keys: ["canberra", "act", "堪培拉"] },
  ];
  for (const item of map) {
    if (item.keys.some((k) => raw.includes(k))) return item.state;
  }
  return null;
}

/**
 * 从自由文本里抽关键词意图。
 * 返回值是一个布尔字典，UI 不直接看，只在评分时累加权重。
 * 中英文混合关键字都覆盖。
 */
export function extractNoteHints(notes) {
  const text = (notes || "").toLowerCase();
  return {
    farm: /(farm|farming|pick|picker|picking|harvest|农场|采摘|果园|果场)/.test(text),
    hospitality: /(hospitality|cafe|restaurant|kitchen|waiter|hotel|housekeep|餐饮|酒店|餐厅|咖啡|厨房|服务员)/.test(text),
    construction: /(construction|build|tradie|建筑|工地)/.test(text),
    tourism: /(tourism|tour|backpacker|hostel|旅游|背包客|青旅)/.test(text),
    fishing: /(fish|fishing|渔)/.test(text),
    mining: /(mine|mining|矿)/.test(text),
    warm: /(warm|tropical|hot|sun|暖|热带|阳光)/.test(text),
    cool: /(cool|cold|mild|凉|冷|温和)/.test(text),
    coastal: /(beach|coast|ocean|sea|海边|沿海|海)/.test(text),
    budget: /(budget|cheap|affordable|预算|便宜|省钱)/.test(text),
    noCar: /(no car|without car|public transport|不会开车|没车|不开车|公交|巴士|火车)/.test(text),
    community: /(chinese|asian|community|华人|亚洲)/.test(text),
  };
}

/**
 * 选取一个 town 中与 activeTags 相交最多的若干 pros。
 * 命中越多越靠前；不足 maxCount 时再把剩余的随便补齐，保证不出现空 reasons。
 */
export function pickRelevantPros(town, activeTags, locale, maxCount) {
  const tagSet = new Set(activeTags);
  const scored = town.pros.map((pro) => ({
    pro,
    hits: pro.tags.filter((t) => tagSet.has(t)).length,
  }));
  scored.sort((a, b) => b.hits - a.hits);
  const out = [];
  for (const { pro, hits } of scored) {
    if (out.length >= maxCount) break;
    if (hits > 0 || out.length < maxCount) {
      out.push(pro[locale]);
    }
  }
  return out;
}

/**
 * 推荐引擎主入口。
 * 输入用户的需求字段，输出按分数排好序的前 5 个 { town, score, activeTags }。
 *
 * 评分由 6 大维度组成，每条规则的权重见函数内注释。
 */
export function recommendWhvTowns({ currentLocation, canDrive, goal, industry, notes }) {
  const wantsEligibility = goal === "second" || goal === "third";
  const hints = extractNoteHints(notes);

  // canDrive=false 显式没车，或 notes 里写了"没车/不开车"，都按无车场景处理
  const effectiveNoCar = !canDrive || hints.noCar;
  const userState = detectStateFromLocation(currentLocation);

  // 用户在 notes 里隐式表达的行业偏好
  const industryHints = ["farm", "hospitality", "construction", "tourism", "fishing", "mining"].filter(
    (k) => hints[k]
  );

  const scored = WHV_TOWNS.map((town) => {
    let score = 0;
    const activeTags = [];

    // 1. 资格（目标）
    // 想集二/三签时，没有任何资格类别的镇基本不应该出现 -> 直接 -50 等于剔除
    if (wantsEligibility) {
      if (town.categories.length === 0) {
        score -= 50;
      } else {
        score += 6;
        activeTags.push("eligibility");
        if (goal === "second") activeTags.push("second");
        if (goal === "third" && (town.categories.includes("remote") || town.categories.includes("northern"))) {
          score += 4;
          activeTags.push("third");
        }
      }
    }

    // 2. 交通（无车场景的权重最大）
    if (effectiveNoCar) {
      if (town.transportFriendly) {
        score += 12;
        activeTags.push("transport");
      } else {
        score -= 9;
      }
    } else {
      // 会开车，反而稍稍偏好"农场偏远"的镇，毕竟人家有车的优势在这里
      if (!town.transportFriendly) score += 1;
    }

    // 3. 行业偏好（来自下拉）
    if (industry && industry !== "any") {
      if (town.industries.includes(industry)) {
        score += 9;
        activeTags.push(industry);
      } else {
        score -= 4;
      }
    } else {
      // 没有明确偏好时，行业越多元 + 是背包客聚点的城市更"安全"
      score += town.industries.length;
      if (town.backpackerHub) score += 2;
    }

    // 4. 自由文本里隐含的行业关键词，再给一次加分
    industryHints.forEach((k) => {
      if (town.industries.includes(k)) {
        score += 4;
        activeTags.push(k);
      }
    });

    // 5. 自由文本里的"环境"偏好
    if (hints.warm && (town.climate === "tropical" || town.climate === "subtropical")) score += 3;
    if (hints.cool && (town.climate === "cool" || town.climate === "temperate")) score += 3;
    if (hints.coastal && town.coastal) score += 2;
    if (hints.budget && town.backpackerHub) score += 1;
    // 想要华人/亚洲社区的人，达尔文和凯恩斯目前是已知的较合理选择
    if (hints.community && (town.id === "darwin" || town.id === "cairns")) score += 1;

    // 6. 距离用户当前位置：同州优先，邻州次之
    if (userState && town.state === userState) {
      score += 3;
      activeTags.push("nearby");
    } else if (userState && (STATE_NEIGHBORS[userState] || []).includes(town.state)) {
      score += 1;
    }

    return { town, score, activeTags };
  });

  scored.sort((a, b) => b.score - a.score);

  // 取前 5 名，且最低分要 > 0，避免推荐到完全不匹配的城镇。
  // 同时做一点"地理多样性约束"：同一个州最多保留 3 个，把名额留给次优但不同州的镇。
  const positives = scored.filter((item) => item.score > 0);
  const result = [];
  const stateCount = {};
  const MAX_PER_STATE = 3;
  for (const item of positives) {
    if (result.length >= 5) break;
    const c = stateCount[item.town.state] || 0;
    if (c >= MAX_PER_STATE) continue;
    result.push(item);
    stateCount[item.town.state] = c + 1;
  }
  // 多样性限制导致不足 5 个时，再回填溢出的候选
  if (result.length < 5) {
    for (const item of positives) {
      if (result.length >= 5) break;
      if (!result.includes(item)) result.push(item);
    }
  }
  return result;
}
