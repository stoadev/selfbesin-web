import type { Food } from "../types";

export function buildSearchTerm(food: Food, currentQuery?: string): string {
  const brand = food.brand && food.brand !== "Genel" ? food.brand : "";
  const name = food.name;

  const components: { type: string; val: string }[] = [];
  if (brand) components.push({ type: "brand", val: brand });
  if (food.qualifier && food.qualifier.length > 0) {
    food.qualifier.forEach((q) => {
      components.push({ type: "qualifier", val: q });
    });
  }
  components.push({ type: "name", val: name });

  if (currentQuery && currentQuery.trim()) {
    const q = currentQuery.toLocaleLowerCase("tr").trim();
    const queryWords = q.split(/\s+/);

    const matchedGroup: { type: string; val: string; matchIdx: number }[] = [];
    const unmatchedGroup: { type: string; val: string }[] = [];

    const priorityOrder: Record<string, number> = {
      name: 1,
      brand: 2,
      qualifier: 3,
    };
    const sortedComponents = [...components].sort(
      (a, b) => (priorityOrder[a.type] || 99) - (priorityOrder[b.type] || 99),
    );
    const usedQueryIndices = new Set<number>();

    sortedComponents.forEach((c) => {
      const valLower = c.val.toLocaleLowerCase("tr");
      const valWords = valLower.split(/\s+/);

      let firstMatchIdx = -1;
      for (let i = 0; i < queryWords.length; i++) {
        if (usedQueryIndices.has(i)) continue;
        const qw = queryWords[i];
        const isMatch =
          valWords.includes(qw) ||
          (qw.length <= 2 && valWords.some((vw) => vw.startsWith(qw)));
        if (isMatch) {
          firstMatchIdx = i;
          break;
        }
      }

      if (firstMatchIdx !== -1) {
        usedQueryIndices.add(firstMatchIdx);
        matchedGroup.push({ ...c, matchIdx: firstMatchIdx });
      } else {
        unmatchedGroup.push(c);
      }
    });

    matchedGroup.sort((a, b) => {
      if (a.matchIdx !== b.matchIdx) return a.matchIdx - b.matchIdx;
      const priority: Record<string, number> = {
        name: 1,
        brand: 2,
        qualifier: 3,
      };
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    });

    return [
      ...matchedGroup.map((m) => m.val),
      ...unmatchedGroup.map((u) => u.val),
    ].join(" ");
  }

  return components.map((c) => c.val).join(" ");
}
