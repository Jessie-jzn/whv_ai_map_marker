# WHV Postcode Marker

**Languages:** [中文](README.md) · [English](README.en.md)

<p align="center">
  <img src="build/images/icon_128.png" alt="WHV Postcode Marker" width="96" />
</p>

A Chrome extension for **Australian Working Holiday Visa (WHV / subclass 462 planning)**: batch-add **Australian postcodes** to your **Google Maps saved list**, with **eligibility hints**, **AI town recommendations**, and **category quick-fill**.

> **Disclaimer:** Postcode and eligibility data must be verified against the latest **[Home Affairs](https://immi.homeaffairs.gov.au/)** official sources. AI answers may be wrong or outdated — **always double-check yourself**. This is not legal or visa advice.

**Current version: v1.6.0**

---

## Installation (for users)

**Install from the Chrome Web Store. Do not download the zip from GitHub Releases.**

1. Open Chrome and go to the **[Chrome Web Store](https://chromewebstore.google.com/)**
2. Search for **`WHV Postcode Marker`**
3. Click **Add to Chrome**
4. Open [Google Maps](https://www.google.com/maps) and click the extension icon in the toolbar

> If the store listing is not live yet, watch this repo’s Releases page. **Release attachments are for developers/review only — not for end-user sideloading.**

### Side panel (recommended)

At the bottom of the popup, click **Open in side panel** for a wider layout that stays docked beside your map — handy when filling in the AI form.

---

## What’s new in v1.6.0

### UX improvements

- **Modular codebase** under `build/src/` (marking, eligibility, AI, UI)  
- **Side panel** support alongside the popup  
- **Chinese / English UI** following browser language  
- **Marking UX**: progress bar, pause/resume, skip duplicates, lock while running  
- **AI cache**: reuse answers for identical questions within 7 days  

### AI advisor (Ask AI)

Based on **location, visa goal, industry preference, whether you can drive**, etc., suggests **3–5 WHV towns** worth checking first, with concrete reasons. **One-click fill** recommended postcodes into the manual input for batch marking.

| Mode | Description | API key required? |
|------|-------------|-------------------|
| **Local knowledge base** (default) | Curated towns + rules engine, **fully offline** | No |
| **Smart cloud router** (recommended) | Worker auto-failover across models, **free, no key** | No |
| **Google Gemini** | Long context; blank key uses proxy, or BYOK | Optional |
| **DeepSeek** | Strong Chinese & reasoning; **BYOK only** | **Yes** |
| **OpenRouter** | Free model fallback; blank key uses proxy | Optional |
| **OpenAI / Anthropic** | BYOK direct | **Yes** |

#### Smart cloud router

```
Chrome Extension → Cloudflare Worker → AI Router → auto-failover
```

| Purpose | Priority chain |
|---------|----------------|
| Long text (WHV default) | Gemini → Groq → OpenRouter → SiliconFlow → Workers AI |
| Fast chat | Groq → Gemini → OpenRouter → … |
| Coding | SiliconFlow (Qwen Coder) → OpenRouter → Groq → Workers AI |

On **rate limits or outages**, the router tries the next provider — no model list to configure.

**Privacy:** BYOK keys stay **only in your browser**; the smart cloud router **needs no user key**.

---

## How to use

### 1. Create a list in Google Maps

1. Open [Google Maps](https://www.google.com/maps) and sign in  
2. Menu (☰) → **Saved** → **Lists** → **New list**  
3. Note the list name — it must **match exactly** what you enter in the extension (including spaces)

### 2. Batch-mark postcodes

1. On a **Maps tab**, open the extension (or side panel)  
2. **List settings**: enter the same list name as in Google Maps  
3. **Quick fill by category** (optional): pick Remote / Northern / Regional → **Fill & Mark**  
4. **Manual input**: paste postcodes (commas, Chinese separators, ranges) → **Mark on map**  

### 3. Use the AI advisor

1. Expand **⚙️ Online AI settings**  
2. **Recommended:** provider **Smart cloud router**, leave API key **blank**, **Save**  
3. Fill location, goal, industry → **🤖 Ask AI**  
4. Use **Send all suggestions to manual input** then mark on the map  

**DeepSeek users:** get a key at [platform.deepseek.com](https://platform.deepseek.com/api_keys), choose DeepSeek, paste and save.

### 4. Single-postcode eligibility check

Enter a 4-digit Australian postcode to see which area categories it may match (quick pre-screen only).

---

## Feature overview

| Area | Features |
|------|----------|
| Core | Batch marking, flexible input formats, custom list name, copy list name |
| Eligibility | Single check, batch summary, category quick-fill + work guidance |
| AI | Town recommendations, local/online engines, cache, one-click fill |
| UX | Progress, pause/resume, bilingual UI, side panel, no in-app ads |

---

## FAQ

1. **Marking does nothing** — Confirm Google Maps tab, signed in, list name exact match; refresh and retry  
2. **AI failed, fell back to local** — Rate limit or Worker not configured; local engine still gives results with a red banner  
3. **Eligibility differs from official list** — Built-in rules may lag; verify Home Affairs before lodging  
4. **Permissions** — `storage` saves settings locally only; `scripting` runs only on Google Maps  

---

## Support the author · Donations

This extension is **free**, with **no ads or tracking**. If it helps your WHV planning, voluntary tips support maintenance and AI server costs.

- 📖 More guides: [Jessie’s WHV hub](https://www.jessieontheroad.com/zh/whv/)

### WeChat Pay

Open WeChat → **Scan** → scan the QR below → enter amount (optional note: “WHV extension”).

<p align="center">
  <img src="build/images/donate-qr.jpg" alt="WeChat Pay QR code" width="240" />
</p>

### Alipay

Open Alipay → **Scan** → scan the QR below → enter amount (optional note: “WHV extension”).

<p align="center">
  <img src="build/images/donate-zfb.jpg" alt="Alipay QR code" width="240" />
</p>

> Tips are entirely voluntary and do not affect any feature. Thank you ☕

---

## Contributing · License

Issues and pull requests welcome. License: [MIT](https://choosealicense.com/licenses/mit/)
