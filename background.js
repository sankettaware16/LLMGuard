// LLM Guard v2 — Background Service Worker

const STORAGE_KEY = "llmguard_v2_events";
const MAX_EVENTS  = 500;

// ── Message Router ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "DETECTION_EVENT" || msg.type === "OVERRIDE_EVENT") {
    storeEvent({ ...msg.data, type: msg.type }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "GET_EVENTS") {
    loadEvents().then(events => sendResponse({ events }));
    return true;
  }

  if (msg.type === "CLEAR_EVENTS") {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      updateBadge([]);
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "GET_STATS") {
    loadEvents().then(events => {
      sendResponse({ stats: buildStats(events) });
    });
    return true;
  }
});

// ── Store event ──────────────────────────────────────────────
async function storeEvent(event) {
  const events = await loadEvents();
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  await chrome.storage.local.set({ [STORAGE_KEY]: events });
  updateBadge(events);
}

// ── Load events ──────────────────────────────────────────────
function loadEvents() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, data => {
      resolve(data[STORAGE_KEY] || []);
    });
  });
}

// ── Badge ────────────────────────────────────────────────────
function updateBadge(events) {
  const count = events.filter(e => e.type === "DETECTION_EVENT").length;
  const text  = count > 0 ? (count > 99 ? "99+" : String(count)) : "";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: count > 0 ? "#ff3b3b" : "#22c55e" });
}

// ── Build stats object ───────────────────────────────────────
function buildStats(events) {
  const blocked   = events.filter(e => e.type === "DETECTION_EVENT");
  const overrides = events.filter(e => e.type === "OVERRIDE_EVENT");

  const byPlatform  = {};
  const bySeverity  = { critical: 0, high: 0, medium: 0 };
  const byKeyType   = {};

  blocked.forEach(e => {
    const h = e.hostname || "unknown";
    byPlatform[h] = (byPlatform[h] || 0) + 1;
    (e.detections || []).forEach(d => {
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      byKeyType[d.name]      = (byKeyType[d.name]      || 0) + 1;
    });
  });

  // Hourly buckets — last 12h
  const now = Date.now();
  const hourBuckets = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now - (11 - i) * 3600000).getHours(),
    count: 0
  }));
  blocked.forEach(e => {
    const ageH = Math.floor((now - new Date(e.timestamp).getTime()) / 3600000);
    if (ageH < 12) hourBuckets[11 - ageH].count++;
  });

  return {
    totalBlocked:   blocked.length,
    totalOverrides: overrides.length,
    byPlatform,
    bySeverity,
    byKeyType,
    hourBuckets,
    recentEvents: events.slice(0, 50)
  };
}

// Init badge on startup
loadEvents().then(updateBadge);
