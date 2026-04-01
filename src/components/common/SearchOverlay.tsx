import { useRef, useEffect } from "react";
import { Search, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Food } from "../../types";
import type { CombinedItem } from "../../pages/Landing/HeroSection";
import HighlightedText from "./HighlightedText";

type SearchOverlayProps = {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  combinedItems: CombinedItem[];
  isLoading: boolean;
  onClearHistory?: () => void;
  onRemoveRecent?: (term: string) => void;
  onAddSearch?: (term: string) => void;
  buildSearchTerm: (food: Food, query?: string) => string;
};

export default function SearchOverlay({
  isOpen,
  query,
  onQueryChange,
  onClose,
  combinedItems,
  isLoading,
  onClearHistory,
  onRemoveRecent,
  onAddSearch,
  buildSearchTerm,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Overlay açılınca input'a odaklan ve scroll'u kilitle
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }

      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 50);

      return () => {
        document.body.style.overflow = originalStyle;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleItemClick(item: CombinedItem) {
    onClose();
    if (item.type === "history") {
      onAddSearch?.(item.term);
      navigate(`/search?q=${encodeURIComponent(item.term)}`);
    } else {
      const searchTerm = buildSearchTerm(item.food, query);
      onAddSearch?.(searchTerm);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  function handleSearchSubmit() {
    if (query.trim()) {
      onClose();
      onAddSearch?.(query.trim());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  // Query boşken ve combinedItems'ta sadece geçmiş varsa "Son aramalar" başlığı göster
  const showRecentHeader = !query.trim() && combinedItems.length > 0 && combinedItems.every((i) => i.type === "history");

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Üst bar: input + iptal */}
      <div className="h-bar flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit();
          }}
          className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2"
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            name="food-search-overlay"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Besin ara..."
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
          {query && (
            <button type="button" onClick={() => onQueryChange("")}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </form>
        <button
          onClick={onClose}
          className="text-emerald-600 dark:text-emerald-400 text-sm font-medium whitespace-nowrap"
        >
          İptal
        </button>
      </div>

      {/* Sonuç listesi */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchMove={() => {
          if (document.activeElement === inputRef.current) {
            inputRef.current?.blur();
          }
        }}
      >
        {/* Son aramalar başlığı */}
        {showRecentHeader && (
          <div className="sticky top-0 bg-white dark:bg-gray-900 px-5 py-2 flex items-center justify-between z-10">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Son aramalar
            </span>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Temizle
              </button>
            )}
          </div>
        )}

        {isLoading && query && (
          <div className="px-5 py-2.5 text-xs text-gray-400">Aranıyor...</div>
        )}

        {combinedItems.length > 0 ? (
          <ul className="flex flex-col">
            {combinedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                <button
                  onClick={() => handleItemClick(item)}
                  className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left min-w-0"
                >
                  {item.type === "history" ? (
                    <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 shrink-0" />
                  ) : (
                    <Search className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 shrink-0" />
                  )}
                  <span className="text-sm lowercase truncate text-gray-600 dark:text-gray-300">
                    {item.type === "history" ? (
                      <HighlightedText text={item.term} highlight={query} />
                    ) : (
                      <HighlightedText
                        text={buildSearchTerm(item.food, query)}
                        highlight={query}
                      />
                    )}
                  </span>
                </button>
                {item.type === "history" && onRemoveRecent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.term);
                    }}
                    className="p-2 pr-4 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : query && !isLoading ? (
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
  );
}
