// Prompt template + response schema for Gemini analysis.
// Kept here so the wording lives in one place (spec section 5).
//
// ponytail: the full problem statement body is NOT included — only title +
// code. Gemini analyzes the submitted implementation, which is what we have
// exactly. Add a GraphQL question(content) fetch if the statement proves needed.

export function buildPrompt(s) {
  return `You are analyzing a student's accepted LeetCode solution.

Analyze ONLY the submitted implementation.
Do not replace it with the optimal solution.

Determine:
1. What algorithm the student implemented.
2. How the algorithm works.
3. Step-by-step execution logic.
4. Time complexity based on the actual implementation.
5. Space complexity based on the actual implementation.
6. Main DSA concept used.

Be accurate about nested loops, recursion, sorting, hash tables, dynamic
programming, graph traversal, etc. If the implementation is not optimal, report
the complexity of the SUBMITTED implementation, not the optimal one. Explain in
beginner-friendly language.

Problem #${s.number}: ${s.title}
Difficulty: ${s.difficulty}
Language: ${s.language}

Submitted code:
\`\`\`${s.langSlug || ""}
${s.code}
\`\`\`

Return valid JSON with keys: algorithm, explanation, steps (array of strings),
time_complexity, space_complexity, key_concept.`;
}

// OpenAPI-subset schema the Gemini API enforces on the response.
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    algorithm: { type: "STRING" },
    explanation: { type: "STRING" },
    steps: { type: "ARRAY", items: { type: "STRING" } },
    time_complexity: { type: "STRING" },
    space_complexity: { type: "STRING" },
    key_concept: { type: "STRING" },
  },
  required: [
    "algorithm", "explanation", "steps",
    "time_complexity", "space_complexity", "key_concept",
  ],
};
