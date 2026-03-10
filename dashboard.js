// ── Constants ──────────────────────────────────────────────
const PLAT_META = {
  "chatgpt.com":              { icon:"🤖", name:"ChatGPT",      color:"#10a37f" },
  "chat.openai.com":          { icon:"🤖", name:"ChatGPT",      color:"#10a37f" },
  "gemini.google.com":        { icon:"✨", name:"Gemini",        color:"#4285f4" },
  "claude.ai":                { icon:"🔮", name:"Claude",        color:"#d97706" },
  "copilot.microsoft.com":    { icon:"💠", name:"Copilot",       color:"#0078d4" },
  "www.perplexity.ai":        { icon:"🔍", name:"Perplexity",    color:"#8957e5" },
  "perplexity.ai":            { icon:"🔍", name:"Perplexity",    color:"#8957e5" },
  "poe.com":                  { icon:"🌊", name:"Poe",           color:"#3b82f6" },
  "huggingface.co":           { icon:"🤗", name:"HuggingFace",   color:"#f5a623" },
};

const ALL_PLATFORMS = Object.keys(PLAT_META);

// ── State ─────────────────────────────────────────────────
let currentPage   = "overview";
let currentFilter = "all";
let stats         = null; // loaded from background

const STORAGE_KEY = "llmguard_v2_events";

// ── Load DIRECTLY from chrome.storage.local (bypasses background messaging) ──
function loadStats(cb) {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const events = data[STORAGE_KEY] || [];
    stats = buildStatsFromEvents(events);
    document.getElementById("sidebarCount").textContent = stats.totalBlocked;
    cb();
  });
}

function buildStatsFromEvents(events) {
  const blocked   = events.filter(e => e.type === "DETECTION_EVENT");
  const overrides = events.filter(e => e.type === "OVERRIDE_EVENT");
  const byPlatform = {}, bySeverity = { critical:0, high:0, medium:0 }, byKeyType = {};

  blocked.forEach(e => {
    const h = e.hostname || "unknown";
    byPlatform[h] = (byPlatform[h] || 0) + 1;
    (e.detections || []).forEach(d => {
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      byKeyType[d.name]      = (byKeyType[d.name]      || 0) + 1;
    });
  });

  const now = Date.now();
  const hourBuckets = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now - (11-i) * 3600000).getHours(),
    count: 0
  }));
  blocked.forEach(e => {
    const ageH = Math.floor((now - new Date(e.timestamp).getTime()) / 3600000);
    if (ageH < 12) hourBuckets[11 - ageH].count++;
  });

  return { totalBlocked: blocked.length, totalOverrides: overrides.length,
    byPlatform, bySeverity, byKeyType, hourBuckets, recentEvents: events.slice(0,100) };
}

function emptyStats() { return buildStatsFromEvents([]); }

// ── Navigation ─────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(el => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    el.classList.add("active");
    currentPage = el.dataset.page;
    render();
  });
});

// ── Top buttons ────────────────────────────────────────────
document.getElementById("btnRefresh").addEventListener("click", () => {
  loadStats(render);
});

document.getElementById("btnClear").addEventListener("click", () => {
  if (!confirm("Clear all event logs? This cannot be undone.")) return;
  chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
    chrome.action.setBadgeText({ text: "" }).catch(()=>{});
    loadStats(render);
  });
});

document.getElementById("btnExport").addEventListener("click", exportCSV);

// ── Render router ──────────────────────────────────────────
function render() {
  if      (currentPage === "overview")   renderOverview();
  else if (currentPage === "events")     renderEvents();
  else if (currentPage === "platforms")  renderPlatforms();
  else if (currentPage === "keytypes")   renderKeyTypes();
}

// ══════════════════════════════════════════════════════════
// OVERVIEW PAGE
// ══════════════════════════════════════════════════════════
function renderOverview() {
  const totalKeys = Object.values(stats.bySeverity).reduce((a,b)=>a+b,0);

  document.getElementById("main").innerHTML = `
    <div class="page-head">
      <div>
        <div class="page-title">Security Overview</div>
        <div class="page-sub">LLM data loss prevention — real-time monitoring</div>
      </div>
      <div class="mono" style="font-size:11px;color:var(--text3)">
        Updated: ${new Date().toLocaleTimeString()}
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card c1">
        <div class="s-icon">🚫</div>
        <div class="s-num" style="color:var(--red)">${stats.totalBlocked}</div>
        <div class="s-label">Pastes Blocked</div>
      </div>
      <div class="stat-card c2">
        <div class="s-icon">⚠️</div>
        <div class="s-num" style="color:var(--orange)">${stats.totalOverrides}</div>
        <div class="s-label">User Overrides</div>
      </div>
      <div class="stat-card c3">
        <div class="s-icon">🌐</div>
        <div class="s-num" style="color:var(--blue)">${Object.keys(stats.byPlatform).length}</div>
        <div class="s-label">Platforms Hit</div>
      </div>
      <div class="stat-card c4">
        <div class="s-icon">🔑</div>
        <div class="s-num" style="color:var(--green)">${totalKeys}</div>
        <div class="s-label">Keys Detected</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Blocks — Last 12 Hours</div>
            <div class="card-sub">Hourly detection frequency</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart" id="hourChart"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">Severity Breakdown</div>
        </div>
        <div class="card-body">
          <div class="bk-list" id="sevBreakdown"></div>
          <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
            <div class="card-title" style="margin-bottom:10px">Top Key Types</div>
            <div id="topKeyTypes"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Recent Events</div>
          <div class="card-sub">Last ${Math.min(stats.recentEvents.length,6)} detections</div>
        </div>
        <button class="btn btn-ghost" onclick="document.querySelector('[data-page=events]').click()">View All →</button>
      </div>
      <div style="overflow-x:auto">
        ${renderTable(stats.recentEvents.slice(0,6))}
      </div>
    </div>
  `;

  // Chart
  renderHourChart();

  // Severity
  const sevDiv = document.getElementById("sevBreakdown");
  const sevTotal = Object.values(stats.bySeverity).reduce((a,b)=>a+b,0) || 1;
  [
    {label:"Critical", key:"critical", color:"var(--red)"},
    {label:"High",     key:"high",     color:"var(--orange)"},
    {label:"Medium",   key:"medium",   color:"var(--yellow)"},
  ].forEach(s => {
    const cnt = stats.bySeverity[s.key] || 0;
    const pct = Math.round(cnt / sevTotal * 100);
    const d = document.createElement("div");
    d.innerHTML = `
      <div class="bk-row"><span class="bk-name">${s.label}</span><span class="bk-cnt">${cnt} (${pct}%)</span></div>
      <div class="bk-bg"><div class="bk-fill" style="width:${pct}%;background:${s.color}"></div></div>
    `;
    sevDiv.appendChild(d);
  });

  // Top key types
  const ktDiv = document.getElementById("topKeyTypes");
  const sorted = Object.entries(stats.byKeyType).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (sorted.length === 0) {
    ktDiv.innerHTML = '<div style="color:var(--text3);font-size:12px">No data yet</div>';
  } else {
    ktDiv.innerHTML = sorted.map(([name,cnt]) => `
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
        <span style="color:var(--text2)">${name}</span>
        <span class="mono" style="color:var(--red);font-weight:700">${cnt}</span>
      </div>
    `).join("");
  }
}

function renderHourChart() {
  const el = document.getElementById("hourChart");
  if (!el || !stats.hourBuckets) return;
  const max = Math.max(...stats.hourBuckets.map(b => b.count), 1);
  el.innerHTML = stats.hourBuckets.map(b => {
    const pct = (b.count / max) * 100;
    const color = b.count > 2 ? "var(--red)" : b.count > 0 ? "var(--orange)" : "var(--border2)";
    const h = b.label;
    const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h-12}p`;
    return `
      <div class="bar-wrap">
        <div class="bar" style="height:${Math.max(pct,3)}%;background:${color}">
          <div class="bar-tip">${b.count} event${b.count!==1?'s':''}</div>
        </div>
        <span class="bar-label">${label}</span>
      </div>
    `;
  }).join("");
}

// ══════════════════════════════════════════════════════════
// EVENT LOG PAGE
// ══════════════════════════════════════════════════════════
function renderEvents() {
  const filtered = filterEvents(stats.recentEvents, currentFilter);

  document.getElementById("main").innerHTML = `
    <div class="page-head">
      <div>
        <div class="page-title">Event Log</div>
        <div class="page-sub">${stats.recentEvents.length} total events stored</div>
      </div>
    </div>
    <div class="chips" id="filterChips"></div>
    <div class="card">
      <div style="overflow-x:auto">
        ${renderTable(filtered)}
      </div>
    </div>
  `;

  // Filter chips
  const chipDefs = [
    { label: "All Events",     key: "all"      },
    { label: "🔴 Critical",    key: "critical",  cls: "chip-red" },
    { label: "🟠 High",        key: "high",      cls: "chip-orange" },
    { label: "🟡 Medium",      key: "medium"    },
    { label: "⚠️ Overrides",   key: "override",  cls: "chip-purple" },
  ];
  const chipsEl = document.getElementById("filterChips");
  chipDefs.forEach(c => {
    const btn = document.createElement("button");
    btn.className = `chip ${c.cls||""} ${currentFilter===c.key?"active":""}`;
    btn.textContent = c.label;
    btn.addEventListener("click", () => {
      currentFilter = c.key;
      renderEvents();
    });
    chipsEl.appendChild(btn);
  });
}

function filterEvents(events, filter) {
  if (filter === "all")      return events;
  if (filter === "override") return events.filter(e => e.type === "OVERRIDE_EVENT");
  return events.filter(e =>
    e.type === "DETECTION_EVENT" &&
    (e.detections||[]).some(d => d.severity === filter)
  );
}

// ══════════════════════════════════════════════════════════
// PLATFORMS PAGE
// ══════════════════════════════════════════════════════════
function renderPlatforms() {
  document.getElementById("main").innerHTML = `
    <div class="page-head">
      <div>
        <div class="page-title">Platform Coverage</div>
        <div class="page-sub">Detection activity by LLM platform</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="card-head"><div class="card-title">All Monitored Platforms</div></div>
      <div class="card-body">
        <div class="plat-grid">
          ${ALL_PLATFORMS.map(key => {
            const p = PLAT_META[key];
            const cnt = stats.byPlatform[key] || 0;
            return `
              <div class="plat-card ${cnt>0?'has-events':''}">
                <div class="plat-emoji">${p.icon}</div>
                <div class="plat-name">${p.name}</div>
                <div class="plat-count ${cnt>0?'red':''}">${cnt}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">Platform Risk Ranking</div></div>
      <div class="card-body">
        ${Object.keys(stats.byPlatform).length === 0
          ? '<div style="color:var(--text3);font-size:13px;padding:10px 0">No data yet — make a test paste on any LLM platform.</div>'
          : `<div class="bk-list">
              ${Object.entries(stats.byPlatform).sort((a,b)=>b[1]-a[1]).map(([host,cnt]) => {
                const total = stats.totalBlocked || 1;
                const pct = Math.round(cnt/total*100);
                const p = PLAT_META[host] || { icon:"🌐", name: host, color: "#666" };
                return `
                  <div>
                    <div class="bk-row">
                      <span class="bk-name">${p.icon} ${p.name}</span>
                      <span class="bk-cnt">${cnt} blocks (${pct}%)</span>
                    </div>
                    <div class="bk-bg">
                      <div class="bk-fill" style="width:${pct}%;background:${p.color}"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>`
        }
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
// KEY TYPES PAGE
// ══════════════════════════════════════════════════════════
function renderKeyTypes() {
  const sorted = Object.entries(stats.byKeyType).sort((a,b)=>b[1]-a[1]);
  const total  = sorted.reduce((s,[,c])=>s+c,0) || 1;

  document.getElementById("main").innerHTML = `
    <div class="page-head">
      <div>
        <div class="page-title">Key Type Analysis</div>
        <div class="page-sub">What types of secrets were caught</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div class="card-title">Detected Secret Types</div>
        <div class="card-sub">${sorted.length} distinct type${sorted.length!==1?'s':''} found</div>
      </div>
      <div class="card-body">
        ${sorted.length === 0
          ? '<div style="color:var(--text3)">No detections yet.</div>'
          : `<div class="bk-list">
              ${sorted.map(([name,cnt]) => {
                const pct = Math.round(cnt/total*100);
                return `
                  <div>
                    <div class="bk-row">
                      <span class="bk-name">${name}</span>
                      <span class="bk-cnt">${cnt}×</span>
                    </div>
                    <div class="bk-bg">
                      <div class="bk-fill" style="width:${pct}%;background:var(--red)"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>`
        }
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
// SHARED TABLE RENDERER
// ══════════════════════════════════════════════════════════
function renderTable(events) {
  if (!events || events.length === 0) return `
    <div class="empty">
      <div class="empty-ico">✅</div>
      <div class="empty-text">No events here yet.<br>Trigger a test by pasting an API key into ChatGPT or Gemini.</div>
    </div>`;

  return `
    <table class="tbl">
      <thead>
        <tr>
          <th>Time</th>
          <th>Platform</th>
          <th>Detection</th>
          <th>Severity</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody>
        ${events.map(e => {
          const isOv  = e.type === "OVERRIDE_EVENT";
          const sev   = isOv ? "override" : (e.detections?.[0]?.severity || "medium");
          const host  = e.hostname || "unknown";
          const p     = PLAT_META[host] || { icon:"🌐", name: host, color:"#666" };
          const d0    = e.detections?.[0];
          const key   = isOv ? "Override — user bypassed block" : (d0?.name || "Unknown");
          const extra = (e.detections?.length > 1) ? ` <span style="color:var(--text3)">+${e.detections.length-1}</span>` : "";
          const t     = new Date(e.timestamp);
          const time  = t.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          const date  = t.toLocaleDateString([], {month:"short",day:"numeric"});
          const prev  = (e.textPreview||"").substring(0,60)+"…";

          return `
            <tr>
              <td>
                <div class="mono" style="font-size:12px">${time}</div>
                <div style="font-size:10px;color:var(--text3)">${date}</div>
              </td>
              <td>
                <div class="platform-tag">
                  <span class="pdot" style="background:${p.color}"></span>
                  ${p.icon} ${p.name}
                </div>
              </td>
              <td style="font-weight:600">${key}${extra}</td>
              <td><span class="badge ${sev}">${isOv?"OVERRIDE":sev.toUpperCase()}</span></td>
              <td><span class="preview-text">${prev}</span></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

// ══════════════════════════════════════════════════════════
// EXPORT CSV
// ══════════════════════════════════════════════════════════
function exportCSV() {
  if (!stats || stats.recentEvents.length === 0) {
    alert("No events to export.");
    return;
  }
  const rows = [["Timestamp","Type","Platform","Detections","Severity","Preview"]];
  stats.recentEvents.forEach(e => {
    rows.push([
      e.timestamp,
      e.type,
      e.hostname || "",
      (e.detections||[]).map(d=>d.name).join("; "),
      (e.detections||[]).map(d=>d.severity).join("; "),
      '"' + (e.textPreview||"").replace(/"/g,"'") + '"'
    ]);
  });
  const csv  = rows.map(r=>r.join(",")).join("\n");
  const url  = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  const a    = document.createElement("a");
  a.href = url; a.download = `llmguard-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════
loadStats(render);

// Auto-refresh every 10 seconds while tab is open
setInterval(() => loadStats(render), 10000);

// ALSO update instantly when storage changes (new detection fires)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    loadStats(render);
  }
});
