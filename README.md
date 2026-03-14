# LLMGuard 🛡️

**API Key Protection for LLM Web Interfaces**  
*Real-time detection and blocking of secrets in your AI chats—prevent leaks before they happen.*


## 🚀 Why LLMGuard?
In the rush of AI brainstorming, it's easy to accidentally paste an API key or secret into ChatGPT or Gemini—**boom, your creds are in a prompt, potentially logged forever**. LLMGuard scans your input *as you type/paste* on popular LLM sites, blocks risky content with a non-intrusive overlay, and logs everything for review. Built for devs, by a dev .

- **Zero Setup**: Install and forget—works out-of-the-box.
- **Privacy-First**: All data local (no cloud sync).
- **Open Source**: Audit the code; contribute patterns!

## ✨ Features
- **Real-Time Scanning**: Detects 30+ secret types (API keys, tokens, DB strings) via regex.
- **Smart Blocking**: Shadow DOM modal with severity badges—dismiss to block, override if safe.
- **Event Logging**: Tracks blocks/overrides with timestamps, previews.
- **Browser Badge**: Red count for quick alerts.
- **Popup Summary**: Instant stats (blocks, platforms) + recent list.
- **Full Dashboard**: Analytics—hourly charts, severity breakdowns, platform rankings, CSV export.
- **Targeted Sites**: ChatGPT, Gemini, Claude, Copilot, Perplexity, Poe, Hugging Face Chat.

## 📋 Supported Secrets
| Name | Example Pattern | Severity |
|------|-----------------|----------|
| OpenAI API Key | `sk-proj-...` | Critical |
| AWS Access Key | `AKIA...` | Critical |
| Google API Key | `AIza...` | Critical |
| GitHub PAT | `ghp_...` | Critical |
| Stripe Secret | `sk_live_...` | Critical |
| Anthropic API Key | `sk-ant-...` | Critical |
| Razorpay Key | `rzp_live_...` | Critical |
| JWT Token | `eyJ...` | High |
| MongoDB URI | `mongodb://user:pass@...` | Critical |
| RSA Private Key | `-----BEGIN RSA PRIVATE KEY-----` | Critical |
| ... (27 more) | See [patterns in code](https://github.com/sankettaware16/LLMGuard/blob/main/content.js) | Varies |

*Custom patterns? PRs welcome!*

## 🔧 How It Works
1. **Injection**: Content script loads on LLM sites, watches input fields.
2. **Detection**: Scans text against regex patterns; flags matches.
3. **Block**: If risky, overlays a modal (isolated via Shadow DOM—no site CSS conflicts).
4. **Log**: Events stored locally; background worker updates badge/stats.
5. **Review**: Popup for quick view; dashboard for deep dives (e.g., "80% blocks on ChatGPT").

Under the hood: Vanilla JS, Manifest v3, chrome.storage.local. No deps, <50KB.

## 🛠️ Installation
1. Clone: `git clone https://github.com/sankettaware16/LLMGuard.git`
2. Open Chrome → `chrome://extensions/`
   Open Brave → `Brave://extensions/`
3. Enable "Developer mode" → "Load unpacked" → Select the repo folder.
4. Test: Go to ChatGPT, paste a fake key like `sk-test-abc123`—watch it block!


## 📊 Dashboard Walkthrough
- **Overview**: Total blocks, hourly trends, top key types.
- **Events**: Filterable log (critical/high, overrides).
- **Platforms**: Risk ranking with icons.
- **Key Types**: Frequency analysis.

## 📸 Screenshots

### 🛡️ Paste Blocked — Credential Detected
![LLM Guard blocking a paste with JWT and API key detected](assets/screenshots/block-modal.png)

### 📋 Event Log — Full Audit Trail
![LLM Guard dashboard showing 20 blocked events across ChatGPT](assets/screenshots/eventlog.png)

### 🔑 Key Type Analysis — What's Being Caught
![LLM Guard key type breakdown showing 20 distinct secret types](assets/screenshots/key-types.png)
```

## 🤝 Contributing
- Add regex patterns? Edit `API_KEY_PATTERNS` in content.js.
- New sites? Update manifest.json matches/host_permissions.
- Ideas: ML-based false-positive filtering? Issue #1!


## 📄 License
MIT—use freely. © 2026 Sanket Taware.
