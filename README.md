# SyncLeet-AI

A Chrome extension that automatically saves your **accepted** LeetCode solutions to GitHub, with an AI-generated explanation of the algorithm **you actually wrote** — including its real time and space complexity.

The goal is revision: look back months later and understand what *you* did, not the "optimal" textbook solution.

## What it does

When a submission is accepted, the extension:

1. Detects the **Accepted** result and pulls your exact submitted code + problem metadata.
2. Sends your code to **Gemini**, which explains *your* implementation (algorithm, steps, time/space complexity, key concept).
3. Commits everything to your GitHub repo as a single clean commit.

```
0001-two-sum/
├── solution.cpp      ← your code, exactly as submitted
├── explanation.md    ← AI explanation of your implementation
└── question.md       ← the problem statement
```

The repo `README.md` keeps a progress table (# · Problem · Difficulty · Language · Time · Space), updated on every solve.

## Install

1. Clone or download this repo.
2. Open `chrome://extensions` and turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the `extension/` folder.
4. Pin the extension (puzzle icon → pin **SyncLeet-AI**).

## Setup

Open the extension → **Settings** (gear icon).

### GitHub

- **Username** — your GitHub username.
- **Repository** — the repo name where solutions go (e.g. `leetcode-solutions`). Create it first (empty is fine). Just the name, not a URL.
- **Token** — a **fine-grained personal access token**:
  1. https://github.com/settings/personal-access-tokens/new
  2. **Repository access** → Only select repositories → your solutions repo.
  3. **Permissions → Contents → Read and write**.
  4. Generate, copy, paste into Settings.

### Gemini

- **API key** — create one at https://aistudio.google.com/app/apikey and paste it in.

Click **Save Settings**. The page validates both: you should see `✓ Connected with write access` and `✓ API key valid`.

## Usage

Solve a problem on LeetCode and submit. On **Accepted**, the extension analyzes and commits automatically. Open the popup to see the latest submission, its complexity, and a slide-in full explanation; **View on GitHub** opens the committed folder.

Preferences (in Settings) let you turn **Auto-analyze** and **Auto-commit** on/off.

## Notes

- **After reloading the extension, refresh your open LeetCode tab.** Chrome doesn't re-inject the content script into already-open tabs, so detection won't fire until you refresh.
- Re-submitting identical code is skipped (no duplicate commit); changed code produces an `Update #… ` commit.
- Premium-locked problems don't expose their statement, so `question.md` is skipped for those.
- The Gemini model is set in `extension/services/gemini.js` (`MODEL`) — change it if your API key has access to a different one.

## Security

Your GitHub token and Gemini API key are stored only in your browser's local extension storage and are never committed. This is a personal V1 — a public/production build should proxy API calls through a backend rather than storing keys client-side. Use the minimum token scope (Contents: Read and write on one repo).

## Tech

Manifest V3 · vanilla JS/HTML/CSS · GitHub REST (Git Data) API · Gemini API. No build step, no backend, no dependencies.
