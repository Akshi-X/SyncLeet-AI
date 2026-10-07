// --- README progress table (spec section 18) ---
// The repo README is the source of truth: we parse its existing rows, upsert
// the current one, and regenerate — so it survives across machines and manual
// edits without a separate local index.

const README_HEADER = "| # | Problem | Difficulty | Language | Time | Space |";
const README_SEP = "|---|---|---|---|---|---|";

// Returns data rows as arrays of 6 cell strings. Header/separator are skipped
// because their first cell ("#" / "---") isn't numeric.
export function parseReadmeRows(md) {
  const rows = [];
  for (const line of String(md || "").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.slice(1, t.endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim());
    if (cells.length === 6 && /^\d+$/.test(cells[0])) rows.push(cells);
  }
  return rows;
}

export function buildReadme(rows) {
  const sorted = [...rows].sort(
    (a, b) => Number(a[0]) - Number(b[0]) || a[3].localeCompare(b[3])
  );
  const body = sorted.map((c) => `| ${c.join(" | ")} |`).join("\n");
  return `# LeetCode Solutions

My LeetCode solutions with AI-generated explanations of my own implementations.

## Progress

${README_HEADER}
${README_SEP}
${body}
`;
}

// Problem statement -> question.md. The statement is LeetCode's HTML, which
// GitHub renders fine inside a .md file, so we keep it as-is under a heading.
export function buildQuestionMd(s) {
  return `# ${s.number}. ${s.title}

**Difficulty:** ${s.difficulty}

[View on LeetCode](${s.url})

${s.statement || "_Problem statement unavailable._"}
`;
}

// Builds explanation.md from a validated Gemini explanation (spec section 3).

export function buildExplanationMd(s, e) {
  const steps = e.steps.map((st, i) => `${i + 1}. ${st}`).join("\n");
  return `# ${s.title}

**Problem:** #${s.number}
**Difficulty:** ${s.difficulty}
**Language:** ${s.language}

## Algorithm

**${e.algorithm}**

${e.explanation}

## Step-by-step

${steps}

## Time Complexity

**${e.time_complexity}**

## Space Complexity

**${e.space_complexity}**

## Key Concept

${e.key_concept}
`;
}
