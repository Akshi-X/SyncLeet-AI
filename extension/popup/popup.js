// Popup: shows GitHub/Gemini config status and the last accepted submission.
// Re-renders live when storage changes (e.g. a new submission lands).

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function render(data) {
  const ghButton = document.getElementById("open-github");
  const ghUrl = data.github_url;
  ghButton.disabled = !ghUrl;
  ghButton.onclick = ghUrl ? () => chrome.tabs.create({ url: ghUrl }) : null;

  const ghConfigured = !!(data.gh_username && data.gh_repo && data.gh_token);
  const geminiConfigured = !!data.gemini_key;
  document.getElementById("github-status").textContent =
    ghConfigured ? "● GitHub: configured" : "● GitHub: not configured";
  document.getElementById("gemini-status").textContent =
    geminiConfigured ? "● Gemini: configured" : "● Gemini: not configured";

  const box = document.getElementById("last-submission");
  const s = data.last_submission;
  if (s) {
    box.classList.remove("muted");
    box.innerHTML =
      `#${escapeHtml(s.number)} ${escapeHtml(s.title)}<br>` +
      `<span class="muted">${escapeHtml(s.difficulty || "")} · ${escapeHtml(s.language || "")}</span>`;
  } else {
    box.classList.add("muted");
    box.textContent = "None yet";
  }

  renderAnalysis(data.workflow_state, data.last_explanation);
}

const STATE_LABEL = {
  accepted: "Accepted — waiting",
  analyzing: "Analyzing with Gemini…",
  analysis_complete: "Analysis complete",
  uploading: "Committing to GitHub…",
};

function completedLabel(result) {
  if (result?.skipped) return "Already up to date (unchanged)";
  if (result?.updated) return "Updated on GitHub ✓";
  return "Committed to GitHub ✓";
}

function renderAnalysis(state, explanation) {
  const stateEl = document.getElementById("analysis-state");
  const block = document.getElementById("analysis");

  if (state?.status === "failed") {
    stateEl.textContent = state.error || "Failed.";
    stateEl.className = "error";
  } else if (state?.status === "completed") {
    stateEl.textContent = completedLabel(state.result);
    stateEl.className = "muted";
  } else {
    stateEl.textContent = state ? STATE_LABEL[state.status] || "—" : "—";
    stateEl.className = "muted";
  }

  if (explanation) {
    block.hidden = false;
    document.getElementById("an-algo").textContent = explanation.algorithm;
    document.getElementById("an-time").textContent = explanation.time_complexity;
    document.getElementById("an-space").textContent = explanation.space_complexity;
    document.getElementById("an-key").textContent = explanation.key_concept;
  } else {
    block.hidden = true;
  }
}

document.getElementById("open-settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.local.get(null, render);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(null, render));
