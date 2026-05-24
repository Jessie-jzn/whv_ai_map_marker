# WHV Postcode Marker / WHV 集签地图助手

**语言 / Languages：** [中文](README.md) · [English](README.en.md)

<p align="center">
  <img src="build/images/icon_128.png" alt="WHV Postcode Marker" width="96" />
</p>

面向 **澳洲打工度假（WHV / 462 等集签规划）** 的 Chrome 扩展：在 **Google 地图** 上批量把邮编加入你的 **自定义保存列表**，并附带 **资格预判**、**AI 城镇推荐**、**按类别一键填充** 等工具。

> **注意**：资格与邮编清单以 **[Home Affairs](https://immi.homeaffairs.gov.au/)** 最新官方页面为准；AI 回答可能不准确或过时，**务必自行二次核实**，不构成法律或签证建议。

**当前版本：v1.6.0**

---

## 安装（普通用户）

**请从 Chrome 网上应用店安装，不要下载 GitHub Release 里的 zip 包。**

1. 打开 Chrome，访问 **[Chrome 网上应用店](https://chromewebstore.google.com/)**
2. 搜索 **`WHV Postcode Marker`** 或 **WHV 集签地图助手**
3. 点击 **添加至 Chrome**
4. 打开 [Google 地图](https://www.google.com/maps)，点击浏览器工具栏上的扩展图标即可使用

> 若商店链接尚未上线，可关注本仓库 Release 页面说明；**Release 附件仅供开发者/审核参考，不建议普通用户解压安装。**

### 侧边栏模式（推荐）

扩展弹窗底部可点 **「在侧边栏打开」**，界面更宽，可常驻屏幕一侧，方便边看地图边填 AI 表单。

---

## v1.6.0 更新了什么

### 体验优化

- **模块化架构**：核心逻辑拆至 `build/src/`（标注、资格、AI、UI），维护与迭代更稳定  
- **侧边栏**：支持 Chrome Side Panel，弹窗与侧栏双模式  
- **中英双语**：界面随浏览器语言切换  
- **标注体验**：进度条、暂停/继续、重复邮编跳过、进行中防重复点击  
- **AI 结果缓存**：相同提问 7 天内本地复用，减少重复请求  

### 新增 AI 顾问（Ask AI）

根据你的 **当前位置、集签目标、行业偏好、是否会开车** 等，推荐 **3–5 个值得先看的 WHV 城镇**，并给出具体理由；可 **一键把推荐邮编写入手动输入框** 再批量标注。

| 模式 | 说明 | 是否需要 Key |
|------|------|----------------|
| **本地知识库**（默认） | 内置策展城镇数据 + 规则引擎，**完全离线** | 否 |
| **智能云路由**（推荐） | Worker 多模型自动切换，**免费、无需 Key** | 否 |
| **Google Gemini** | 长文本；留空 Key 走路由，也可 BYOK | 可选 |
| **DeepSeek** | 中文 / 推理强，适合政策理解；**须自填 Key** | **是** |
| **OpenRouter** | 免费模型备选；留空 Key 走路由 | 可选 |
| **OpenAI / Anthropic** | BYOK 直连 | **是** |

#### 智能云路由架构

```
Chrome 扩展 → Cloudflare Worker → AI Router → 自动切换上游
```

| 用途 | 优先链 |
|------|--------|
| 长文本（WHV 推荐默认） | Gemini → Groq → OpenRouter → SiliconFlow → Workers AI |
| 快速聊天 | Groq → Gemini → OpenRouter → … |
| 代码辅助 | SiliconFlow (Qwen Coder) → OpenRouter → Groq → Workers AI |

上游 **限流或故障** 时自动切换备用模型，用户无需配置模型列表。

**隐私**：BYOK 的 Key **仅保存在本机浏览器**，不上传至作者服务器；智能云路由 **不需要用户 Key**。

---

## 如何使用

### 1. 在 Google 地图创建列表

1. 打开 [Google 地图](https://www.google.com/maps) 并登录  
2. 菜单 (☰) → **已保存** → **列表** → **新建列表**  
3. 记下列表名称，与扩展里填写的名称 **逐字一致**（含空格）

### 2. 批量标注邮编

1. 在 **地图页面** 点击扩展图标（或打开侧边栏）  
2. **列表设置**：填写与 Google 地图一致的列表名  
3. **一键按类别**（可选）：选 Remote / Northern / Regional 等 → **一键填充并标注**  
4. **手动输入**：粘贴邮编（支持逗号、顿号、范围写法）→ **标注到地图**  

### 3. 使用 AI 顾问

1. 展开 **⚙️ 在线 AI 设置**  
2. **推荐**：提供方选 **「智能云路由」**，API Key **留空**，点 **保存设置**  
3. 填写位置、目标、行业等 → 点 **🤖 Ask AI**  
4. 满意后可用 **「一次性把全部推荐写入手动输入框」** 再标注  

**DeepSeek 用户**：在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 申请 Key，选 DeepSeek 提供方并粘贴保存。

### 4. 单个邮编资格校验

在 **资格校验** 区输入 4 位澳洲邮编，查看可能命中的区域类型（快速预判，非最终结论）。

---

## 功能一览

| 类别 | 功能 |
|------|------|
| 核心 | 批量标注、多种分隔/范围输入、自定义列表名、复制列表名 |
| 资格 | 单邮编校验、批量摘要、按类别一键填充 + 工作说明 |
| AI | 城镇推荐、在线/本地双引擎、结果缓存、一键写入输入框 |
| 体验 | 进度条、暂停/继续、中英界面、侧边栏、无应用内广告 |

---

## 常见问题

1. **标注无反应** — 确认在 Google 地图页、已登录、列表名完全一致；刷新后重试  
2. **AI 失败回退本地** — 在线模型限流或 Worker 未配置；会自动用本地知识库出推荐，顶部有红色提示  
3. **资格与官方不一致** — 内置规则可能滞后，递签前务必核对 Home Affairs 官方清单  
4. **扩展权限** — `storage` 仅本地保存设置；`scripting` 仅在 Google 地图页注入标注逻辑  

---

## 支持作者 · 打赏

本扩展 **免费使用**，无应用内广告与追踪。若对你规划 WHV 有帮助，欢迎自愿打赏，支持持续维护与 AI 服务器成本。

- 📖 更多攻略：[Jessie 的 WHV 专题页](https://www.jessieontheroad.com/zh/whv/)

### 微信收款

打开微信 → **扫一扫** → 扫描下方二维码 → 输入金额即可（备注「WHV 扩展」方便识别，可选）。

<p align="center">
  <img src="build/images/donate-qr.jpg" alt="微信收款二维码" width="240" />
</p>

### 支付宝收款

打开支付宝 → **扫一扫** → 扫描下方二维码 → 输入金额即可（备注「WHV 扩展」方便识别，可选）。

<p align="center">
  <img src="build/images/donate-zfb.jpg" alt="支付宝收款二维码" width="240" />
</p>

> 打赏完全自愿，不影响任何扩展功能。感谢你的支持 ☕

---

## 贡献与许可证

欢迎提交 Issue 与 Pull Request。许可证：[MIT](https://choosealicense.com/licenses/mit/)
