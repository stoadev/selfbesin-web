import type { Food } from "../types";

export function buildSearchTerm(food: Food, currentQuery?: string): string {
  // display_name zaten brand + qualifier + variety + isim bileşiğidir.
  const full = food.display_name?.trim() || "";

  if (!currentQuery || !currentQuery.trim()) {
    return full;
  }

  const words = full.split(/\s+/).filter(Boolean);
  const queryWords = currentQuery.toLocaleLowerCase("tr").trim().split(/\s+/);
  const usedQueryIndices = new Set<number>();

  const matched: { val: string; matchIdx: number }[] = [];
  const unmatched: string[] = [];

  words.forEach((w) => {
    const wl = w.toLocaleLowerCase("tr");

    let firstMatchIdx = -1;
    for (let i = 0; i < queryWords.length; i++) {
      if (usedQueryIndices.has(i)) continue;
      const qw = queryWords[i];
      const isMatch =
        wl === qw ||
        wl.startsWith(qw) ||
        (qw.length <= 2 && wl.startsWith(qw));
      if (isMatch) {
        firstMatchIdx = i;
        break;
      }
    }

    if (firstMatchIdx !== -1) {
      usedQueryIndices.add(firstMatchIdx);
      matched.push({ val: w, matchIdx: firstMatchIdx });
    } else {
      unmatched.push(w);
    }
  });

  matched.sort((a, b) => a.matchIdx - b.matchIdx);

  return [...matched.map((m) => m.val), ...unmatched].join(" ");
}
