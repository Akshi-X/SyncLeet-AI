// Gemini service: turns a submission into a validated explanation object.
// Uses structured output (responseSchema) so Gemini returns JSON directly, and
// still validates + retries once in case it returns malformed content anyway.

import { buildPrompt, RESPONSE_SCHEMA } from "../prompts/explanation-prompt.js";

const MODEL = "gemini-flash-lite-latest"; // change here if you want a different model
const endpoint = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

const STRING_FIELDS = ["algorithm", "explanation", "time_complexity", "space_complexity", "key_concept"];

export async function analyze(submission, apiKey) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callGemini(submission, apiKey); // HTTP errors throw out (no retry — real failure)
    try {
      const parsed = JSON.parse(text);
      validate(parsed);
      return normalize(parsed);
    } catch (e) {
      console.warn(`[LeetCode AI Sync] Gemini attempt ${attempt} invalid: ${e.message}`);
    }
  }
  throw new Error("Gemini returned an invalid explanation format.");
}

const TRANSIENT = new Set([429, 500, 502, 503, 504]); // overloaded / rate-limited — worth retrying
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(submission, apiKey) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(submission) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const MAX = 5;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    const res = await fetch(endpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned an empty response.");
      return text;
    }
    if (TRANSIENT.has(res.status) && attempt < MAX) {
      console.warn(`[LeetCode AI Sync] Gemini ${res.status}, retrying (${attempt}/${MAX - 1})…`);
      await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s, 4s, 8s
      continue;
    }
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (HTTP ${res.status}). ${detail.slice(0, 200)}`);
  }
}

function validate(o) {
  for (const k of STRING_FIELDS) {
    if (typeof o[k] !== "string" || !o[k].trim()) throw new Error(`missing field: ${k}`);
  }
  if (!Array.isArray(o.steps) || o.steps.length === 0 || !o.steps.every((s) => typeof s === "string")) {
    throw new Error("invalid steps");
  }
}

function normalize(o) {
  const out = {};
  for (const k of STRING_FIELDS) out[k] = o[k].trim();
  out.steps = o.steps.map((s) => s.trim()).filter(Boolean);
  return out;
}
