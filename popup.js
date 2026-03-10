// LLM Guard — Popup Script
// Reads directly from chrome.storage.local (no background messaging)

const STORAGE_KEY = "llmguard_v2_events";

function load() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const events = data[STORAGE_KEY] || [];

    const blocked   = events.filter(e => e.type === "DETECTION_EVENT");
    const overrides = events.filter(e => e.type === "OVERRIDE_EVENT");
    const platforms = [...new Set(blocked.map(e => e.hostname).filter(Boolean))];

    document.getElementById("n-blocked").textContent   = blocked.length;
    document.getElementById("n-overrides").textContent = overrides.length;
    document.getElementById("n-platforms").textContent = platforms.length;

    const list = document.getElementById("event-list");

    if (events.length === 0) {
      list.innerHTML = '<div class="empty">No blocks yet — you\'re clean ✅</div>';
      return;
    }

    list.innerHTML = "";
    events.slice(0, 10).forEach(e => {
      const isOverride = e.type === "OVERRIDE_EVENT";
      const sev  = isOverride ? "override" : (e.detections?.[0]?.severity || "medium");
      const host = (e.hostname || "unknown").replace("www.", "");
      const key  = isOverride
        ? "⚠️ Override — user allowed paste"
        : (e.detections?.[0]?.name || "Unknown");
      const extra = (e.detections?.length > 1) ? ` +${e.detections.length - 1}` : "";
      const time  = new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const div = document.createElement("div");
      div.className = `ev ${sev}`;
      div.innerHTML = `
        <div class="ev-host">${host}</div>
        <div class="ev-key">${key}${extra}</div>
        <div class="ev-time">${time}</div>
      `;
      list.appendChild(div);
    });
  });
}

document.getElementById("btn-dash").addEventListener("click", () => {
  const url = chrome.runtime.getURL("dashboard.html");
  chrome.tabs.create({ url }, () => window.close());
});

document.getElementById("btn-clear").addEventListener("click", () => {
  chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
    chrome.action.setBadgeText({ text: "" });
    load();
  });
});

load();
