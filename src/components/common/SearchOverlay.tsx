import { useRef, useEffect } from "react";
import { Search, X, ChevronRight, Clock, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Food } from "../../types";

type SearchOverlayProps = {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  results: Food[];
  isLoading: boolean;
  recentSearches?: string[];
  onRecentSelect?: (term: string) => void;
  onClearHistory?: () => void;
  onRemoveRecent?: (term: string) => void;
  onAddSearch?: (term: string) => void;
};

export default function SearchOverlay({
  isOpen,
  query,
  onQueryChange,
  onClose,
  results,
  isLoading,
  recentSearches = [],
  onRecentSelect,
  onClearHistory,
  onRemoveRecent,
  onAddSearch,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Overlay açılınca input'a odaklan ve scroll'u kilitle
  useEffect(() => {
    if (isOpen) {
      // Body scroll'u kilitle
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      // Scroll pozisyonunu sıfırla (zıplamayı engellemek için)
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }

      // Input'a odaklan (preventScroll: true ile sayfanın zıplamasını engelle)
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

  function handleSelect(food: Food) {
    onClose();
    // Aramayı History'e ekle
    onAddSearch?.(food.name);
    navigate(`/besin/${food.slug}`);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Üst bar: input + iptal - Global bar yüksekliği */}
      <div className="h-bar flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Besin ara..."
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
          {query && (
            <button onClick={() => onQueryChange("")}>
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

      {/* Sonuç listesi */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchMove={() => {
          if (document.activeElement === inputRef.current) {
            inputRef.current?.blur();
          }
        }}
        onScroll={() => {
          // Desktop için yedek
          if (
            document.activeElement === inputRef.current &&
            window.innerWidth > 768
          ) {
            inputRef.current?.blur();
          }
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-gray-400 text-sm">Aranıyor...</div>
          </div>
        ) : results.length > 0 ? (
          <ul>
            {results.map((food) => (
              <li key={food.id}>
                <button
                  onClick={() => handleSelect(food)}
                  className="w-full flex items-center justify-between px-4 py-[1.5dvh] border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors text-left gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 px-1">
                    {/* Görsel Kutusu */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {food.image_url ? (
                        <img
                          src={food.image_url}
                          alt={food.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Utensils className="w-5 h-5 text-emerald-500/50 dark:text-emerald-400/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {food.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {food.calories_per_100g} kcal · 100g
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        ) : !query && recentSearches.length > 0 ? (
          <div className="p-0">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between z-10">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Son Aramalar
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
            <ul className="px-4">
              {recentSearches.map((term, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <button
                    onClick={() => onRecentSelect?.(term)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {term}
                    </span>
                  </button>
                  {onRemoveRecent && (
                    <button
                      onClick={() => onRemoveRecent(term)}
                      className="p-2 text-gray-300 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                "{query}"
              </span>{" "}
              için sonuç bulunamadı.
            </p>
            <p className="text-xs text-gray-400">
              Besini biz ekleyelim mi?{" "}
              <button className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                Talep gönder
              </button>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
