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
  });
}

document.addEventListener("DOMContentLoaded", load);
document.getElementById("settings-form").addEventListener("submit", save);
