# LLMGuard 🛡️

**API Key Protection for LLM Web Interfaces**  
*Real-time detection and blocking of secrets in your AI chats—prevent leaks before they happen.*


## 🚀 Why LLMGuard?
In the rush of AI brainstorming, it's easy to accidentally paste an API key or secret into ChatGPT or Gemini—**boom, your creds are in a prompt, potentially logged forever**. LLMGuard scans your input *as you type/paste* on popular LLM sites, blocks risky content with a non-intrusive overlay, and logs everything for review. Built for devs, by a dev .

- **Zero Setup**: Install and forget—works out-of-the-box.
- **Privacy-First**: All data local (no cloud sync).
- **Open Source**: Audit the code; contribute patterns!

## ✨ Features
- **Real-Time Scanning**: Detects **85+ secret types** (API keys, tokens, DB strings, private keys) via regex — up from 30 in v2.
- **Gitleaks-Powered Patterns**: Automatically synced from the battle-tested [gitleaks](https://github.com/gitleaks/gitleaks) open-source ruleset used by security teams worldwide.
- **Smart Blocking**: Shadow DOM modal with severity badges — dismiss to block, override if safe.
- **Event Logging**: Tracks blocks/overrides with timestamps, previews.
- **Browser Badge**: Red count for quick alerts.
- **Popup Summary**: Instant stats (blocks, platforms) + recent list.
- **Full Dashboard**: Analytics — hourly charts, severity breakdowns, platform rankings, CSV export.
- **Targeted Sites**: ChatGPT, Gemini, Claude, Copilot, Perplexity, Poe, Hugging Face Chat.
- **Pattern Refresh CLI**: Run `node generate-patterns.js` anytime to pull the latest gitleaks rules — no manual regex work needed.
---

## 📋 Supported Secrets (85+ patterns)
 
### 🔴 Critical

| Service | Pattern | Example Prefix |
|---------|---------|----------------|
| OpenAI API Key | `sk-proj-...` | `sk-proj-` |
| Anthropic API Key | `sk-ant-api03-...` | `sk-ant-` |
| Anthropic Admin Key | `sk-ant-admin01-...` | `sk-ant-admin` |
| AWS Access Key | `AKIA...` / `ASIA...` | `AKIA` |
| Google / GCP API Key | `AIza...` | `AIza` |
| GitHub PAT (classic) | `ghp_...` | `ghp_` |
| GitHub Fine-grained PAT | `github_pat_...` | `github_pat_` |
| GitHub OAuth / App Token | `gho_` / `ghs_` | `gho_` |
| GitLab PAT | `glpat-...` | `glpat-` |
| GitLab Pipeline Token | `glptt-...` | `glptt-` |
| Stripe Secret (live/test) | `sk_live_...` / `sk_test_...` | `sk_live_` |
| Shopify Tokens (4 types) | `shpat_` / `shpca_` / `shppa_` / `shpss_` | `shpat_` |
| Slack Bot / App / User Token | `xoxb-` / `xapp-` / `xoxp-` | `xoxb-` |
| Razorpay Key | `rzp_live_...` | `rzp_live_` |
| MongoDB Connection String | `mongodb://user:pass@...` | `mongodb://` |
| PostgreSQL / MySQL URI | `postgresql://` / `mysql://` | `postgresql://` |
| RSA / EC / SSH Private Key | `-----BEGIN ... PRIVATE KEY-----` | `-----BEGIN` |
| Azure AD Client Secret | `...Q~...` pattern | — |
| DigitalOcean PAT / Token | `dop_v1_...` / `doo_v1_...` | `dop_v1_` |
| HashiCorp Vault Token | `hvs....` / `b.AAAAAQ...` | `hvs.` |
| PlanetScale Token | `pscale_tkn_...` | `pscale_` |
| Databricks Token | `dapi...` | `dapi` |
| Telegram Bot Token | `123456789:ABC...` | digit + `:` |
| Twilio API Key | `SK` + 32 hex chars | `SK` |
| Square Token | `sq0atp-...` | `sq0atp-` |
| Shippo Token | `shippo_live_...` | `shippo_` |
| Doppler Token | `dp.pt....` | `dp.pt.` |
| Dynatrace Token | `dt0c01....` | `dt0c01.` |
| Yandex API Key | `AQVN...` | `AQVN` |
| 1Password Secret Key | `A3-XXXXXX-...` | `A3-` |
 
### 🟠 High
 
| Service | Pattern |
|---------|---------|
| JWT Token | `eyJ...` |
| Grafana Tokens (3 types) | `glsa_` / `glc_` / `eyJr...` |
| Hugging Face Token | `hf_...` |
| npm Access Token | `npm_...` |
| Linear API Key | `lin_api_...` |
| Mailchimp API Key | `....-us12` |
| Postman API Token | `PMAK-...` |
| Sendinblue Token | `xkeysib-...` |
| PyPI Upload Token | `pypi-AgEI...` |
| Pulumi Token | `pul-...` |
| RubyGems Token | `rubygems_...` |
| Fly.io Token | `fo1_...` |
| Google OAuth Token | `ya29....` |
| Slack Webhook URL | `hooks.slack.com/services/...` |
| `.env` file content | `OPENAI_API_KEY=...` pattern |
| Generic secret in code | `api_key = "..."` pattern |
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


## 🤝 Contributing
- Add regex patterns? Edit `API_KEY_PATTERNS` in content.js.
- New sites? Update manifest.json matches/host_permissions.
- Ideas: ML-based false-positive filtering? Issue #1!


## 📄 License
MIT—use freely. © 2026 Sanket Taware.
