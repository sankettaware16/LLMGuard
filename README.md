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

## 🔄 Keeping Patterns Updated
 
LLMGuard v3 ships with a CLI tool to refresh its pattern library from [gitleaks](https://github.com/gitleaks/gitleaks) — the same ruleset trusted by security teams at major companies.
 
```bash
# From your project folder
node generate-patterns.js
```
 
This fetches the latest `gitleaks.toml` from GitHub, converts all `[[rules]]` into JavaScript regexes, assigns severity levels, and writes `generated-patterns.js`. Copy the new `GITLEAKS_PATTERNS` array into `content.js` Section 2, then reload the extension.
 
**When to re-run:**
- A new AI provider launches (new token format)
- You see gitleaks added rules in their changelog
- Monthly as a routine hygiene step
 
---
 
## 🧪 Real-World Test Prompts
 
These are prompts a real developer, DevOps engineer, or founder would actually type into ChatGPT. Paste them to verify LLMGuard blocks correctly.
 
---
 
### 👨‍💻 Developer — "Help me debug my app"
 
> Hey, my Next.js app keeps throwing 401s on the OpenAI endpoint. Here's my `.env` — can you spot what's wrong?
>
> ```
> DATABASE_URL=postgresql://admin:Xk9#mP2$vL5@prod-db.cluster.aws.com:5432/myapp_prod
> OPENAI_API_KEY=sk-proj-xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8qT3Bl
> ANTHROPIC_API_KEY=sk-ant-api03-xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8AA
> STRIPE_SECRET_KEY=sk_live_51NxK9mP2vL5nR8qT3Blbk
> NEXTAUTH_SECRET=xK9mP2vL5nR8qT3BlbkFJ2024prodSecret
> ```
>
> **Expected:** Should block `OpenAI API Key`, `Anthropic API Key`, `Stripe Secret`, `PostgreSQL Connection String`
 
---
 
### ☁️ DevOps — "Fix my AWS deployment script"
 
> My GitHub Actions pipeline is failing on the AWS deploy step. Here's the relevant config — what am I doing wrong?
>
> ```yaml
> env:
>   AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
>   AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
>   AWS_REGION: ap-south-1
>   GITHUB_TOKEN: ghp_xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8q
>   SLACK_NOTIFY_TOKEN: xoxb-123456789012-123456789012-xK9mP2vL5nR8qT3Blbk
> ```
>
> **Expected:** Should block `AWS Access Key`, `GitHub PAT`, `Slack Bot Token`
 
---
 
### 🛍️ Startup Founder — "Help me set up Shopify + Razorpay"
 
> We're building an India-first e-commerce app. Can you write me a Node.js webhook handler? Here are my keys:
>
> ```
> SHOPIFY_ACCESS_TOKEN=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
> SHOPIFY_SHARED_SECRET=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
> RAZORPAY_KEY_ID=rzp_live_xK9mP2vL5nR8qT
> RAZORPAY_SECRET=xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5
> TELEGRAM_BOT_TOKEN=987654321:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
> ```
>
> **Expected:** Should block `Shopify Access Token`, `Shopify Shared Secret`, `Razorpay Key`, `Telegram Bot Token`
 
---
 
### 🔐 Security Engineer — "Review my auth implementation"
 
> Can you review my JWT auth middleware? Something feels off with the token validation.
>
> ```javascript
> const JWT_SECRET = "xK9mP2vL5nR8qT3BlbkFJ2024prodSecret";
> const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNhbmtldCIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
> const GITHUB_WEBHOOK_SECRET = "ghp_xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8q";
> ```
>
> **Expected:** Should block `JWT Token`, `GitHub PAT`, `Secret/API key in code`
 
---
 
### 📊 Data Engineer — "Help debug my database pipeline"
 
> Getting connection timeouts on my Databricks → MongoDB sync job. Here's my config:
>
> ```python
> DATABRICKS_TOKEN = "dapiabcdef1234567890abcdef1234567890"
> MONGODB_URI = "mongodb+srv://datauser:Xk9mP2vL5@cluster0.abcde.mongodb.net/analytics"
> POSTGRES_URL = "postgresql://etl_user:Xk9mP2vL5@warehouse.internal:5432/datamart"
> DOPPLER_TOKEN = "dp.pt.xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8qT3Blbk"
> ```
>
> **Expected:** Should block `Databricks API Token`, `MongoDB Connection String`, `PostgreSQL Connection String`, `Doppler API Token`
 
---
 
### 🤖 ML Engineer — "Deploy my HuggingFace model"
 
> I'm trying to push my fine-tuned model to HuggingFace Hub and deploy via Fly.io. Keep getting auth errors:
>
> ```bash
> export HF_TOKEN=hf_abcdefghijklmnopqrstuvwxyzabcdefgh
> export FLY_API_TOKEN=fo1_xK9mP2vL5nR8qT3BlbkFJxK9mP2vL5nR8qT3B
> export WANDB_API_KEY=abcdefghijklmnopqrstuvwxyz123456abcd
> npm_config_token=npm_A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5
> ```
>
> **Expected:** Should block `Hugging Face Token`, `Fly.io Access Token`, `npm Access Token`
 
---
 
### 🏗️ Platform Engineer — "HashiCorp Vault token not working"
 
> Our Vault service token stopped working after we rotated. Old config for reference:
>
> ```
> VAULT_TOKEN=hvs.AAAAAQabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab
> PULUMI_ACCESS_TOKEN=pul-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
> PLANETSCALE_TOKEN=pscale_tkn_a1B2c3D4e5F6a1B2c3D4e5F6a1B2c3D4e5F6
> DIGITALOCEAN_TOKEN=dop_v1_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
> ```
>
> **Expected:** Should block `HashiCorp Vault Service Token`, `Pulumi Token`, `PlanetScale Token`, `DigitalOcean PAT`
 
---


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
