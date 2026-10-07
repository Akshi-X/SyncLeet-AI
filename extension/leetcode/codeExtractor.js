// Retrieves the exact submitted code + language for a submission id.
//
// Source: LeetCode's own GraphQL endpoint (submissionDetails). This is what the
// page itself uses, so it returns the code byte-for-byte as submitted. We avoid
// scraping the Monaco editor because it virtualizes rows — only visible lines
// exist in the DOM, so long solutions would be truncated.
//
// ponytail: single GraphQL read, isolated here. If the schema changes this is
// the one file to touch.

window.LCAIS = window.LCAIS || {};
window.LCAIS.CodeExtractor = (function () {
  // LeetCode lang.name slug -> source file extension.
  const EXT = {
    cpp: "cpp", c: "c", java: "java", python: "py", python3: "py",
    pythondata: "py", csharp: "cs", javascript: "js", typescript: "ts",
    ruby: "rb", swift: "swift", golang: "go", scala: "scala", kotlin: "kt",
    rust: "rs", php: "php", racket: "rkt", erlang: "erl", elixir: "ex",
    dart: "dart", mysql: "sql", mssql: "sql", oraclesql: "sql", bash: "sh",
  };

  const QUERY = `query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      lang { name verboseName }
      question { questionId questionFrontendId title titleSlug difficulty }
    }
  }`;

  function csrfToken() {
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : "";
  }

  async function fetchSubmission(submissionId) {
    const res = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrftoken": csrfToken(),
      },
      credentials: "include",
      body: JSON.stringify({
        operationName: "submissionDetails",
        query: QUERY,
        variables: { submissionId: Number(submissionId) },
      }),
    });
    if (!res.ok) throw new Error("GraphQL HTTP " + res.status);
    const json = await res.json();
    return json?.data?.submissionDetails || null;
  }

  function extract(details) {
    const slug = details?.lang?.name || "";
    return {
      language: details?.lang?.verboseName || slug, // display: "C++"
      langSlug: slug, // "cpp"
      extension: EXT[slug] || "txt",
      code: details?.code || "",
    };
  }

  return { fetchSubmission, extract };
})();
