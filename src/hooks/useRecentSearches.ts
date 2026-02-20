import { useState } from "react";

const STORAGE_KEY = "recent_searches";
const MAX_ITEMS = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse recent searches", e);
      return [];
    }
  });

  // Add a search term
  const addSearch = (term: string) => {
    if (!term.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== term.toLowerCase(),
      );
      const newSearches = [term, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Clear a specific search term
  const removeSearch = (term: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((item) => item !== term);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Clear all history
  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { recentSearches, addSearch, removeSearch, clearHistory };
}
