// Detects when a LeetCode submission is Accepted.
// Signal: LeetCode navigates to /problems/<slug>/submissions/<id>/ and renders
// a result element tagged data-e2e-locator="submission-result" containing the
// verdict text. We watch the DOM for that element reading "Accepted".
//
// ponytail: DOM + URL detection. If LeetCode changes the e2e-locator or stops
// putting the id in the URL, the upgrade path is a MAIN-world fetch/XHR
// interceptor reading the /submissions/detail/<id>/check/ response directly.

window.LCAIS = window.LCAIS || {};
window.LCAIS.SubmissionDetector = (function () {
  let lastHandled = null; // submission id we already reported (dedupe)
  let callback = null;

  function currentSubmissionId() {
    const m = location.pathname.match(/\/submissions\/(\d+)/);
    return m ? m[1] : null;
  }

  function isAccepted() {
    const el = document.querySelector('[data-e2e-locator="submission-result"]');
    return !!(el && /accepted/i.test(el.textContent));
  }

  function check() {
    if (!callback) return;
    const id = currentSubmissionId();
    if (!id || id === lastHandled) return;
    if (!isAccepted()) return;
    lastHandled = id;
    callback(id);
  }

  function onAccepted(cb) {
    callback = cb;
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check(); // in case the result is already on screen when we attach
  }

  return { onAccepted };
})();
