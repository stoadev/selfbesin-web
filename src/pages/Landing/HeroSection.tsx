import { useState, useEffect, useRef } from "react";
import {
  Search,
  Lightbulb,
  SendHorizontal,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import SearchOverlay from "../../components/common/SearchOverlay";
import { foodService } from "../../services/food.service";
import { useDebounce } from "../../hooks/useDebounce";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import type { Food } from "../../types";

export default function HeroSection() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedQuery, setLastFetchedQuery] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const { recentSearches, addSearch, removeSearch, clearHistory } =
    useRecentSearches();

  useEffect(() => {
    // Query boşsa sonuçları temizle
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLastFetchedQuery("");
      return;
    }

    let active = true;

    const fetchFoods = async () => {
      if (active) setIsLoading(true);

      try {
        const data = await foodService.searchFoods(debouncedQuery);
        if (active) {
          setResults(data);
          setSelectedIndex(0);
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

  // Desktop'ta otomatik odaklanma
  useEffect(() => {
    if (!isMobile()) {
      searchInputRef.current?.focus();
    }
  }, []);

  const isMobile = () => window.innerWidth < 640;

  function handleFocus() {
    setIsFocused(true);
    // Google tarzı: Odaklanınca direkt dropdown açılmasın (mobilde arama sayfası açılmaya devam eder)
    if (isMobile()) {
      setIsSearchOpen(true);
    }
  }

  // Arama çubuğu tıklama (Dropdown'ı zorla açmak için)
  function handleInputClick() {
    if (!isMobile()) {
      setIsDropdownOpen(true);
    }
  }

  async function handleSuggest() {
    setIsLoading(true);
    try {
      const food = await foodService.getRandomFood();
      if (food) {
        setQuery(food.name);
        // Yazı gelince dropdown'ı açalım ki sonuçlar görünsün
        if (!isMobile()) setIsDropdownOpen(true);
      }
    } catch (error) {
      console.error("Error getting random food:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    // Eğer sonuçlardan biri seçiliyse ona git
    if (results.length > 0) {
      const match = results[selectedIndex] ?? results[0];
      if (match) {
        addSearch(match.name); // Aramayı kaydet
        navigate(`/besin/${match.slug}`);
      }
    } else if (query.trim()) {
      // Sonuç yoksa ama query varsa (örn: enter'a bastı), belki ileride genel arama sayfasına gider
      // Şimdilik sadece history'e ekleyelim
      addSearch(query.trim());
    }
  }

  function handleSearchClose() {
    setIsSearchOpen(false);
    setQuery("");
  }

  // Kullanıcı hala yazıyorsa veya sonuçlar henüz gelmediyse loading göster
  const showLoading =
    isLoading || (query.trim().length > 0 && query !== lastFetchedQuery);

  return (
    <>
      <SearchOverlay
        isOpen={isSearchOpen}
        query={query}
        onQueryChange={setQuery}
        onClose={handleSearchClose}
        results={results}
        isLoading={showLoading}
        recentSearches={recentSearches}
        onRecentSelect={(term) => setQuery(term)}
        onClearHistory={clearHistory}
        onRemoveRecent={removeSearch}
        onAddSearch={addSearch}
      />
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-3xl mx-auto py-10 sm:py-20 flex flex-col items-center text-center gap-6 sm:gap-10 -mt-32 sm:-mt-20">
          {/* Başlık */}
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight md:whitespace-nowrap">
              Bugün hangi <br className="sm:hidden" />
              <span className="text-emerald-600">besini</span> arıyorsun?
            </h1>
            <p className="hidden sm:block text-sm sm:text-lg text-gray-500 dark:text-gray-400 font-semibold px-2">
              Yediklerini takip et, makrolarını gör, sağlıklı yaşama adım at.
            </p>
          </div>

          {/* Arama Kutusu + Dropdown */}
          <div className="w-full relative">
            <div
              className={`flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 border rounded-full shadow-lg px-4 py-3 sm:px-5 sm:py-4 transition-all duration-300 ${
                isDropdownOpen
                  ? "border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/20 dark:border-emerald-500"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <Search
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${isDropdownOpen ? "text-emerald-500" : "text-gray-400"}`}
              />
              {/* Mobil için odaklanmayan tetikleyici, Masaüstü için aktif input */}
              <div
                className="flex-1 flex"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 640
                  ) {
                    setIsSearchOpen(true);
                  }
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                    if (!isMobile()) setIsDropdownOpen(true);
                  }}
                  onClick={handleInputClick}
                  onFocus={handleFocus}
                  onBlur={() => {
                    setIsFocused(false);
                    setTimeout(() => setIsDropdownOpen(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIsKeyboardNav(true);
                      setSelectedIndex((i) =>
                        Math.min(i + 1, results.length - 1),
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIsKeyboardNav(true);
                      setSelectedIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Elma, yumurta..."
                  className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none bg-transparent min-w-0"
                  {...(typeof window !== "undefined" && window.innerWidth < 640
                    ? { readOnly: true, tabIndex: -1 }
                    : {})}
                />
              </div>
              <Button
                variant="third"
                size="md"
                onClick={handleSuggest}
                className="!p-2"
              >
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!isFocused && !query.trim()}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className={`transition-opacity ${isFocused || query ? "opacity-100" : "opacity-50"}`}
              >
                <SendHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Masaüstü Dropdown */}
            {isDropdownOpen && (
              <DesktopDropdown
                query={query}
                onClose={() => setIsDropdownOpen(false)}
                selectedIndex={selectedIndex}
                onHover={(i) => {
                  setIsKeyboardNav(false);
                  setSelectedIndex(i);
                }}
                isKeyboardNav={isKeyboardNav}
                results={results}
                isLoading={showLoading}
                recentSearches={recentSearches}
                onRecentSelect={(term) => setQuery(term)}
                onAddSearch={addSearch}
                onRemoveSearch={removeSearch}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// Masaüstü dropdown bileşeni
function DesktopDropdown({
  query,
  onClose,
  selectedIndex,
  onHover,
  isKeyboardNav,
  results,
  isLoading,
  recentSearches,
  onRecentSelect,
  onAddSearch,
  onRemoveSearch,
}: {
  query: string;
  onClose: () => void;
  selectedIndex: number;
  onHover: (index: number) => void;
  isKeyboardNav: boolean;
  results: Food[];
  isLoading: boolean;
  recentSearches: string[];
  onRecentSelect: (term: string) => void;
  onAddSearch: (term: string) => void;
  onRemoveSearch: (term: string) => void;
}) {
  const navigate = useNavigate();

  // Query boşsa ve geçmiş varsa, geçmiş aramaları göster
  if (!query && recentSearches.length > 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-40">
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Son Aramalar
          </span>
        </div>
        <ul>
          {recentSearches.map((term, index) => (
            <li
              key={index}
              className="group flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
            >
              <button
                onMouseDown={() => {
                  onRecentSelect(term);
                }}
                className="flex-1 flex items-center gap-3 px-5 py-3 text-left"
              >
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {term}
                </span>
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveSearch(term);
                }}
                className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                title="Sil"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Query boşsa ve geçmiş yoksa bir şey gösterme (veya öneri göster)
  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-40">
      <ul>
        {isLoading ? (
          <li className="px-5 py-4 text-sm text-gray-400 text-center">
            Aranıyor...
          </li>
        ) : results.length > 0 ? (
          results.map((food, index) => (
            <li key={food.id}>
              <button
                onMouseDown={() => {
                  onClose();
                  onAddSearch(food.name);
                  navigate(`/besin/${food.slug}`);
                }}
                onMouseEnter={() => onHover(index)}
                className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left ${
                  index === selectedIndex
                    ? "bg-gray-50 dark:bg-gray-700"
                    : isKeyboardNav
                      ? ""
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-gray-300 dark:text-gray-500 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-100">
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
          ))
        ) : (
          <li className="px-5 py-4 text-sm text-gray-400 text-center">
            "{query}" için sonuç bulunamadı.
          </li>
        )}
      </ul>
    </div>
  );
}
