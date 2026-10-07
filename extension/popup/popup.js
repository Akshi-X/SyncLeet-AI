// Popup logic. Phase 1: wire up the Settings button and verify the worker
// is reachable. Real status/last-submission data arrives in later phases.

document.getElementById("open-settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Sanity check that the background service worker is alive.
chrome.runtime.sendMessage({ type: "PING" }, (response) => {
  if (chrome.runtime.lastError) {
    console.warn("[LeetCode AI Sync] worker not reachable:", chrome.runtime.lastError.message);
    return;
  }
  console.log("[LeetCode AI Sync] worker says:", response);
});
