// GitHub service: commits a solution + explanation.md as ONE commit using the
// Git Data API (tree -> commit -> ref). Handles create, update, empty repos,
// and skips a no-op when the submitted code is unchanged (spec section 9).

import { folderPath, solutionFileName } from "../utils/parser.js";
import { buildExplanationMd } from "../utils/markdown.js";

const API = "https://api.github.com";

export async function commitSolution(cfg, submission, explanation) {
  const branch = cfg.branch || (await getDefaultBranch(cfg));
  const folder = folderPath(submission);
  const solutionPath = `${folder}/${solutionFileName(submission)}`;
  const mdPath = `${folder}/explanation.md`;
  const md = buildExplanationMd(submission, explanation);

  const existing = await getFile(cfg, solutionPath, branch); // null if new
  const isUpdate = !!existing;
  if (isUpdate && existing.content === submission.code) {
    return { skipped: true, folder, branch }; // identical code — don't spam commits
  }

  const message = `${isUpdate ? "Update" : "Solve"} #${submission.number} - ${submission.title}`;
  await commitFiles(cfg, branch, message, [
    { path: solutionPath, content: submission.code },
    { path: mdPath, content: md },
  ]);

  return {
    skipped: false,
    updated: isUpdate,
    message,
    folder,
    branch,
    url: `https://github.com/${cfg.owner}/${cfg.repo}/tree/${branch}/${folder}`,
  };
}

// --- Git Data API plumbing ---

async function commitFiles(cfg, branch, message, files) {
  let base = await getRef(cfg, branch);
  if (!base) {
    // Empty repo: the Git Data API can't build a tree with no base commit.
    // Bootstrap one via the Contents API (works on empty repos), then proceed.
    await initRepo(cfg, branch);
    base = await getRef(cfg, branch);
  }

  const tree = files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content }));
  const newTree = await ghJson(cfg, "POST", `/git/trees`, { base_tree: base.treeSha, tree });
  const newCommit = await ghJson(cfg, "POST", `/git/commits`, {
    message,
    tree: newTree.sha,
    parents: [base.commitSha],
  });
  await ghJson(cfg, "PATCH", `/git/refs/heads/${branch}`, { sha: newCommit.sha });
}

async function initRepo(cfg, branch) {
  const readme = "# LeetCode Solutions\n\nMy LeetCode solutions with AI-generated explanations of my own implementations.\n";
  await ghJson(cfg, "PUT", "/contents/README.md", {
    message: "Initialize repository",
    content: toBase64(readme),
    branch,
  });
}

async function getDefaultBranch(cfg) {
  const repo = await ghJson(cfg, "GET", "");
  return repo.default_branch || "main";
}

async function getRef(cfg, branch) {
  const res = await gh(cfg, "GET", `/git/ref/heads/${branch}`);
  if (res.status === 404 || res.status === 409) return null; // empty repo
  if (!res.ok) throw await ghError(res);
  const ref = await res.json();
  const commit = await ghJson(cfg, "GET", `/git/commits/${ref.object.sha}`);
  return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
}

async function getFile(cfg, path, branch) {
  const res = await gh(cfg, "GET", `/contents/${path}?ref=${branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw await ghError(res);
  const json = await res.json();
  return { sha: json.sha, content: fromBase64(json.content) };
}

function gh(cfg, method, path, body) {
  return fetch(`${API}/repos/${cfg.owner}/${cfg.repo}${path}`, {
    method,
    headers: {
      Authorization: `token ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function ghJson(cfg, method, path, body) {
  const res = await gh(cfg, method, path, body);
  if (!res.ok) throw await ghError(res);
  return res.json();
}

async function ghError(res) {
  const text = await res.text().catch(() => "");
  return new Error(`GitHub request failed (HTTP ${res.status}). ${text.slice(0, 200)}`);
}

function fromBase64(b64) {
  const bin = atob(String(b64).replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str); // UTF-8 safe, unlike raw btoa
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
