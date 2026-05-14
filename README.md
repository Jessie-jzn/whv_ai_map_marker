# WHV Postcode Marker / WHV 集签地图助手

A Chrome extension for **Australian Working Holiday** (especially **subclass 462** planning): batch-save **Australian postcodes** to your own **Google Maps Saved list**, with optional **area-type hints** (Remote / Northern / Regional / bushfire & disaster declared buckets), **category quick-fill**, and **progress controls**.

一款面向 **澳洲打工度假（含 462 等需指定区域/行业集签规划）** 的 Chrome 扩展：在 **Google 地图** 上把多个 **澳洲邮编** 批量加入你的 **自定义保存列表**，并支持 **资格预判提示**、**按类别一键填充**、**进度条与暂停/继续** 等。

> **注意**：资格与邮编清单以 **澳大利亚内政部（Home Affairs）** 最新官方页面为准；本扩展中的分类与说明仅为 **辅助参考**，不构成法律或签证建议。

---

## Features 功能特点

### Core 核心

- 🔍 **批量标注**：在 Google 地图当前标签页，将邮编依次搜索并保存到你指定的列表  
- 📍 **多种输入格式**：支持英文逗号、中文顿号/逗号/分号分隔；支持范围写法（`2832 to 2836`、`2832至2836`、`2832-2836` 等）  
- 💾 **自定义列表名**：与地图中列表标题 **完全一致** 即可；名称通过 `chrome.storage.local` 保存在本机（无开发者服务器收集）  
- 📋 **一键复制列表名**  
- 🌐 **中英双语界面**（随浏览器语言切换）

### Eligibility & planning 资格与规划

- ✅ **单个邮编即时校验**：显示可能命中的区域类型及「可计入起始」类提示（可多类同时命中）  
- 📊 **批量校验摘要**：在大文本框输入多邮编时，实时汇总命中 / 未命中数量与明细（便于粘贴微信群/表格后快速核对）  
- 🗂️ **按类别一键填充并标注**：按内置规则筛选某类邮编并写入输入框后执行标注；附带 **该类常见可计入工作说明**（中文带英文对照）

### UX 体验

- ⏳ **进度条**：按已完成邮编数更新进度  
- ⏸ **暂停 / 继续**  
- 🔒 **标注进行中**：主「标注」与「一键按类别」按钮置灰，防止重复点击  
- ⏭ **重复项跳过**：检测到已保存或目标列表已勾选时跳过  
- 🔗 **更多攻略**：扩展内入口，在新标签页打开作者网站 [WHV 专题页](https://www.jessieontheroad.com/zh/whv/)（**扩展内无嵌入广告**）

### UI 界面

- 分区卡片式布局：列表设置 → 一键类别 → 手动输入与标注 → 单邮编校验 → 支持与说明

---

## Project layout 项目结构

- **`build/`**：可直接加载或打包上架的扩展目录（`manifest.json`、`popup.html`、`popup.js`、`images/`）  
- **`images/`**：与 `build/images` 同步的图标资源（开发时可二选一维护）

---

## Installation 安装方法

### 开发者本地加载

1. 打开 Chrome，访问 `chrome://extensions/`  
2. 打开右上角 **开发者模式**  
3. 点击 **加载已解压的扩展程序**  
4. 选择本仓库下的 **`build`** 文件夹（不是仓库根目录）

### 上架包（参考）

在项目根目录可生成 zip 供 [Chrome Web Store](https://chrome.google.com/webstore/devconsole) 上传（若你有打包脚本或自行 `zip -r` 打包 `build/` 即可）。

---

## How to use 使用方法

### 1. 在 Google 地图创建列表

1. 打开 [Google 地图](https://www.google.com/maps)（若使用 `google.com.hk` 等域名，请确认扩展 `host_permissions` 已包含该域名，否则可能无法注入脚本）  
2. 菜单 (☰) → **已保存** → **列表** → **新建列表**  
3. 记下列表名称，与扩展里填写的名称 **逐字一致**（含空格、emoji）

### 2. 打开扩展弹窗

1. 在 **地图页面** 点击扩展图标  
2. **列表设置**：填写列表名（可点击 📋 复制）  
3. **一键按类别**（可选）：选择类别 → **一键填充并标注**  
4. **手动输入**（可选）：输入邮编 → **标注到地图**；过程中可用 **暂停 / 继续**  
5. **单个邮编资格校验**（可选）：输入 4 位邮编查看命中类别提示  

### 3. 权限说明（上架审核常用）

| 权限 | 用途 |
|------|------|
| `activeTab` | 在用户操作扩展时访问当前标签页 |
| `scripting` | 在 Google 地图页面注入逻辑以完成搜索与保存到列表 |
| `storage` | 仅在用户本机保存自定义列表名等设置，便于下次打开回填 |

当前 `host_permissions` 默认包含 **`https://www.google.com/maps/*`**。若你主要使用其他 Google 地图域名，需在 `build/manifest.json` 中补充对应 `host_permissions` 后重新加载扩展。

---

## Common issues 常见问题

1. **标注无反应或保存失败**  
   - 确认当前标签页是 **Google 地图** 且已登录  
   - 列表名称与地图中 **完全一致**  
   - 尝试刷新地图页后重试  
   - 若使用 `google.com.hk` 等域名，检查 `manifest` 中的 `host_permissions`

2. **自定义列表名丢失**  
   - 确认未在浏览器中清除扩展数据；`storage` 不可用时扩展会尝试 `localStorage` 兜底

3. **资格结果与官方不一致**  
   - 内置规则会随政策迭代而滞后，**递签前务必核对 Home Affairs 官方清单**

4. **Chrome 网上应用店无法提交**  
   - 在 **隐私权规范** 中填写使用 `storage` 的理由（仅本地保存列表名等）  
   - 按提示点击 **保存草稿** 后再提交审核

---

## Contributing 贡献代码

欢迎提交 Issue 与 Pull Request。较大改动请先开 Issue 说明意图。

## License 许可证

[MIT](https://choosealicense.com/licenses/mit/)
