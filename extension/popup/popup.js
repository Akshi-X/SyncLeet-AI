// Popup: renders config status + the last accepted submission and its analysis.
// Reads the same storage keys as before — only the presentation changed.

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function diffClass(d) {
  const x = String(d || "").toLowerCase();
  return x === "easy" ? "badge-easy" : x === "medium" ? "badge-medium" : x === "hard" ? "badge-hard" : "badge-lang";
}

function setStatusItem(id, ok, okText, offText) {
  const el = document.getElementById(id);
  el.classList.toggle("connected", ok);
  el.querySelector(".state-text").textContent = ok ? okText : offText;
}

let openGithub = null; // current github_url, or null

function render(data) {
  openGithub = data.github_url || null;
  document.getElementById("open-github").disabled = !openGithub;

  // Connection status
  setStatusItem("github-status", !!(data.gh_username && data.gh_repo && data.gh_token), "Connected", "Not connected");
  setStatusItem("gemini-status", !!data.gemini_key, "Configured", "Not configured");

  // Latest submission
  const box = document.getElementById("last-submission");
  const card = document.getElementById("submission-card");
  const s = data.last_submission;
  if (s) {
    box.classList.remove("empty");
    box.innerHTML =
      `<div class="submission-main">` +
        `<div class="sub-left">` +
          `<div class="sub-title"><span class="sub-num">#${escapeHtml(s.number)}</span>${escapeHtml(s.title)}</div>` +
          `<div class="sub-badges">` +
            `<span class="badge ${diffClass(s.difficulty)}">${escapeHtml(s.difficulty || "—")}</span>` +
            `<span class="badge badge-lang">${escapeHtml(s.language || "—")}</span>` +
          `</div>` +
        `</div>` +
        `<svg class="sub-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>` +
      `</div>`;
  } else {
    box.classList.add("empty");
    box.textContent = "No submissions yet";
  }
  // The card opens the committed folder when we have a URL.
  card.classList.toggle("clickable", !!openGithub);

  renderAnalysis(data.workflow_state, data.last_explanation);
}

const BADGE = {
  accepted: { cls: "", text: "Queued", spin: true },
  analyzing: { cls: "", text: "Analyzing", spin: true },
  analysis_complete: { cls: "", text: "Analyzed", spin: false },
  uploading: { cls: "", text: "Committing", spin: true },
};

function completedText(result) {
  if (result?.skipped) return "✓ Up to date";
  if (result?.updated) return "✓ Updated on GitHub";
  return "✓ Committed to GitHub";
}

function renderAnalysis(state, explanation) {
  const badge = document.getElementById("analysis-state");
  const errEl = document.getElementById("analysis-error");
  const block = document.getElementById("analysis");
  const status = state?.status;

  // Status badge
  let cfg = null;
  if (status === "completed") cfg = { cls: "success", text: completedText(state.result), spin: false };
  else if (status === "failed") cfg = { cls: "error", text: "Failed", spin: false };
  else if (status && BADGE[status]) cfg = BADGE[status];

  if (cfg) {
    badge.hidden = false;
    badge.className = `status-badge ${cfg.cls}`.trim();
    badge.innerHTML = (cfg.spin ? '<span class="spinner"></span>' : "") + escapeHtml(cfg.text);
  } else {
    badge.hidden = true;
  }

  // Error line (only on failure)
  if (status === "failed" && state.error) {
    errEl.hidden = false;
    errEl.textContent = state.error;
  } else {
    errEl.hidden = true;
  }

  // Complexity + explanation (shown whenever we have an analysis, even if the
  // GitHub step later failed)
  if (explanation) {
    block.hidden = false;
    // Cards show ONLY the Big-O — Gemini often packs the full reasoning into
    // these fields, so we extract the notation and keep the prose for the panel.
    document.getElementById("an-algo").textContent = explanation.algorithm;
    document.getElementById("an-time").textContent = bigO(explanation.time_complexity);
    document.getElementById("an-space").textContent = bigO(explanation.space_complexity);
    document.getElementById("an-key").textContent = explanation.key_concept;

    // Full detail lives in the slide-in sheet.
    document.getElementById("sx-algo").textContent = explanation.algorithm || "";
    document.getElementById("sx-explanation").textContent = explanation.explanation || "";
    document.getElementById("sx-time").textContent = explanation.time_complexity || "";
    document.getElementById("sx-space").textContent = explanation.space_complexity || "";
    document.getElementById("sx-key").textContent = explanation.key_concept || "";
    document.getElementById("sx-steps").innerHTML =
      (explanation.steps || []).map((st) => `<li>${escapeHtml(st)}</li>`).join("");
  } else {
    block.hidden = true;
  }
}

// Pull the Big-O notation out of a possibly-verbose complexity string.
function bigO(s) {
  const str = String(s || "");
  const m = str.match(/O\s*\([^)]*\)/i);
  if (m) return m[0].replace(/\s+/g, " ").trim();
  return str.split(/[,.;–-]/)[0].trim().slice(0, 14) || "—";
}

// --- wiring ---

document.querySelectorAll(".js-settings").forEach((el) =>
  el.addEventListener("click", () => chrome.runtime.openOptionsPage())
);

document.getElementById("open-github").addEventListener("click", () => {
  if (openGithub) chrome.tabs.create({ url: openGithub });
});

const submissionCard = document.getElementById("submission-card");
submissionCard.addEventListener("click", () => {
  if (openGithub) chrome.tabs.create({ url: openGithub });
});
submissionCard.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && openGithub) {
    e.preventDefault();
    chrome.tabs.create({ url: openGithub });
  }
});

// Slide-in explanation sheet
const sheet = document.getElementById("explain-sheet");
function openSheet() {
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  document.getElementById("explain-close").focus();
}
function closeSheet() {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  document.getElementById("explain-open").focus();
}
document.getElementById("explain-open").addEventListener("click", openSheet);
document.getElementById("explain-close").addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheet.classList.contains("open")) closeSheet();
});

chrome.storage.local.get(null, render);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(null, render));
