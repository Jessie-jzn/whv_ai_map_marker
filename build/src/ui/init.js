// 弹窗主初始化
// ----------------------------------------------------------------------------
// 把原本几百行的 DOMContentLoaded 监听器拆到这里，按"获取元素 → 定义渲染
// helper → 应用文案 → 绑定事件"四段顺序组织。
// 这是 UI 层，写得直白即可，不要在这里加业务逻辑——业务都在 advisor/marking/
// eligibility 模块里。
// ----------------------------------------------------------------------------

import { SPONSOR_WHV_URL, DEFAULT_LLM_MODELS } from "../config.js";
import {
  langPack,
  loadUiLocalePref,
  saveUiLocalePref,
  syncLangPack,
  resolvedUiLocale,
  getUiLocalePref,
} from "../i18n.js";
import {
  parsePostcodesInput,
} from "../eligibility/postcodes.js";
import { getMatchedEligibility } from "../eligibility/rules.js";
import { recommendWhvTowns, pickRelevantPros } from "../advisor/recommend.js";
import {
  loadAiSettings,
  saveAiSettings,
  askLlm,
  adaptLlmRecommendations,
  hasBuiltinOpenrouterKey,
  hasOpenrouterProxy,
} from "../advisor/llm.js";
import {
  hasGeminiProxy,
  hasBuiltinGeminiKey,
  normalizeGeminiModelId,
} from "../advisor/gemini.js";
import { normalizeDeepseekModelId } from "../advisor/deepseek.js";
import { hasCloudRouter } from "../advisor/cloudRouter.js";
import {
  buildCacheKey,
  getCachedLlm,
  putCachedLlm,
  clearLlmCache,
  getLlmCacheStats,
} from "../advisor/cache.js";
import {
  isMarking,
  setPaused,
} from "../marking/state.js";
import {
  runMarking,
  getCustomListName,
  saveCustomListName,
  getPostcodesByCategoryId,
} from "../marking/runner.js";

/**
 * UI 初始化总入口。
 * 由 popup.js 在 DOMContentLoaded 时调用。
 */
export async function initPopup() {
  try {
    // 通过 ?ctx=side 区分：manifest 中只有 side_panel.default_path 携带该 query。
    // 切到侧栏视图时移除 max-width 约束。
    const isSidePanel =
      new URLSearchParams(location.search).get("ctx") === "side";
    if (isSidePanel) {
      document.body.classList.add("is-side-panel");
    }

    await loadUiLocalePref();

    // -- 一次性抓取所有要用到的 DOM 元素 -----------------------------------
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

    const aiLocationInput = document.getElementById("aiCurrentLocation");
    const aiGoalSelect = document.getElementById("aiGoal");
    const aiIndustrySelect = document.getElementById("aiIndustry");
    const aiCanDriveCheckbox = document.getElementById("aiCanDrive");
    const aiNotesInput = document.getElementById("aiNotes");
    const aiAskButton = document.getElementById("aiAskButton");
    const aiResultContainer = document.getElementById("aiAdvisorResult");

    const aiProviderSelect = document.getElementById("aiProvider");
    const aiApiKeyInput = document.getElementById("aiApiKey");
    const aiModelInput = document.getElementById("aiModel");
    const aiSaveSettingsBtn = document.getElementById("aiSaveSettings");
    const aiClearKeyBtn = document.getElementById("aiClearKey");
    const aiSettingsStatus = document.getElementById("aiSettingsStatus");
    const aiCacheStatsEl = document.getElementById("aiCacheStats");
    const aiClearCacheBtn = document.getElementById("aiClearCache");

    // -- 渲染逻辑（不绑定事件，只是把当前数据画到 DOM 上）------------------

    /** 单个邮编资格校验结果区域。 */
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

    /** 批量邮编输入框下方的统计与"命中 / 未命中"摘要。 */
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
      // 命中条目太多时，UI 只显示前 80 个，剩下的用 "... +N" 折叠
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

    /** "一键按类别"下拉切换时，更新右侧的"该类别可计入的工作类型"说明。 */
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

    /**
     * 把类别下拉的 <option> 用当前语言重建一遍。
     * 切语言时调用——HTML 里这些 option 写的是空字符串，全靠这个函数填充。
     */
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

    // -- AI Advisor UI 状态 -----------------------------------------------
    // 这些变量在多个事件处理器之间共享，所以放在 init 函数闭包里。

    let lastAskedAiInputs = null;
    let lastAiSource = "local"; // "local" | "openai" | "anthropic"
    let lastAiSummary = "";
    let aiSettingsCache = { provider: "local", apiKey: "", model: "" };

    /** 显示一段灰色提示文案（空态、加载中、未命中等场景共用）。 */
    function setAiEmpty(message) {
      aiResultContainer.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "ai-advisor-empty";
      empty.textContent = message;
      aiResultContainer.appendChild(empty);
      aiResultContainer.classList.add("is-visible");
    }

    /** 中文界面显示"英文名 · 中文名"，英文界面只显示英文名。 */
    function getDisplayTownName(town) {
      const locale = resolvedUiLocale();
      if (locale === "zh" && town.cnName) {
        return `${town.name} · ${town.cnName}`;
      }
      return town.name;
    }

    /** 把 goal 的 id 翻译成 summary 文案里要用的"目标短语"。 */
    function getGoalLabel(goalId) {
      const map = {
        second: langPack.aiGoalSummarySecond,
        third: langPack.aiGoalSummaryThird,
        work: langPack.aiGoalSummaryWork,
        travel: langPack.aiGoalSummaryTravel,
      };
      return map[goalId] || langPack.aiGoalSummaryWork;
    }

    /** 组合 summary 句子。没填位置时直接用"匿名版"模板，否则区分有/无车。 */
    function buildAiSummary(inputs) {
      const loc =
        inputs.currentLocation && inputs.currentLocation.trim()
          ? inputs.currentLocation.trim()
          : langPack.aiLocFallback;
      const goal = getGoalLabel(inputs.goal);
      if (!inputs.currentLocation || !inputs.currentLocation.trim()) {
        return langPack.aiSummaryAnonymous;
      }
      const tmpl = inputs.canDrive
        ? langPack.aiSummaryWithCar
        : langPack.aiSummaryNoCar;
      return tmpl.replace("%loc%", loc).replace("%goal%", goal);
    }

    /** 数据来源标签的文案。 */
    function getSourceTagText(source) {
      if (source === "cloud") return langPack.aiSourceLlmCloud;
      if (source === "gemini") return langPack.aiSourceLlmGemini;
      if (source === "deepseek") return langPack.aiSourceLlmDeepSeek;
      if (source === "openai") return langPack.aiSourceLlmOpenAI;
      if (source === "anthropic") return langPack.aiSourceLlmAnthropic;
      if (source === "openrouter") return langPack.aiSourceLlmOpenRouter;
      return langPack.aiSourceLocal;
    }

    /** 把毫秒时间戳变成"刚刚 / 12 分钟前 / 3 小时前 / 2 天前"这种可读串。 */
    function formatTimeAgo(ts) {
      if (!ts) return langPack.aiCacheJustNow;
      const diff = Math.max(0, Date.now() - ts);
      const min = Math.floor(diff / 60000);
      if (min < 1) return langPack.aiCacheJustNow;
      if (min < 60) return langPack.aiCacheMinutesAgo.replace("%n%", String(min));
      const hr = Math.floor(min / 60);
      if (hr < 24) return langPack.aiCacheHoursAgo.replace("%n%", String(hr));
      const day = Math.floor(hr / 24);
      return langPack.aiCacheDaysAgo.replace("%n%", String(day));
    }

    /**
     * 渲染推荐结果到 UI。
     * recommendations 可以来自：
     *   a) 本地引擎（recommendWhvTowns 的返回结构）
     *   b) LLM（adaptLlmRecommendations 转换后的结构，带 llmReasons）
     * @param opts {
     *   source: "local"|"openai"|"anthropic",
     *   recommendations?: any[],
     *   summary?: string,
     *   fromCache?: boolean,   // 命中本地缓存,在 summary 旁加"📦 缓存"徽标
     *   cachedAt?: number,     // 缓存写入的毫秒时间戳,用于显示相对时间
     * }
     */
    function renderAiResults(inputs, opts = {}) {
      const source = opts.source || "local";
      const recommendations =
        opts.recommendations || recommendWhvTowns(inputs);
      aiResultContainer.innerHTML = "";

      if (!recommendations.length) {
        setAiEmpty(langPack.aiNoResult);
        return;
      }

      // -- 顶部 summary -------------------------------------------------
      const summary = document.createElement("div");
      summary.className = "ai-advisor-summary";

      const summaryText = document.createElement("span");
      summaryText.textContent = opts.summary || buildAiSummary(inputs);
      summary.appendChild(summaryText);

      const sourceTag = document.createElement("span");
      sourceTag.className = `ai-source-tag ${source === "local" ? "is-local" : "is-llm"}`;
      sourceTag.textContent = getSourceTagText(source);
      summary.appendChild(sourceTag);

      if (opts.fromCache) {
        const cacheTag = document.createElement("span");
        cacheTag.className = "ai-cache-tag";
        cacheTag.textContent = langPack.aiCacheTagHit.replace(
          "%time%",
          formatTimeAgo(opts.cachedAt)
        );
        summary.appendChild(cacheTag);
      }

      aiResultContainer.appendChild(summary);

      lastAiSource = source;
      lastAiSummary = summaryText.textContent;

      // -- "一次性把全部推荐写入手动输入"按钮 ---------------------------
      const fillAllPostcodes = Array.from(
        new Set(recommendations.flatMap((item) => item.town.postcodes))
      );
      const fillAllWrap = document.createElement("div");
      fillAllWrap.className = "ai-fill-all";
      const fillAllBtn = document.createElement("button");
      fillAllBtn.type = "button";
      fillAllBtn.className = "btn btn-secondary";
      fillAllBtn.textContent = langPack.aiFillAllButton;
      fillAllBtn.dataset.postcodes = fillAllPostcodes.join(",");
      fillAllBtn.dataset.mode = "append";
      fillAllWrap.appendChild(fillAllBtn);
      const fillAllHint = document.createElement("span");
      fillAllHint.className = "ai-fill-all-hint";
      fillAllHint.textContent = langPack.aiFillAllSummary
        .replace("%n%", String(recommendations.length))
        .replace("%c%", String(fillAllPostcodes.length));
      fillAllWrap.appendChild(fillAllHint);
      aiResultContainer.appendChild(fillAllWrap);

      // -- 每条推荐的卡片 -----------------------------------------------
      const locale = resolvedUiLocale();
      recommendations.forEach(({ town, activeTags, llmReasons }, index) => {
        const card = document.createElement("div");
        card.className = "ai-rec";

        const header = document.createElement("div");
        header.className = "ai-rec-header";

        const rank = document.createElement("span");
        rank.className = "ai-rec-rank";
        rank.textContent = `${langPack.aiRankPrefix}${index + 1}`;
        header.appendChild(rank);

        const name = document.createElement("span");
        name.className = "ai-rec-name";
        name.textContent = getDisplayTownName(town);
        header.appendChild(name);

        const state = document.createElement("span");
        state.className = "ai-rec-state";
        state.textContent = town.state;
        header.appendChild(state);

        const postcodes = document.createElement("span");
        postcodes.className = "ai-rec-postcodes";
        postcodes.textContent = `${langPack.aiRecPostcodes} ${town.postcodes.join(", ")}`;
        header.appendChild(postcodes);

        card.appendChild(header);

        // LLM 提供了 reasons 就直接用；本地引擎则按 activeTags 算
        const reasons = document.createElement("ul");
        reasons.className = "ai-rec-reasons";
        const prosToShow =
          Array.isArray(llmReasons) && llmReasons.length
            ? llmReasons
            : pickRelevantPros(town, activeTags, locale, 3);
        prosToShow.forEach((text) => {
          const li = document.createElement("li");
          li.textContent = text;
          reasons.appendChild(li);
        });
        card.appendChild(reasons);

        const actions = document.createElement("div");
        actions.className = "ai-rec-actions";

        // "填入" = 覆盖手动输入框；"追加" = 与已有内容合并去重
        const fillBtn = document.createElement("button");
        fillBtn.type = "button";
        fillBtn.className = "btn btn-secondary";
        fillBtn.textContent = langPack.aiFillButton;
        fillBtn.dataset.postcodes = town.postcodes.join(",");
        fillBtn.dataset.mode = "fill";
        actions.appendChild(fillBtn);

        const appendBtn = document.createElement("button");
        appendBtn.type = "button";
        appendBtn.className = "btn btn-outline";
        appendBtn.textContent = langPack.aiAppendButton;
        appendBtn.dataset.postcodes = town.postcodes.join(",");
        appendBtn.dataset.mode = "append";
        actions.appendChild(appendBtn);

        card.appendChild(actions);
        aiResultContainer.appendChild(card);
      });

      aiResultContainer.classList.add("is-visible");
    }

    // -- AI 输入持久化 ----------------------------------------------------

    async function loadAiInputs() {
      try {
        const r = (await chrome.storage?.local?.get("aiAdvisorInputs")) || {};
        const saved = r.aiAdvisorInputs;
        if (!saved || typeof saved !== "object") return;
        if (typeof saved.currentLocation === "string")
          aiLocationInput.value = saved.currentLocation;
        if (typeof saved.goal === "string") aiGoalSelect.value = saved.goal;
        if (typeof saved.industry === "string")
          aiIndustrySelect.value = saved.industry;
        if (typeof saved.canDrive === "boolean")
          aiCanDriveCheckbox.checked = saved.canDrive;
        if (typeof saved.notes === "string") aiNotesInput.value = saved.notes;
      } catch (e) {
        // 静默失败：storage 不可用时跳过即可
      }
    }

    async function saveAiInputs(inputs) {
      try {
        await chrome.storage?.local?.set({ aiAdvisorInputs: inputs });
      } catch (e) {
        // 静默失败
      }
    }

    /** 把当前 UI 上 AI advisor 的字段读成对象，方便统一保存/调推荐引擎。 */
    function getAiInputs() {
      return {
        currentLocation: aiLocationInput.value || "",
        goal: aiGoalSelect.value || "second",
        industry: aiIndustrySelect.value || "any",
        canDrive: !!aiCanDriveCheckbox.checked,
        notes: aiNotesInput.value || "",
      };
    }

    /**
     * 在 locale 变化或首次启动时，把界面上所有文案重新刷一遍。
     * 注意 LLM 来源的结果不会重新调远端（避免每次切语言就消耗一次 token）。
     */
    function applyLocalizedStrings() {
      syncLangPack();

      document.getElementById("title").textContent = langPack.title;
      document.getElementById("subtitle").textContent = langPack.subtitle;
      document.getElementById("langLabel").textContent = langPack.langLabel;
      const openSideBtn = document.getElementById("openInSidePanel");
      if (openSideBtn) openSideBtn.textContent = langPack.openInSidePanel;
      if (uiLocaleSelect) {
        const opts = uiLocaleSelect.options;
        if (opts[0]) opts[0].textContent = langPack.langOptionAuto;
        if (opts[1]) opts[1].textContent = langPack.langOptionZh;
        if (opts[2]) opts[2].textContent = langPack.langOptionEn;
        uiLocaleSelect.value = getUiLocalePref();
      }

      document.getElementById("sectionListTitle").textContent =
        langPack.sectionListTitle;
      document.getElementById("sectionAiAdvisorTitle").textContent =
        langPack.sectionAiAdvisorTitle;
      document.getElementById("sectionQuickTitle").textContent =
        langPack.sectionQuickTitle;
      document.getElementById("sectionManualTitle").textContent =
        langPack.sectionManualTitle;
      document.getElementById("sectionEligibilityTitle").textContent =
        langPack.sectionEligibilityTitle;

      document.getElementById("aiAdvisorIntro").textContent =
        langPack.aiAdvisorIntro;
      document.getElementById("aiLocationLabel").textContent =
        langPack.aiLocationLabel;
      aiLocationInput.placeholder = langPack.aiLocationPlaceholder;
      document.getElementById("aiGoalLabel").textContent = langPack.aiGoalLabel;
      document.getElementById("aiIndustryLabel").textContent =
        langPack.aiIndustryLabel;
      document.getElementById("aiCanDriveLabel").textContent =
        langPack.aiCanDriveLabel;
      document.getElementById("aiNotesLabel").textContent =
        langPack.aiNotesLabel;
      aiNotesInput.placeholder = langPack.aiNotesPlaceholder;
      aiAskButton.textContent = lastAskedAiInputs
        ? langPack.aiAskAgainButton
        : langPack.aiAskButton;
      document.getElementById("aiDisclaimer").textContent =
        langPack.aiDisclaimer;

      // AI advisor 表单的 <option> 都靠脚本填充
      const goalOpts = aiGoalSelect.options;
      if (goalOpts[0]) goalOpts[0].textContent = langPack.aiGoalSecond;
      if (goalOpts[1]) goalOpts[1].textContent = langPack.aiGoalThird;
      if (goalOpts[2]) goalOpts[2].textContent = langPack.aiGoalWork;
      if (goalOpts[3]) goalOpts[3].textContent = langPack.aiGoalTravel;

      const indOpts = aiIndustrySelect.options;
      if (indOpts[0]) indOpts[0].textContent = langPack.aiIndustryAny;
      if (indOpts[1]) indOpts[1].textContent = langPack.aiIndustryHospitality;
      if (indOpts[2]) indOpts[2].textContent = langPack.aiIndustryFarm;
      if (indOpts[3]) indOpts[3].textContent = langPack.aiIndustryConstruction;
      if (indOpts[4]) indOpts[4].textContent = langPack.aiIndustryFishing;
      if (indOpts[5]) indOpts[5].textContent = langPack.aiIndustryTourism;
      if (indOpts[6]) indOpts[6].textContent = langPack.aiIndustryMining;

      document.getElementById("aiSettingsSummary").textContent =
        langPack.aiSettingsSummary;
      document.getElementById("aiSettingsDesc").textContent =
        langPack.aiSettingsDesc;
      document.getElementById("aiProviderLabel").textContent =
        langPack.aiProviderLabel;
      document.getElementById("aiApiKeyLabel").textContent =
        langPack.aiApiKeyLabel;
      document.getElementById("aiApiKeyHint").textContent =
        langPack.aiApiKeyHint;
      document.getElementById("aiModelLabel").textContent =
        langPack.aiModelLabel;
      aiApiKeyInput.placeholder = langPack.aiApiKeyPlaceholder;
      aiModelInput.placeholder = langPack.aiModelPlaceholder;
      aiSaveSettingsBtn.textContent = langPack.aiSaveSettings;
      aiClearKeyBtn.textContent = langPack.aiClearKey;
      aiClearCacheBtn.textContent = langPack.aiClearCache;
      // 计数行的具体数字由 refreshCacheStats() 异步写入,这里只兜个空文案
      if (!aiCacheStatsEl.textContent) {
        aiCacheStatsEl.textContent = langPack.aiCacheStatsEmpty;
      }
      const provOpts = aiProviderSelect.options;
      if (provOpts[0]) provOpts[0].textContent = langPack.aiProviderLocal;
      if (provOpts[1]) provOpts[1].textContent = langPack.aiProviderCloud;
      if (provOpts[2]) provOpts[2].textContent = langPack.aiProviderGemini;
      if (provOpts[3]) provOpts[3].textContent = langPack.aiProviderDeepSeek;
      if (provOpts[4]) provOpts[4].textContent = langPack.aiProviderOpenRouter;
      if (provOpts[5]) provOpts[5].textContent = langPack.aiProviderOpenAI;
      if (provOpts[6]) provOpts[6].textContent = langPack.aiProviderAnthropic;
      // 语言切换后,把"命中徽标 / 计数行"按新 locale 重新渲染
      refreshCacheStats();

      if (lastAskedAiInputs) {
        // 本地结果直接重新渲染；LLM 结果只更新顶部 summary 的 source tag 文案，
        // 不重新发请求，避免每次切语言都消耗 token。
        if (lastAiSource === "local") {
          renderAiResults(lastAskedAiInputs, { source: "local" });
        } else {
          const tag = aiResultContainer.querySelector(".ai-source-tag");
          if (tag) tag.textContent = getSourceTagText(lastAiSource);
        }
      } else {
        setAiEmpty(langPack.aiEmptyState);
      }

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

    // -- 首次渲染 ---------------------------------------------------------
    applyLocalizedStrings();

    // -- 事件绑定 ---------------------------------------------------------

    uiLocaleSelect.addEventListener("change", async (e) => {
      await saveUiLocalePref(e.target.value);
      applyLocalizedStrings();
    });

    const customListInput = document.getElementById("customListName");
    customListInput.value = await getCustomListName();

    // 同步刷新可点击复制的"列表名"展示
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

    // 点击 📋 把列表名拷到剪贴板
    copyIcon.addEventListener("click", async () => {
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

    // 单邮编校验输入框：只允许数字，输入时实时校验
    eligibilityInput.addEventListener("input", () => {
      eligibilityInput.value = eligibilityInput.value.replace(/[^\d]/g, "");
      renderEligibility();
    });

    postcodesInput.addEventListener("input", renderBatchEligibility);

    // "一键按类别"按钮：先把该类别的全部邮编填到手动输入框，再触发 runMarking
    quickMarkButton.addEventListener("click", async () => {
      const categoryId = quickCategory.value;
      const postcodes = getPostcodesByCategoryId(categoryId);
      if (!postcodes.length) {
        alert(langPack.quickActionNoData);
        return;
      }

      // 邮编多的时候提示一下用户，避免不知情就跑了几百次
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
      if (!isMarking()) return;
      setPaused(true);
      pauseButton.style.display = "none";
      resumeButton.style.display = "block";
      const status = document.getElementById("status");
      status.textContent = langPack.pausedStatus;
      status.className = "status paused";
      status.style.display = "block";
    });

    resumeButton.addEventListener("click", () => {
      if (!isMarking()) return;
      setPaused(false);
      resumeButton.style.display = "none";
      pauseButton.style.display = "block";
      const status = document.getElementById("status");
      status.textContent = langPack.processingStatus;
      status.className = "status processing";
      status.style.display = "block";
    });

    quickCategory.addEventListener("change", renderCategoryGuide);

    await loadAiInputs();

    // -- AI 设置（LLM provider + key）-------------------------------------
    aiSettingsCache = await loadAiSettings();
    aiProviderSelect.value = aiSettingsCache.provider;
    aiApiKeyInput.value = aiSettingsCache.apiKey;
    if (
      aiSettingsCache.provider === "gemini" &&
      aiSettingsCache.model &&
      !normalizeGeminiModelId(aiSettingsCache.model)
    ) {
      aiSettingsCache = { ...aiSettingsCache, model: "" };
      await saveAiSettings(aiSettingsCache);
    }
    if (
      aiSettingsCache.provider === "deepseek" &&
      aiSettingsCache.model &&
      !normalizeDeepseekModelId(aiSettingsCache.model)
    ) {
      aiSettingsCache = { ...aiSettingsCache, model: "" };
      await saveAiSettings(aiSettingsCache);
    }
    aiModelInput.value = aiSettingsCache.model;

    function refreshSettingsStatus(messageKey, replacements = {}) {
      if (!messageKey) {
        aiSettingsStatus.textContent = "";
        aiSettingsStatus.classList.remove("is-error", "is-ok");
        return;
      }
      let text = langPack[messageKey] || messageKey;
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`%${k}%`, String(v));
      }
      aiSettingsStatus.textContent = text;
      aiSettingsStatus.classList.remove("is-error", "is-ok");
      if (messageKey === "aiSettingsKeyMissing") {
        aiSettingsStatus.classList.add("is-error");
      } else {
        aiSettingsStatus.classList.add("is-ok");
      }
    }

    aiSaveSettingsBtn.addEventListener("click", async () => {
      let model = (aiModelInput.value || "").trim();
      const provider = aiProviderSelect.value || "local";
      const apiKey = (aiApiKeyInput.value || "").trim();
      let clearedInvalidGeminiModel = false;
      let clearedInvalidDeepseekModel = false;

      if (provider === "gemini" && model && !normalizeGeminiModelId(model)) {
        model = "";
        aiModelInput.value = "";
        clearedInvalidGeminiModel = true;
      }
      if (provider === "deepseek" && model && !normalizeDeepseekModelId(model)) {
        model = "";
        aiModelInput.value = "";
        clearedInvalidDeepseekModel = true;
      }

      // 选了线上厂商但没填 key 时通常拒绝保存。
      // 例外:provider === "openrouter" 且扩展有 worker 代理 URL 或打包内置
      // key 任一可用 —— 这种情况允许 "留空 apiKey",保存后会自动走代理/内置。
      const isOnlineProvider =
        provider === "cloud" ||
        provider === "gemini" ||
        provider === "deepseek" ||
        provider === "openai" ||
        provider === "anthropic" ||
        provider === "openrouter";
      const hasZeroConfig =
        (provider === "cloud" && hasCloudRouter()) ||
        (provider === "gemini" &&
          (hasGeminiProxy() || hasBuiltinGeminiKey())) ||
        (provider === "openrouter" &&
          (hasOpenrouterProxy() || hasBuiltinOpenrouterKey()));
      if (isOnlineProvider && !apiKey && !hasZeroConfig) {
        refreshSettingsStatus("aiSettingsKeyMissing");
        return;
      }

      const next = { provider, apiKey, model };
      aiSettingsCache = next;
      await saveAiSettings(next);

      if (provider === "cloud") {
        refreshSettingsStatus("aiSettingsSavedCloud");
      } else if (provider === "gemini") {
        let statusKey;
        if (apiKey) statusKey = "aiSettingsSavedGemini";
        else if (hasGeminiProxy()) statusKey = "aiSettingsSavedGeminiProxy";
        else statusKey = "aiSettingsSavedGeminiBuiltin";
        refreshSettingsStatus(statusKey, {
          model: model || DEFAULT_LLM_MODELS.gemini,
        });
        if (clearedInvalidGeminiModel) {
          refreshSettingsStatus("aiSettingsGeminiModelCleared");
        }
      } else if (provider === "deepseek") {
        refreshSettingsStatus("aiSettingsSavedDeepSeek", {
          model: model || DEFAULT_LLM_MODELS.deepseek,
        });
        if (clearedInvalidDeepseekModel) {
          refreshSettingsStatus("aiSettingsDeepseekModelCleared");
        }
      } else if (provider === "openai") {
        refreshSettingsStatus("aiSettingsSavedOpenAI", {
          model: model || DEFAULT_LLM_MODELS.openai,
        });
      } else if (provider === "anthropic") {
        refreshSettingsStatus("aiSettingsSavedAnthropic", {
          model: model || DEFAULT_LLM_MODELS.anthropic,
        });
      } else if (provider === "openrouter") {
        // 三档分别走不同文案,告诉用户当前请求会去哪儿、key 在哪。
        let statusKey;
        if (apiKey) statusKey = "aiSettingsSavedOpenRouter"; // 用户自己 key,直连 OR
        else if (hasOpenrouterProxy()) statusKey = "aiSettingsSavedOpenRouterProxy"; // 走 worker
        else statusKey = "aiSettingsSavedOpenRouterBuiltin"; // legacy 内置 key
        refreshSettingsStatus(statusKey, {
          model: model || DEFAULT_LLM_MODELS.openrouter,
        });
      } else {
        refreshSettingsStatus("aiSettingsSavedLocal");
      }
    });

    aiClearKeyBtn.addEventListener("click", async () => {
      const next = { provider: "local", apiKey: "", model: "" };
      aiSettingsCache = next;
      aiProviderSelect.value = "local";
      aiApiKeyInput.value = "";
      aiModelInput.value = "";
      await saveAiSettings(next);
      refreshSettingsStatus("aiSettingsCleared");
    });

    /**
     * 把当前缓存的"条数 + 最早时间"渲染到设置抽屉里的小状态行。
     * 这是异步函数:storage 访问是 promise,但调用方不需要 await。
     */
    async function refreshCacheStats() {
      try {
        const stats = await getLlmCacheStats();
        if (!stats.count) {
          aiCacheStatsEl.textContent = langPack.aiCacheStatsEmpty;
          aiClearCacheBtn.disabled = true;
          return;
        }
        aiCacheStatsEl.textContent = langPack.aiCacheStats
          .replace("%count%", String(stats.count))
          .replace("%oldest%", formatTimeAgo(stats.oldestAt));
        aiClearCacheBtn.disabled = false;
      } catch (e) {
        // 静默:这只是辅助显示,坏了不至于影响主功能
        aiCacheStatsEl.textContent = "";
      }
    }

    aiClearCacheBtn.addEventListener("click", async () => {
      await clearLlmCache();
      await refreshCacheStats();
      refreshSettingsStatus("aiCacheCleared");
    });

    // 初次进入时跑一次,让设置抽屉里能立刻看到缓存条数
    refreshCacheStats();

    /** 从 UI 控件读取最新 AI 设置(Ask AI 前必须用,避免 storage 缓存与输入框不一致)。 */
    function getAiSettingsFromUi() {
      const provider = aiProviderSelect.value || "local";
      let model = (aiModelInput.value || "").trim();
      if (provider === "gemini") {
        model = normalizeGeminiModelId(model);
      }
      if (provider === "deepseek") {
        model = normalizeDeepseekModelId(model);
      }
      return {
        provider,
        apiKey: (aiApiKeyInput.value || "").trim(),
        model,
      };
    }

    // -- Ask AI 主流程 ----------------------------------------------------
    aiAskButton.addEventListener("click", async () => {
      const inputs = getAiInputs();
      lastAskedAiInputs = inputs;
      await saveAiInputs(inputs);

      // 每次 Ask AI 都从 UI 同步最新设置并写回 storage。
      // 常见坑:用户在输入框清空了 API Key 但没点「保存设置」,storage 里仍残留
      // 空格/旧 key → 误走直连 OpenRouter 且 Authorization 为空 → 401。
      const freshSettings = getAiSettingsFromUi();
      aiSettingsCache = freshSettings;
      await saveAiSettings(freshSettings);

      // 满足"选了厂商 + 有可用 key"才走 LLM。
      // OpenRouter 特殊:用户没填 apiKey 时,有 worker 代理或打包内置 key 任一
      // 都算"有 key"(参见 llm.js OpenRouter 分支的三档优先级)。
      // 其他厂商(OpenAI / Anthropic)必须用户自己填 —— 没有任何兜底。
      const provider = freshSettings.provider;
      const hasUserKey = !!freshSettings.apiKey;
      const useLlm =
        (provider === "cloud" && hasCloudRouter()) ||
        (provider === "gemini" &&
          (hasUserKey || hasGeminiProxy() || hasBuiltinGeminiKey())) ||
        (provider === "deepseek" && hasUserKey) ||
        (provider === "openai" && hasUserKey) ||
        (provider === "anthropic" && hasUserKey) ||
        (provider === "openrouter" &&
          (hasUserKey || hasOpenrouterProxy() || hasBuiltinOpenrouterKey()));

      aiAskButton.disabled = true;
      try {
        if (useLlm) {
          const locale = resolvedUiLocale();
          // 1) 先查缓存 — 相同 (inputs + provider + model + locale) 直接复用
          const cacheKey = await buildCacheKey({
            inputs,
            settings: freshSettings,
            locale,
          });
          const cached = await getCachedLlm(cacheKey);
          if (cached) {
            const recs = adaptLlmRecommendations(cached.json, locale);
            if (recs.length) {
              renderAiResults(inputs, {
                source: provider,
                recommendations: recs,
                summary:
                  typeof cached.json.summary === "string"
                    ? cached.json.summary
                    : undefined,
                fromCache: true,
                cachedAt: cached.cachedAt,
              });
              return; // 命中,跳过下方 finally 之外的网络调用
            }
          }

          // 2) miss → 真发请求
          setAiEmpty(langPack.aiLlmThinking);
          try {
            const llmJson = await askLlm(inputs, freshSettings, locale);
            const recs = adaptLlmRecommendations(llmJson, locale);
            if (!recs.length) throw new Error("empty recommendations");
            // 3) 写入缓存(空结果 / 失败不会到这里);UI 完成后异步更新计数
            await putCachedLlm(cacheKey, llmJson);
            renderAiResults(inputs, {
              source: provider,
              recommendations: recs,
              summary:
                typeof llmJson.summary === "string"
                  ? llmJson.summary
                  : undefined,
            });
            refreshCacheStats();
          } catch (err) {
            console.warn("LLM call failed, falling back:", err);
            const reason = (err?.message || "unknown").slice(0, 120);
            renderAiResults(inputs, { source: "local" });
            // 在结果顶部插一个红色 banner 解释失败原因
            const banner = document.createElement("div");
            banner.className = "ai-advisor-empty";
            banner.style.borderColor = "#fca5a5";
            banner.style.color = "#991b1b";
            banner.style.background =
              "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";
            banner.textContent = langPack.aiLlmFailedFallback.replace(
              "%reason%",
              reason
            );
            aiResultContainer.insertBefore(
              banner,
              aiResultContainer.firstChild
            );
          }
        } else {
          renderAiResults(inputs, { source: "local" });
        }
      } finally {
        aiAskButton.disabled = false;
        aiAskButton.textContent = langPack.aiAskAgainButton;
        aiResultContainer.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    });

    // -- 委托：点击单个推荐卡片上的"填入 / 追加"按钮 -----------------------
    aiResultContainer.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-postcodes]");
      if (!button) return;
      const raw = button.dataset.postcodes || "";
      const list = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!list.length) return;

      const mode = button.dataset.mode || "fill";
      const existing = postcodesInput.value.trim();
      if (mode === "append" && existing) {
        // 追加模式：用 Set 去重后合并，保留原有顺序
        const existingSet = new Set(
          existing
            .replace(/[、，；;]/g, ",")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
        const merged = [
          ...existingSet,
          ...list.filter((p) => !existingSet.has(p)),
        ];
        postcodesInput.value = merged.join(", ");
      } else {
        postcodesInput.value = list.join(", ");
      }
      renderBatchEligibility();
      postcodesInput.scrollIntoView({ behavior: "smooth", block: "center" });
      postcodesInput.focus();
    });

    // 任何 AI advisor 输入项变更都顺手存一下，免得用户刷新就丢
    [aiLocationInput, aiNotesInput].forEach((el) => {
      el.addEventListener("change", () => saveAiInputs(getAiInputs()));
    });
    [aiGoalSelect, aiIndustrySelect].forEach((el) => {
      el.addEventListener("change", () => saveAiInputs(getAiInputs()));
    });
    aiCanDriveCheckbox.addEventListener("change", () =>
      saveAiInputs(getAiInputs())
    );

    // 赞助/作者站点按钮
    document.getElementById("sponsorButton").addEventListener("click", () => {
      try {
        chrome.tabs.create({ url: SPONSOR_WHV_URL });
      } catch (e) {
        window.open(SPONSOR_WHV_URL, "_blank", "noopener,noreferrer");
      }
    });

    // 把当前 popup 切到 Chrome 侧栏视图
    const openSidePanelBtn = document.getElementById("openInSidePanel");
    if (openSidePanelBtn) {
      openSidePanelBtn.addEventListener("click", async () => {
        try {
          if (!chrome.sidePanel?.open) {
            alert(langPack.sidePanelOpenFailed);
            return;
          }
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (!tab?.windowId) {
            alert(langPack.sidePanelOpenFailed);
            return;
          }
          // 优先用 windowId，这样侧栏在当前窗口持久打开；tabId 则只在该 tab 显示
          await chrome.sidePanel.open({ windowId: tab.windowId });
          window.close();
        } catch (err) {
          console.warn("sidePanel.open failed:", err);
          alert(langPack.sidePanelOpenFailed);
        }
      });
    }

    // 主"标注到地图"按钮：从手动输入框读邮编 -> 调 runMarking
    document
      .getElementById("markButton")
      .addEventListener("click", async () => {
        const postcodeInput = document
          .getElementById("postcodes")
          .value.trim();
        await runMarking(postcodeInput);
      });

    // 防止 lint 抱怨"未使用的变量"——lastAiSummary 在 LLM 重渲染时会读到
    void lastAiSummary;
  } catch (error) {
    console.error(langPack.initFailed, error);
  }
}
