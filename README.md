# WHV Postcode Marker · WHV 集签地图助手

<p align="center">
  <img src="build/images/icon_128.png" alt="WHV Postcode Marker" width="96" />
</p>

<p align="center">
  <a href="#中文">中文</a> · <a href="#english">English</a>
</p>

<p align="center">
  <img src="docs/images/popup-preview.png" alt="WHV 集签地图助手界面预览 / WHV Postcode Marker UI preview" width="720" />
</p>

---

## 中文

面向澳洲打工度假签证（WHV）的 Chrome 扩展。它可以把澳洲邮编批量保存到指定的 Google 地图列表，并提供邮编资格预判、按类别标注和 AI 城镇建议。

### 主要功能

- **邮编工具**：支持逗号、顿号和范围输入，保留 `0872` 等四位邮编格式。
- **Google 地图列表绑定**：通过完全一致的列表名称，把地点保存到用户手动创建的列表。
- **资格校验**：查询单个邮编，或查看批量邮编命中的区域类别。
- **按类别标注**：快速填充 Remote、Northern、Regional 等类别邮编。
- **AI WHV 建议**：根据位置、目标、行业偏好和交通条件推荐城镇，并可一键填入邮编工具。
- **弹窗与侧边栏**：既可快速打开弹窗，也可常驻 Chrome 侧边栏。
- **中英界面**：可跟随浏览器语言，或手动切换中文和英文。

### 安装

普通用户请优先从 Chrome 网上应用店安装。开发者可在本地加载：

```bash
git clone git@github.com:Jessie-jzn/whv_ai_map_marker.git
cd whv_ai_map_marker
npm test
```

然后打开 `chrome://extensions/`，开启 **开发者模式**，点击 **加载已解压的扩展程序**，选择项目中的 `build/` 目录。

### 使用方法

1. 登录 [Google 地图](https://www.google.com/maps)。
2. 进入 **已保存 → 列表 → 新建列表**，创建一个保存列表，例如“澳洲 WHV 集签列表”。
3. 在扩展的“绑定 Google 地图列表”中填写完全相同的列表名称。
4. 输入邮编或选择资格类别，然后点击标注按钮。
5. 如需城镇建议，切换到 **AI WHV 建议** 标签页。

本扩展不会读取或同步你的 Google 地图列表信息，因此需要使用列表名称完成绑定。名称可以自定义，但 Google 地图与扩展中的名称必须完全一致。

### 性能与可靠性

- 等待 Google 地图实际界面状态，减少固定延时造成的空等。
- 在线 AI 请求设有超时，并在提供方失败时自动回退。
- AI 结果使用本地缓存，相同问题可直接复用。
- 缓存写入串行化，避免多个扩展上下文并发覆盖。
- 标注过程包含进度、暂停、恢复和重复执行保护。

### 隐私

- 自定义列表名称、语言和 AI 设置保存在浏览器本地。
- BYOK API Key 保存在 `chrome.storage.local`。
- 本地 AI 模式不会调用外部模型。
- 使用在线模型时，请同时遵守相应模型提供方的隐私政策。

### 开发与测试

```bash
npm test
npm test --prefix worker
```

主要目录：

```text
build/
├── popup.html             扩展弹窗与侧边栏页面
├── animal-theme.css       轻量动物岛风格主题
├── background.js          扩展后台逻辑
└── src/
    ├── advisor/           AI 推荐、路由与缓存
    ├── eligibility/       邮编解析与资格规则
    ├── marking/           Google 地图标注流程
    └── ui/                标签页与界面初始化
worker/                    在线 AI 路由 Worker
test/                      Node.js 测试
```

### 免责声明

邮编资格与签证政策请以 [Australian Department of Home Affairs](https://immi.homeaffairs.gov.au/) 最新信息为准。扩展和 AI 输出只用于辅助规划，不构成法律或签证建议。

---

## English

WHV Postcode Marker is a Chrome extension for Australian Working Holiday Visa planning. It saves Australian postcodes to a chosen Google Maps list and includes postcode eligibility checks, category-based marking, and AI town recommendations.

### Features

- **Postcode tools**: Accept comma-separated values and ranges while preserving four-digit postcodes such as `0872`.
- **Google Maps list connection**: Save places to a user-created list by matching its exact name.
- **Eligibility checks**: Inspect one postcode or review category matches for a batch.
- **Category marking**: Quickly fill postcodes for Remote, Northern, Regional, and other supported categories.
- **AI WHV advice**: Recommend towns from location, visa goal, industry preference, and transport needs, then send their postcodes to the marking tool.
- **Popup and side panel**: Use a compact popup or keep the extension open in Chrome's side panel.
- **Chinese and English UI**: Follow the browser language or choose a language manually.

### Installation

Regular users should install the extension from the Chrome Web Store when available. For local development:

```bash
git clone git@github.com:Jessie-jzn/whv_ai_map_marker.git
cd whv_ai_map_marker
npm test
```

Open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select the repository's `build/` directory.

### Usage

1. Sign in to [Google Maps](https://www.google.com/maps).
2. Open **Saved → Lists → New list** and create a list, for example, “Australia WHV List”.
3. Enter the exact same name under **Connect a Google Maps list** in the extension.
4. Enter postcodes or choose an eligibility category, then start marking.
5. Open the **AI WHV advice** tab when you want town recommendations.

The extension does not read or synchronize your Google Maps lists. It connects to a list by name, so the name in Google Maps and the extension must match exactly.

### Performance and reliability

- Waits for real Google Maps UI state instead of relying only on fixed delays.
- Applies timeouts to online AI requests and falls back when a provider fails.
- Reuses cached AI results for repeated requests.
- Serializes cache writes to avoid concurrent extension contexts overwriting each other.
- Provides marking progress, pause/resume controls, and duplicate-run protection.

### Privacy

- List name, language, and AI settings stay in local browser storage.
- BYOK API keys are stored in `chrome.storage.local`.
- Local AI mode does not call an external model.
- Online models remain subject to their providers' privacy policies.

### Development and tests

```bash
npm test
npm test --prefix worker
```

### Disclaimer

Always verify postcode eligibility and visa policy with the latest information from the [Australian Department of Home Affairs](https://immi.homeaffairs.gov.au/). The extension and its AI output support planning only and do not constitute legal or migration advice.

---

## Support · 支持作者

- [Jessie's WHV guides · Jessie 的 WHV 专题页](https://www.jessieontheroad.com/zh/whv/)
- Issues and pull requests are welcome · 欢迎提交 Issue 和 Pull Request
- License · 许可证：[MIT](https://choosealicense.com/licenses/mit/)
