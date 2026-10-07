// Parses problem metadata from a submissionDetails.question object
// (fetched by codeExtractor). Pure function — no DOM, no network.

window.LCAIS = window.LCAIS || {};
window.LCAIS.ProblemParser = (function () {
  function parse(question) {
    if (!question) return null;
    const slug = question.titleSlug;
    return {
      number: parseInt(question.questionFrontendId, 10),
      title: question.title,
      slug,
      url: `https://leetcode.com/problems/${slug}/`,
      difficulty: question.difficulty, // "Easy" | "Medium" | "Hard"
    };
  }

  return { parse };
})();
