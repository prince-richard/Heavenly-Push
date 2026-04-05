/**
 * Text similarity utilities using Levenshtein distance.
 * Stub implementation — may be replaced by the data-layer agent.
 */

/**
 * Compute the Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows instead of full matrix for space efficiency
  let prevRow = new Array<number>(n + 1);
  let currRow = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        (currRow[j - 1] ?? 0) + 1, // insertion
        (prevRow[j] ?? 0) + 1, // deletion
        (prevRow[j - 1] ?? 0) + cost, // substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[n] ?? 0;
}

/**
 * Compute normalized similarity score between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function normalizedLevenshteinSimilarity(
  a: string,
  b: string,
): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}
