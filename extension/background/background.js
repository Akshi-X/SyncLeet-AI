// Background service worker. Phase 1: skeleton only.
// Later phases orchestrate the Accepted -> Gemini -> GitHub workflow here.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[LeetCode AI Sync] installed");
});

// Simple message router so content script and popup can talk to the worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ type: "PONG" });
    return;
  }

  if (message?.type === "SUBMISSION_ACCEPTED") {
    const submission = message.submission;
    // Phase 2: store the latest accepted submission so the popup can show it.
    // Phases 3-5 will kick off Gemini analysis + GitHub commit from here.
    chrome.storage.local.set({
      last_submission: submission,
      workflow_state: {
        problemNumber: submission.number,
        problemTitle: submission.title,
        status: "accepted",
        analysisStatus: "idle",
        githubStatus: "idle",
      },
    });
    console.log("[LeetCode AI Sync] stored accepted #" + submission.number, submission.title);
    sendResponse({ ok: true });
    return;
  }

  return true; // keep the channel open for async responses in later phases
});
