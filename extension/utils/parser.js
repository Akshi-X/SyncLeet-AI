// Folder + file naming for the solutions repo (spec section 6/7).

export function folderPath(s) {
  const padded = String(s.number).padStart(4, "0"); // 1 -> 0001, 1000 -> 1000
  const slug = s.slug || slugify(s.title);
  return `${padded}-${slug}`;
}

export function solutionFileName(s) {
  return `solution.${s.extension || "txt"}`;
}

// Fallback when LeetCode's own titleSlug isn't available.
export function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
