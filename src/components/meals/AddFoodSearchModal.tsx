import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import Modal from "../common/Modal";
import { foodService } from "../../services/food.service";
import { useDebounce } from "../../hooks/useDebounce";
import type { Food } from "../../types";

type CombinedItem = { type: "result"; food: Food; id: string; _label: string };

type AddFoodSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFoodSelect: (food: Food) => void;
};

function HighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <span className="font-bold">{text}</span>;

  const queryWords = highlight.toLocaleLowerCase("tr").trim().split(/\s+/);
  const textLower = text.toLocaleLowerCase("tr");

  let lastMatchEnd = 0;

  queryWords.forEach((qw) => {
    const pos = textLower.indexOf(qw, lastMatchEnd);
    if (pos !== -1) {
      lastMatchEnd = pos + qw.length;
    }
  });

  if (lastMatchEnd === 0) return <span className="font-bold">{text}</span>;

  return (
    <>
      <span className="font-normal opacity-70">
        {text.substring(0, lastMatchEnd)}
      </span>
      <span className="font-bold">{text.substring(lastMatchEnd)}</span>
    </>
  );
}

function buildSearchTerm(food: Food, currentQuery?: string): string {
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

export default function AddFoodSearchModal({
  isOpen,
  onClose,
  onFoodSelect,
}: AddFoodSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedQuery, setLastFetchedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setLastFetchedQuery("");
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Fetch foods on debounced query change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLastFetchedQuery("");
      return;
    }

    let active = true;

    const fetchFoods = async () => {
      if (active) setIsLoading(true);

      try {
        const localResults = await foodService.searchFoods(debouncedQuery);
        let finalResults = localResults;

        if (active) {
          const hasGoodMatch = localResults.some((f) =>
            f.name
              .toLocaleLowerCase("tr")
              .includes(debouncedQuery.toLocaleLowerCase("tr")),
          );

          if (
            (!hasGoodMatch || localResults.length < 3) &&
            debouncedQuery.length >= 1
          ) {
            const freshData =
              await foodService.fetchAndLoadFood(debouncedQuery);
            const existingIds = new Set(localResults.map((f) => f.id));
            const newItems = freshData.filter((f) => !existingIds.has(f.id));
            finalResults = [...localResults, ...newItems];
          }

          setResults(finalResults);
          setSelectedIndex(-1);
          setLastFetchedQuery(debouncedQuery);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchFoods();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const showLoading =
    isLoading || (query.trim().length > 0 && query !== lastFetchedQuery);

  const combinedItems = useMemo(() => {
    const queryWords = query.toLocaleLowerCase("tr").trim().split(/\s+/);

    const uniqueResults = results.reduce<
      { type: "result"; food: Food; id: string; _label: string }[]
    >((acc, food) => {
      const label = buildSearchTerm(food, query);
      const displayLabel = label.toLocaleLowerCase("tr");
      const displayWords = displayLabel.split(/\s+/);

      const isChainBroken = queryWords.some((qw, i) => {
        if (!displayWords[i]) return true;
        return !displayWords[i].startsWith(qw);
      });

      if (!isChainBroken) {
        acc.push({
          type: "result" as const,
          food,
          id: `r-${food.id}`,
          _label: label,
        });
      }

      return acc;
    }, []);

    const sortedResults = [...uniqueResults].sort((a, b) => {
      const q = query.toLocaleLowerCase("tr").trim();
      const qWords = q.split(/\s+/);

      const getMatchPenalty = (food: Food) => {
        const nameText = food.name.toLocaleLowerCase("tr");
        const brandText = (food.brand || "").toLocaleLowerCase("tr");
        const nameWords = nameText.split(/\s+/);
        const brandWords = brandText.split(/\s+/);
        const qualWords = (food.qualifier || [])
          .join(" ")
          .toLocaleLowerCase("tr")
          .split(/\s+/);

        let totalPenalty = 0;

        const isIdentityMatch = nameText === q || qWords.includes(nameText);
        if (isIdentityMatch) totalPenalty -= 500;

        for (const qw of qWords) {
          let bestQwPenalty = 1000;

          const nameFullIdx = nameWords.indexOf(qw);
          if (nameFullIdx !== -1) {
            bestQwPenalty = Math.min(bestQwPenalty, 0 + nameFullIdx * 2);
          } else {
            const namePrefixIdx = nameWords.findIndex((nw) =>
              nw.startsWith(qw),
            );
            if (namePrefixIdx !== -1)
              bestQwPenalty = Math.min(bestQwPenalty, 20 + namePrefixIdx * 2);
          }

          if (bestQwPenalty > 100) {
            const brandFullIdx = brandWords.indexOf(qw);
            if (brandFullIdx !== -1) {
              bestQwPenalty = Math.min(bestQwPenalty, 100 + brandFullIdx * 2);
            } else {
              const brandPrefixIdx = brandWords.findIndex((bw) =>
                bw.startsWith(qw),
              );
              if (brandPrefixIdx !== -1)
                bestQwPenalty = Math.min(
                  bestQwPenalty,
                  120 + brandPrefixIdx * 2,
                );
            }
          }

          if (bestQwPenalty > 200) {
            const qualFullIdx = qualWords.indexOf(qw);
            if (qualFullIdx !== -1) {
              bestQwPenalty = Math.min(bestQwPenalty, 200 + qualFullIdx * 2);
            } else {
              const qualPrefixIdx = qualWords.findIndex((qw_val) =>
                qw_val.startsWith(qw),
              );
              if (qualPrefixIdx !== -1)
                bestQwPenalty = Math.min(
                  bestQwPenalty,
                  220 + qualPrefixIdx * 2,
                );
            }
          }

          totalPenalty += bestQwPenalty;
        }

        return totalPenalty;
      };

      const penaltyA = getMatchPenalty(a.food);
      const penaltyB = getMatchPenalty(b.food);

      if (penaltyA !== penaltyB) return penaltyA - penaltyB;

      const isGenericA = !a.food.brand || a.food.brand === "Genel";
      const isGenericB = !b.food.brand || b.food.brand === "Genel";
      if (isGenericA && !isGenericB) return -1;
      if (!isGenericA && isGenericB) return 1;

      const qualCountA = a.food.qualifier?.length || 0;
      const qualCountB = b.food.qualifier?.length || 0;
      if (qualCountA !== qualCountB) return qualCountA - qualCountB;

      const nameWordsA = a.food.name.split(/\s+/).length;
      const nameWordsB = b.food.name.split(/\s+/).length;
      if (nameWordsA !== nameWordsB) return nameWordsA - nameWordsB;

      const brandPriA = a.food.brand_priority ?? 99999;
      const brandPriB = b.food.brand_priority ?? 99999;
      if (brandPriA !== brandPriB) return brandPriA - brandPriB;

      const qualPriA = a.food.qualifier_score ?? 99999;
      const qualPriB = b.food.qualifier_score ?? 99999;
      if (qualPriA !== qualPriB) return qualPriA - qualPriB;

      return a._label.length - b._label.length;
    });

    return sortedResults.slice(0, 10);
  }, [query, results]);

  function handleItemClick(item: CombinedItem) {
    if (item.type === "result") {
      onFoodSelect(item.food);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsKeyboardNav(true);
      setSelectedIndex((i) => Math.min(i + 1, combinedItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsKeyboardNav(true);
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleItemClick(combinedItems[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      maxHeight="h-[80dvh] sm:h-[600px]"
      showCloseButton={false}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Besin ara..."
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-emerald-600 dark:text-emerald-400 text-sm font-medium whitespace-nowrap"
            >
              İptal
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {showLoading && query && (
            <div className="px-5 py-2.5 text-xs text-gray-400">
              Aranıyor...
            </div>
          )}

          {combinedItems.length > 0 ? (
            <ul className="flex flex-col">
              {combinedItems.map((item, index) => (
                <li
                  key={item.id}
                  className={`group flex items-center border-b border-gray-100 dark:border-gray-800 transition-colors ${
                    index === selectedIndex
                      ? "bg-gray-50 dark:bg-gray-700/50"
                      : isKeyboardNav
                        ? ""
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onMouseEnter={() => {
                    setIsKeyboardNav(false);
                    setSelectedIndex(index);
                  }}
                >
                  <button
                    onClick={() => handleItemClick(item)}
                    className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left min-w-0"
                  >
                    <Search className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 shrink-0" />
                    <span className="text-sm lowercase truncate text-gray-600 dark:text-gray-300">
                      <HighlightedText
                        text={buildSearchTerm(item.food, query)}
                        highlight={query}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query && !showLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  "{query}"
                </span>{" "}
                için sonuç bulunamadı.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
