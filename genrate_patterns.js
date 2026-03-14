#!/usr/bin/env node
// ============================================================
// LLM Guard — Pattern Generator
// Fetches gitleaks.toml and converts rules → generated-patterns.js
//
// Usage:
//   node generate-patterns.js
//
// Output:
//   generated-patterns.js  (import this in content.js)
// ============================================================

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const GITLEAKS_URL =
  "https://raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml";

const OUTPUT_FILE = path.join(__dirname, "generated-patterns.js");

// -------------------------------------------------------
// Severity mapping — based on rule id keywords
// -------------------------------------------------------
const CRITICAL_KEYWORDS = [
  "aws", "gcp", "azure", "google", "anthropic", "openai",
  "github", "gitlab", "stripe", "private-key", "rsa",
  "ssh", "mongodb", "postgres", "mysql", "database",
  "digitalocean", "heroku", "firebase", "sendgrid",
  "twilio", "jwt", "slack", "discord", "shopify",
  "razorpay", "paypal", "coinbase", "kraken", "databricks",
  "datadog", "cloudflare", "hashicorp", "terraform",
  "kubernetes", "doppler", "dynatrace", "artifactory",
  "jfrog", "1password", "age-secret",
];

const HIGH_KEYWORDS = [
  "token", "oauth", "access", "refresh", "session",
  "mailchimp", "mailgun", "hubspot", "intercom",
  "airtable", "algolia", "atlassian", "jira", "confluence",
  "bitbucket", "asana", "linear", "launchdarkly",
  "looker", "grafana", "codecov", "circleci",
  "npm", "pypi", "rubygems", "clojars",
];

function getSeverity(id, description) {
  const lower = (id + " " + description).toLowerCase();
  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) return "critical";
  }
  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) return "high";
  }
  return "medium";
}

// -------------------------------------------------------
// Minimal TOML parser — only handles [[rules]] blocks
// -------------------------------------------------------
function parseGitleaksToml(toml) {
  const rules = [];
  
  // Split into [[rules]] sections
  const sections = toml.split(/^\[\[rules\]\]/m);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    
    // Stop at next top-level block (not [[rules.allowlists]])
    const body = section.split(/^\[(?!\[rules\.)/m)[0];

    // Extract id
    const idMatch = body.match(/^id\s*=\s*['"]([^'"]+)['"]/m);
    if (!idMatch) continue;
    const id = idMatch[1];

    // Extract description
    const descMatch = body.match(/^description\s*=\s*['"]([^'"]+)['"]/m);
    const description = descMatch ? descMatch[1] : id;

    // Extract regex — handles both ''' and " delimiters
    let regexStr = null;

    // Triple-single-quote (raw TOML string)
    const tripleMatch = body.match(/^regex\s*=\s*'''([\s\S]*?)'''/m);
    if (tripleMatch) {
      regexStr = tripleMatch[1];
    } else {
      // Regular double-quoted string
      const dqMatch = body.match(/^regex\s*=\s*"((?:[^"\\]|\\.)*)"/m);
      if (dqMatch) {
        // Unescape basic TOML escape sequences
        regexStr = dqMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\\\/g, "\\")
          .replace(/\\"/g, '"');
      }
    }

    if (!regexStr) continue;

    rules.push({ id, description, regexStr });
  }

  return rules;
}

// -------------------------------------------------------
// Convert TOML regex string → JS RegExp (with safety check)
// -------------------------------------------------------
function toJSRegex(regexStr) {
  // TOML uses POSIX [:alnum:] etc — convert to JS equivalents
  let js = regexStr
    .replace(/\[\[:alnum:\]\]/g, "[a-zA-Z0-9]")
    .replace(/\[\[:alpha:\]\]/g, "[a-zA-Z]")
    .replace(/\[\[:digit:\]\]/g, "[0-9]")
    .replace(/\[\[:lower:\]\]/g, "[a-z]")
    .replace(/\[\[:upper:\]\]/g, "[A-Z]")
    .replace(/\[\[:space:\]\]/g, "\\s")
    .replace(/\[\[:print:\]\]/g, "\\x20-\\x7E")
    .replace(/\[\[:xdigit:\]\]/g, "a-fA-F0-9");

  // Gitleaks uses (?s:...) for dot-all — convert to [\s\S]
  js = js.replace(/\(\?s:([\s\S]*?)\)/g, (_, inner) =>
    "(" + inner.replace(/\./g, "[\\s\\S]") + ")"
  );
  js = js.replace(/\(\?s\.([\s\S]*?)\)/g, (_, inner) =>
    "(" + inner.replace(/\./g, "[\\s\\S]") + ")"
  );

  // Validate it actually compiles
  try {
    new RegExp(js, "i");
    return js;
  } catch (e) {
    // Try again without the problematic parts (named captures sometimes fail)
    try {
      const stripped = js.replace(/\(\?P?<\w+>/g, "(?:");
      new RegExp(stripped, "i");
      return stripped;
    } catch (e2) {
      return null; // skip this rule
    }
  }
}

// -------------------------------------------------------
// Fetch helper
// -------------------------------------------------------
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end",  () => resolve(data));
    }).on("error", reject);
  });
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------
async function main() {
  console.log("⬇️  Fetching gitleaks.toml ...");
  let toml;
  try {
    toml = await fetchURL(GITLEAKS_URL);
  } catch (e) {
    console.error("❌ Failed to fetch:", e.message);
    process.exit(1);
  }

  console.log("🔍 Parsing rules ...");
  const rawRules = parseGitleaksToml(toml);
  console.log(`   Found ${rawRules.length} raw rules`);

  const patterns = [];
  let skipped = 0;

  for (const rule of rawRules) {
    const jsRegex = toJSRegex(rule.regexStr);
    if (!jsRegex) {
      skipped++;
      continue;
    }
    const severity = getSeverity(rule.id, rule.description);
    patterns.push({
      name:     rule.description,
      id:       rule.id,
      regexStr: jsRegex,
      severity,
    });
  }

  console.log(`   ✅ Converted: ${patterns.length}  ⏭  Skipped (invalid regex): ${skipped}`);

  // -------------------------------------------------------
  // Write output file
  // -------------------------------------------------------
  const lines = [
    "// AUTO-GENERATED by generate-patterns.js — DO NOT EDIT MANUALLY",
    `// Source: ${GITLEAKS_URL}`,
    `// Generated: ${new Date().toUTCString()}`,
    `// Rules: ${patterns.length}`,
    "",
    "// eslint-disable-next-line no-unused-vars",
    "const GITLEAKS_PATTERNS = [",
  ];

  for (const p of patterns) {
    // Escape backslashes for embedding inside new RegExp(...)
    const escaped = p.regexStr.replace(/\\/g, "\\\\");
    lines.push(
      `  { name: ${JSON.stringify(p.name)}, id: ${JSON.stringify(p.id)}, ` +
      `regex: new RegExp(${JSON.stringify(p.regexStr)}, "i"), severity: "${p.severity}" },`
    );
  }

  lines.push("];", "");

  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), "utf8");
  console.log(`\n✅ Written → ${OUTPUT_FILE}`);
  console.log(`   ${patterns.length} patterns ready for LLM Guard\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
