// Background service worker. Phase 1: skeleton only.
// Later phases orchestrate the Accepted -> Gemini -> GitHub workflow here.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[LeetCode AI Sync] installed");
});

// Simple message router so content script and popup can talk to the worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[LeetCode AI Sync] message:", message);
  if (message?.type === "PING") {
    sendResponse({ type: "PONG" });
  }
  return true; // keep the channel open for async responses in later phases
});
