// ============================================================
// LLM GUARD v2 - Content Script
// All styles are INLINE - no external CSS dependency
// Overlay uses Shadow DOM to avoid host page CSS interference
// ============================================================

const API_KEY_PATTERNS = [
  { name: "OpenAI API Key",               regex: /sk-[a-zA-Z0-9\-_]{20,80}/,                          severity: "critical" },
  { name: "OpenAI Org ID",                regex: /org-[a-zA-Z0-9]{20,40}/,                            severity: "high"     },
  { name: "AWS Access Key ID",            regex: /AKIA[0-9A-Z]{16}/,                                   severity: "critical" },
  { name: "Google API Key",               regex: /AIza[0-9A-Za-z\-_]{35}/,                            severity: "critical" },
  { name: "Google OAuth Token",           regex: /ya29\.[0-9A-Za-z\-_]+/,                             severity: "critical" },
  { name: "GCP Service Account",          regex: /"type":\s*"service_account"/,                       severity: "critical" },
  { name: "Azure Storage Key",            regex: /AccountKey=[a-zA-Z0-9+\/=]{60,}/,                   severity: "critical" },
  { name: "GitHub PAT (classic)",         regex: /ghp_[a-zA-Z0-9]{36}/,                               severity: "critical" },
  { name: "GitHub OAuth Token",           regex: /gho_[a-zA-Z0-9]{36}/,                               severity: "critical" },
  { name: "GitHub App Token",             regex: /ghs_[a-zA-Z0-9]{36}/,                               severity: "critical" },
  { name: "GitHub Fine-grained Token",    regex: /github_pat_[a-zA-Z0-9_]{82}/,                       severity: "critical" },
  { name: "Anthropic API Key",            regex: /sk-ant-[a-zA-Z0-9\-_]{50,}/,                        severity: "critical" },
  { name: "Stripe Secret Key (live)",     regex: /sk_live_[0-9a-zA-Z]{24,}/,                          severity: "critical" },
  { name: "Stripe Secret Key (test)",     regex: /sk_test_[0-9a-zA-Z]{24,}/,                          severity: "high"     },
  { name: "Stripe Restricted Key",        regex: /rk_live_[0-9a-zA-Z]{24,}/,                          severity: "critical" },
  { name: "SendGrid API Key",             regex: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/,        severity: "critical" },
  { name: "Slack Bot Token",              regex: /xoxb-[0-9]{6,}-[0-9]{6,}-[a-zA-Z0-9]{24}/,          severity: "critical" },
  { name: "Slack User Token",             regex: /xoxp-[0-9]+-[0-9]+-[0-9]+-[a-zA-Z0-9]+/,            severity: "critical" },
  { name: "Slack Webhook URL",            regex: /hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+/,        severity: "high"     },
  { name: "Razorpay Key (India)",         regex: /rzp_(live|test)_[a-zA-Z0-9]{14}/,                   severity: "critical" },
  { name: "RSA Private Key",              regex: /-----BEGIN RSA PRIVATE KEY-----/,                    severity: "critical" },
  { name: "Private Key (PEM)",            regex: /-----BEGIN PRIVATE KEY-----/,                        severity: "critical" },
  { name: "EC Private Key",               regex: /-----BEGIN EC PRIVATE KEY-----/,                     severity: "critical" },
  { name: "SSH Private Key",              regex: /-----BEGIN OPENSSH PRIVATE KEY-----/,                severity: "critical" },
  { name: "JWT Token",                    regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, severity: "high" },
  { name: "Secret/API key in code",       regex: /(secret|api_key|apikey|api-key|auth_token|access_token)\s*[=:]\s*['"`][a-zA-Z0-9\-_\/+.]{12,}['"`]/i, severity: "high" },
  { name: "MongoDB Connection String",    regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/,                  severity: "critical" },
  { name: "PostgreSQL Connection String", regex: /postgresql?:\/\/[^:]+:[^@]+@/,                      severity: "critical" },
  { name: "MySQL Connection String",      regex: /mysql:\/\/[^:]+:[^@]+@/,                            severity: "critical" },
  { name: ".env file content",            regex: /^(OPENAI|AWS|STRIPE|SECRET|API_KEY|DATABASE_URL|TOKEN)[_A-Z]*\s*=\s*.{8,}$/m, severity: "high" },
];

// -------------------------------------------------------
// INLINE STYLES (Shadow DOM isolates from host page CSS)
// -------------------------------------------------------
const OVERLAY_CSS = `
  :host { all: initial; }
  
  #llmguard-root {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(6px);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeIn 0.18s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  .modal {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 14px;
    padding: 28px;
    max-width: 480px;
    width: calc(100% - 40px);
    box-shadow: 0 32px 80px rgba(0,0,0,0.7);
  }

  .header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-left: 16px;
    margin-bottom: 20px;
    border-left: 4px solid var(--accent, #ff3b3b);
  }

  .shield { font-size: 30px; line-height: 1; }

  .title {
    font-size: 17px;
    font-weight: 700;
    color: #f0f6fc;
    margin: 0 0 4px 0;
  }

  .subtitle {
    font-size: 13px;
    color: #8b949e;
    margin: 0;
  }

  .detections {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .det-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .badge {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.07em;
    padding: 3px 8px;
    border-radius: 4px;
    white-space: nowrap;
    text-transform: uppercase;
  }

  .badge-critical { background: rgba(255,59,59,0.18); color: #ff3b3b; border: 1px solid rgba(255,59,59,0.35); }
  .badge-high     { background: rgba(255,140,0,0.15);  color: #ff8c00; border: 1px solid rgba(255,140,0,0.3);  }
  .badge-medium   { background: rgba(240,192,64,0.12); color: #f0c040; border: 1px solid rgba(240,192,64,0.25);}

  .det-name { font-size: 13px; color: #cdd9e5; }

  .message {
    font-size: 13px;
    color: #6e7681;
    line-height: 1.65;
    margin-bottom: 22px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  button {
    padding: 9px 20px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: all 0.15s;
  }

  .btn-dismiss {
    background: #1f6feb;
    color: #fff;
  }
  .btn-dismiss:hover { background: #388bfd; }

  .btn-allow {
    background: transparent;
    color: #6e7681;
    border: 1px solid #30363d !important;
  }
  .btn-allow:hover { color: #ff8c00; border-color: #ff8c00 !important; }

  .footer {
    font-size: 11px;
    color: #30363d;
    margin-top: 16px;
    text-align: center;
  }
`;

const TOAST_CSS = `
  :host { all: initial; }
  #toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1c1400;
    border: 1px solid rgba(255,140,0,0.4);
    border-left: 3px solid #ff8c00;
    color: #ffc060;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 2147483646;
    max-width: 380px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.5);
    animation: slideIn 0.2s ease;
  }
  @keyframes slideIn {
    from { opacity:0; transform: translateY(10px); }
    to   { opacity:1; transform: translateY(0); }
  }
  button {
    background: none;
    border: none;
    color: #6e7681;
    cursor: pointer;
    font-size: 16px;
    margin-left: auto;
    padding: 0;
    line-height: 1;
  }
`;

// -------------------------------------------------------
// DETECTION
// -------------------------------------------------------
function detectAPIKeys(text) {
  const found = [];
  const seen = new Set();
  for (const p of API_KEY_PATTERNS) {
    if (p.regex.test(text) && !seen.has(p.name)) {
      seen.add(p.name);
      found.push({ name: p.name, severity: p.severity });
    }
  }
  return found;
}

// -------------------------------------------------------
// LOG TO BACKGROUND
// -------------------------------------------------------
function logEvent(type, detections, text) {
  try {
    chrome.runtime.sendMessage({
      type,
      data: {
        detections,
        url: window.location.href,
        hostname: window.location.hostname,
        timestamp: new Date().toISOString(),
        textPreview: text.substring(0, 120).replace(/\n/g, " ")
      }
    });
  } catch(e) {}
}

// -------------------------------------------------------
// SHADOW DOM OVERLAY — immune to host page CSS
// -------------------------------------------------------
function showBlockOverlay(detections, pendingText, targetEl) {
  // Remove existing
  const oldHost = document.getElementById("llmguard-shadow-host");
  if (oldHost) oldHost.remove();

  const topSeverity = detections.find(d => d.severity === "critical") ? "critical"
                    : detections.find(d => d.severity === "high")     ? "high"
                    : "medium";

  const accentColor = { critical: "#ff3b3b", high: "#ff8c00", medium: "#f0c040" }[topSeverity];

  // Create shadow host
  const host = document.createElement("div");
  host.id = "llmguard-shadow-host";
  host.style.cssText = "all:unset; position:fixed; top:0; left:0; z-index:2147483647;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = OVERLAY_CSS;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.id = "llmguard-root";
  root.style.setProperty("--accent", accentColor);

  root.innerHTML = `
    <div class="modal">
      <div class="header">
        <div class="shield">🛡️</div>
        <div>
          <div class="title">LLM Guard — Paste Blocked</div>
          <div class="subtitle">Sensitive credentials detected in your clipboard</div>
        </div>
      </div>

      <div class="detections">
        ${detections.map(d => `
          <div class="det-row">
            <span class="badge badge-${d.severity}">${d.severity}</span>
            <span class="det-name">${d.name}</span>
          </div>
        `).join("")}
      </div>

      <div class="message">
        This paste was blocked by your company security policy.<br>
        Please remove API keys, tokens, or credentials before sharing with an AI tool.
      </div>

      <div class="actions">
        <button class="btn-dismiss" id="lg-dismiss">Dismiss</button>
        <button class="btn-allow"   id="lg-allow">Allow Anyway (Override)</button>
      </div>

      <div class="footer">LLM Guard • This event has been logged for security review</div>
    </div>
  `;

  shadow.appendChild(root);

  // Dismiss
  shadow.getElementById("lg-dismiss").addEventListener("click", () => {
    host.remove();
  });

  // Override — actually insert the text into the target element
  shadow.getElementById("lg-allow").addEventListener("click", () => {
    host.remove();
    logEvent("OVERRIDE_EVENT", detections, pendingText);

    // Insert text into focused element
    if (targetEl) {
      targetEl.focus();
      // Try execCommand first (works on most inputs)
      try {
        document.execCommand("insertText", false, pendingText);
      } catch (e) {
        // Fallback: set value directly for plain inputs/textareas
        if (targetEl.tagName === "TEXTAREA" || targetEl.tagName === "INPUT") {
          const start = targetEl.selectionStart || 0;
          const end   = targetEl.selectionEnd   || 0;
          const val   = targetEl.value;
          targetEl.value = val.slice(0, start) + pendingText + val.slice(end);
          targetEl.selectionStart = targetEl.selectionEnd = start + pendingText.length;
        } else if (targetEl.isContentEditable) {
          const sel = window.getSelection();
          if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(pendingText));
            range.collapse(false);
          } else {
            targetEl.innerText += pendingText;
          }
        }
      }
      // Fire input event so the host app (ChatGPT etc.) picks up the change
      targetEl.dispatchEvent(new Event("input", { bubbles: true }));
      targetEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Click backdrop to dismiss
  root.addEventListener("click", (e) => {
    if (e.target === root) host.remove();
  });

  // Auto-dismiss after 20s
  setTimeout(() => { if (host.isConnected) host.remove(); }, 20000);
}

// -------------------------------------------------------
// TOAST (also Shadow DOM)
// -------------------------------------------------------
function showWarningToast(detections) {
  const oldHost = document.getElementById("llmguard-toast-host");
  if (oldHost) oldHost.remove();

  const host = document.createElement("div");
  host.id = "llmguard-toast-host";
  host.style.cssText = "all:unset; position:fixed; bottom:0; right:0; z-index:2147483646;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = TOAST_CSS;
  shadow.appendChild(style);

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.innerHTML = `
    <span>⚠️ LLM Guard: ${detections[0].name} detected in input. Remove before sending.</span>
    <button id="lg-close">✕</button>
  `;
  shadow.appendChild(toast);

  shadow.getElementById("lg-close").addEventListener("click", () => host.remove());
  setTimeout(() => { if (host.isConnected) host.remove(); }, 7000);
}

// -------------------------------------------------------
// PASTE INTERCEPTOR
// -------------------------------------------------------
function setupInterceptor() {
  document.addEventListener("paste", function(e) {
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!text || text.length < 6) return;

    const detections = detectAPIKeys(text);
    if (detections.length === 0) return;

    // Block the paste
    e.preventDefault();
    e.stopImmediatePropagation();

    // Log
    logEvent("DETECTION_EVENT", detections, text);

    // Show overlay — pass pendingText and targetEl for override
    showBlockOverlay(detections, text, e.target);

  }, true); // capture phase — runs before the page's own handlers

  // Typed input — soft warn only
  let inputTimer = null;
  document.addEventListener("input", function(e) {
    const el = e.target;
    if (!el) return;
    const value = el.value || el.innerText || el.textContent || "";
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      const detections = detectAPIKeys(value);
      if (detections.length > 0) {
        logEvent("DETECTION_EVENT", detections, value);
        showWarningToast(detections);
      }
    }, 1000);
  }, true);
}

setupInterceptor();
console.log("[LLM Guard v2] Active →", window.location.hostname);
