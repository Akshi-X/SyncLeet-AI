// Background service worker — orchestrates the workflow.
// Phase 3: Accepted submission -> Gemini analysis. GitHub comes in Phase 4.

import { analyze } from "../services/gemini.js";
import { commitSolution } from "../services/github.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[LeetCode AI Sync] installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ type: "PONG" });
    return;
  }
  if (message?.type === "SUBMISSION_ACCEPTED") {
    handleAccepted(message.submission); // async, fire-and-forget; popup follows via storage
    sendResponse({ ok: true });
    return;
  }
  return true;
});

async function handleAccepted(submission) {
  await chrome.storage.local.set({ last_submission: submission, last_explanation: null });
  await setState(submission, "accepted");

  const { gemini_key, pref_analyze } = await chrome.storage.local.get(["gemini_key", "pref_analyze"]);
  if (pref_analyze === false) return;
  if (!gemini_key) {
    await setState(submission, "failed", "Configure Gemini in Settings.");
    return;
  }

  await setState(submission, "analyzing");
  let explanation;
  try {
    explanation = await analyze(submission, gemini_key);
    await chrome.storage.local.set({ last_explanation: explanation });
    await setState(submission, "analysis_complete");
    console.log("[LeetCode AI Sync] analysis complete #" + submission.number);
  } catch (e) {
    console.error("[LeetCode AI Sync] Gemini failed:", e);
    await setState(submission, "failed", e.message || "Could not generate explanation.");
    return;
  }

  await commitToGitHub(submission, explanation);
}

async function commitToGitHub(submission, explanation) {
  const { gh_username, gh_repo, gh_token, pref_commit } = await chrome.storage.local.get([
    "gh_username", "gh_repo", "gh_token", "pref_commit",
  ]);
  if (pref_commit === false) return;
  if (!gh_username || !gh_repo || !gh_token) {
    await setState(submission, "failed", "Configure GitHub in Settings.");
    return;
  }

  await setState(submission, "uploading");
  try {
    const result = await commitSolution(
      { owner: gh_username, repo: gh_repo, token: gh_token },
      submission,
      explanation
    );
    await chrome.storage.local.set({ github_url: result.url || null });
    await setState(submission, "completed", null, result);
    console.log("[LeetCode AI Sync]", result.skipped ? "skipped (unchanged)" : result.message);
  } catch (e) {
    console.error("[LeetCode AI Sync] GitHub failed:", e);
    await setState(submission, "failed", e.message || "GitHub upload failed. Your solution was not committed.");
  }
}

function setState(submission, status, error, result) {
  return chrome.storage.local.set({
    workflow_state: {
      problemNumber: submission.number,
      problemTitle: submission.title,
      status, // accepted | analyzing | analysis_complete | uploading | completed | failed
      error: error || null,
      result: result || null, // {skipped, updated, message, url} after a commit
    },
  });
}
