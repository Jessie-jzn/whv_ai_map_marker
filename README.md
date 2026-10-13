# WHV Postcode Marker

<p align="center">
  <img src="build/images/icon_128.png" alt="WHV Postcode Marker" width="96" />
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="docs/images/popup-preview.png" alt="WHV Postcode Marker interface" width="720" />
</p>

A Chrome extension for Australian Working Holiday Visa planning. Save Australian postcodes to a chosen Google Maps list, check postcode eligibility, mark locations by category, and get AI-assisted town recommendations.

> Always verify postcode eligibility and visa policy with the latest information from the [Australian Department of Home Affairs](https://immi.homeaffairs.gov.au/). This extension supports planning only and does not provide legal or migration advice.

## Feature previews

<table>
  <tr>
    <th>Postcode tools</th>
    <th>Eligibility check</th>
    <th>AI WHV advice</th>
  </tr>
  <tr>
    <td><a href="docs/images/postcode-tools-preview.png"><img src="docs/images/postcode-tools-preview.png" alt="Google Maps list connection and postcode marking" width="280" /></a></td>
    <td><a href="docs/images/postcode-eligibility-preview.png"><img src="docs/images/postcode-eligibility-preview.png" alt="Postcode eligibility result for 2832" width="280" /></a></td>
    <td><a href="docs/images/ai-whv-advice-preview.png"><img src="docs/images/ai-whv-advice-preview.png" alt="AI WHV town recommendations" width="280" /></a></td>
  </tr>
</table>

## Features

- **Postcode tools**: Accept comma-separated values and ranges while preserving four-digit postcodes such as `0872`.
- **Google Maps list connection**: Save places to a user-created list by matching its exact name.
- **Eligibility checks**: Inspect one postcode or review category matches for a batch.
- **Category marking**: Fill postcodes for Remote, Northern, Regional, and other supported categories.
- **AI WHV advice**: Recommend towns from location, visa goal, industry preference, and transport needs, then send their postcodes to the marking tool.
- **Popup and side panel**: Use a compact popup or keep the extension open in Chrome's side panel.
- **English and Chinese UI**: Follow the browser language or select a language manually.

## Installation

Install from the Chrome Web Store when available. For local development:

```bash
git clone git@github.com:Jessie-jzn/whv_ai_map_marker.git
cd whv_ai_map_marker
npm test
```

Open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select the repository's `build/` directory.

## Usage

1. Sign in to [Google Maps](https://www.google.com/maps).
2. Open **Saved → Lists → New list** and create a list, for example, `Australia WHV List`.
3. Enter the exact same name under **Connect a Google Maps list** in the extension.
4. Enter postcodes or choose an eligibility category, then start marking.
5. Open the **AI WHV advice** tab when you want town recommendations.

The extension does not read or synchronize your Google Maps lists. It connects to a list by name, so the names in Google Maps and the extension must match exactly.

## Performance and reliability

- Waits for real Google Maps UI state instead of relying only on fixed delays.
- Applies timeouts to online AI requests and falls back when a provider fails.
- Reuses cached AI results for repeated requests.
- Serializes cache writes so concurrent extension contexts do not overwrite each other.
- Provides marking progress, pause/resume controls, and duplicate-run protection.

## Privacy

- List name, language, and AI settings stay in local browser storage.
- BYOK API keys are stored in `chrome.storage.local`.
- Local AI mode does not call an external model.
- Online models remain subject to their providers' privacy policies.

## Development

```bash
npm test
npm test --prefix worker
```

```text
build/
├── popup.html             Popup and side-panel page
├── animal-theme.css       Lightweight Animal Island theme
├── background.js          Extension background logic
└── src/
    ├── advisor/           AI recommendations, routing, and cache
    ├── eligibility/       Postcode parsing and eligibility rules
    ├── marking/           Google Maps marking workflow
    └── ui/                Tabs and UI initialization
worker/                    Online AI routing Worker
test/                      Node.js tests
```

## Support

- [Jessie's WHV guides](https://www.jessieontheroad.com/zh/whv/)
- Issues and pull requests are welcome.
- License: [MIT](https://choosealicense.com/licenses/mit/)

The extension is free and contains no in-app ads or tracking. Donations are optional and support ongoing maintenance and AI server costs.

<table>
  <tr>
    <th>WeChat</th>
    <th>Alipay</th>
  </tr>
  <tr>
    <td><img src="build/images/donate-qr.jpg" alt="WeChat donation QR code" width="220" /></td>
    <td><img src="build/images/donate-zfb.jpg" alt="Alipay donation QR code" width="220" /></td>
  </tr>
</table>
