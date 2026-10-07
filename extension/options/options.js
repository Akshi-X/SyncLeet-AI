// Options page. Saves settings to chrome.storage.local.
// Secrets (token, Gemini key) are never re-displayed after saving: on load we
// only show a "saved" placeholder, and we only overwrite a stored secret when
// the user types a new value.

const SECRET_PLACEHOLDER = "•••••••• (saved)";

const fields = {
  gh_username: "gh-username",
  gh_repo: "gh-repo",
  pref_analyze: "pref-analyze",
  pref_commit: "pref-commit",
};
const secretFields = {
  gh_token: "gh-token",
  gemini_key: "gemini-key",
};

function load() {
  chrome.storage.local.get(null, (data) => {
    for (const [key, id] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el.type === "checkbox") {
        el.checked = data[key] !== false; // default ON
      } else if (data[key] != null) {
        el.value = data[key];
      }
    }
    for (const [key, id] of Object.entries(secretFields)) {
      if (data[key]) document.getElementById(id).placeholder = SECRET_PLACEHOLDER;
    }
  });
}

function save(event) {
  event.preventDefault();
  const toStore = {};
  for (const [key, id] of Object.entries(fields)) {
    const el = document.getElementById(id);
    toStore[key] = el.type === "checkbox" ? el.checked : el.value.trim();
  }
  for (const [key, id] of Object.entries(secretFields)) {
    const value = document.getElementById(id).value.trim();
    if (value) toStore[key] = value; // only overwrite when a new value is typed
  }
  chrome.storage.local.set(toStore, () => {
    document.getElementById("save-status").textContent = "Saved.";
    // clear typed secrets from the DOM and show the saved placeholder
    for (const id of Object.values(secretFields)) {
      const el = document.getElementById(id);
      if (el.value) {
        el.value = "";
        el.placeholder = SECRET_PLACEHOLDER;
      }
    }
    setTimeout(() => (document.getElementById("save-status").textContent = ""), 2000);
    // Validate against the real APIs so bad config is caught now, not mid-submit.
    chrome.storage.local.get(null, validateAll);
  });
}

function setCheck(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = text.startsWith("✓") ? "ok" : "error";
}

async function validateAll(d) {
  setCheck("gh-check", "Checking…");
  setCheck("gemini-check", "Checking…");
  setCheck("gh-check", await validateGitHub(d));
  setCheck("gemini-check", await validateGemini(d));
}

async function validateGitHub(d) {
  if (!d.gh_username || !d.gh_repo || !d.gh_token) return "✗ Fill in username, repository, and token";
  try {
    const res = await fetch(`https://api.github.com/repos/${d.gh_username}/${d.gh_repo}`, {
      headers: { Authorization: `token ${d.gh_token}`, Accept: "application/vnd.github+json" },
    });
    if (res.status === 200) {
      const repo = await res.json();
      return repo.permissions?.push
        ? "✓ Connected with write access"
        : "✗ Connected, but token lacks write access (needs Contents: Read and write)";
    }
    if (res.status === 404) return "✗ Repo not found, or token has no access to it";
    if (res.status === 401) return "✗ Invalid token";
    return `✗ GitHub error ${res.status}`;
  } catch {
    return "✗ Network error reaching GitHub";
  }
}

async function validateGemini(d) {
  if (!d.gemini_key) return "✗ Enter a Gemini API key";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(d.gemini_key)}`
    );
    return res.ok ? "✓ API key valid" : `✗ Invalid key (HTTP ${res.status})`;
  } catch {
    return "✗ Network error reaching Gemini";
  }
}

document.addEventListener("DOMContentLoaded", load);
document.getElementById("settings-form").addEventListener("submit", save);
