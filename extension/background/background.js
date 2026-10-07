// Background service worker — orchestrates the workflow.
// Phase 3: Accepted submission -> Gemini analysis. GitHub comes in Phase 4.

import { analyze } from "../services/gemini.js";

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
  try {
    const explanation = await analyze(submission, gemini_key);
    await chrome.storage.local.set({ last_explanation: explanation });
    await setState(submission, "analysis_complete");
    console.log("[LeetCode AI Sync] analysis complete #" + submission.number);
    // Phase 4+: trigger GitHub commit here.
  } catch (e) {
    console.error("[LeetCode AI Sync] Gemini failed:", e);
    await setState(submission, "failed", e.message || "Could not generate explanation.");
  }
}

function setState(submission, status, error) {
  return chrome.storage.local.set({
    workflow_state: {
      problemNumber: submission.number,
      problemTitle: submission.title,
      status, // accepted | analyzing | analysis_complete | failed
      error: error || null,
    },
  });
}
