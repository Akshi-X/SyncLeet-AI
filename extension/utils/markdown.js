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
