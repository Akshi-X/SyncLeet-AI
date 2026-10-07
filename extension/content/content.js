// Content script orchestrator. Phase 2: on an Accepted submission, pull the
// code + metadata and hand the result to the background worker. No Gemini/
// GitHub yet — that starts in Phase 3.

(function () {
  const { SubmissionDetector, ProblemParser, CodeExtractor } = window.LCAIS;

  console.log("[LeetCode AI Sync] content script loaded on", location.href);

  SubmissionDetector.onAccepted(async (submissionId) => {
    // If the extension was reloaded, this old content script is orphaned —
    // chrome.runtime is gone. Bail quietly; a page refresh reattaches a fresh one.
    if (!chrome.runtime?.id) return;
    try {
      const details = await CodeExtractor.fetchSubmission(submissionId);
      if (!details) {
        console.warn("[LeetCode AI Sync] no submission details for", submissionId);
        return;
      }
      const meta = ProblemParser.parse(details.question);
      const code = CodeExtractor.extract(details);

      // Problem statement is a nice-to-have — don't let a failure block the commit.
      let statement = "";
      try {
        statement = await CodeExtractor.fetchQuestionContent(meta?.slug);
      } catch (e) {
        console.warn("[LeetCode AI Sync] could not fetch problem statement:", e);
      }

      const submission = {
        submissionId,
        number: meta?.number,
        title: meta?.title,
        slug: meta?.slug,
        url: meta?.url,
        difficulty: meta?.difficulty,
        statement, // problem statement HTML (may be "")
        language: code.language,
        langSlug: code.langSlug,
        extension: code.extension,
        code: code.code,
        status: "accepted",
        detectedAt: Date.now(),
      };
      chrome.runtime.sendMessage({ type: "SUBMISSION_ACCEPTED", submission });
      console.log("[LeetCode AI Sync] extracted #" + submission.number, submission.title);
    } catch (e) {
      console.error("[LeetCode AI Sync] extraction failed:", e);
    }
  });
})();
