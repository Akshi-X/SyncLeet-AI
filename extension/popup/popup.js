// Popup: shows GitHub/Gemini config status and the last accepted submission.
// Re-renders live when storage changes (e.g. a new submission lands).

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function render(data) {
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
}

document.getElementById("open-settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.local.get(null, render);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(null, render));
