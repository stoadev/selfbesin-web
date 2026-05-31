import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Lightbulb, SendHorizontal, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import SearchOverlay from "../../components/common/SearchOverlay";
import { foodService } from "../../services/food.service";
import { useDebounce } from "../../hooks/useDebounce";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import type { Food } from "../../types";
import HighlightedText from "../../components/common/HighlightedText";
import { buildSearchTerm } from "../../utils/searchUtils";

export type CombinedItem =
  | { type: "history"; term: string; id: string }
  | { type: "result"; food: Food; id: string; _label: string };

export default function HeroSection() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedQuery, setLastFetchedQuery] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

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
        const localResults = await foodService.searchFoods(debouncedQuery);

        if (active) {
          setResults(localResults);
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

  // Pencere boyutu değiştiğinde isMobile güncelle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sayfa açıldığında otomatik odaklan (Dropdown'ı açmadan)
  useEffect(() => {
    if (!isMobile) {
      searchInputRef.current?.focus();
    }
  }, [isMobile]);

  async function handleSuggest() {
    setIsLoading(true);
    try {
      const food = await foodService.getRandomFood();
      if (food) {
        setQuery(food.display_name?.trim() || food.name);
        // Yazı gelince dropdown'ı açalım ki sonuçlar görünsün
        if (!isMobile) setIsDropdownOpen(true);
      }
    } catch (error) {
      console.error("Error getting random food:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    if (selectedIndex >= 0 && combinedItems.length > 0) {
      const match = combinedItems[selectedIndex];
      if (match.type === "history") {
        addSearch(match.term);
        navigate(`/search?q=${encodeURIComponent(match.term)}`);
      } else if (match.food) {
        const searchTerm = buildSearchTerm(match.food, query);
        addSearch(searchTerm);
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
      setIsDropdownOpen(false);
    } else if (query.trim()) {
      addSearch(query.trim());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsDropdownOpen(false);
    }
  }

  function handleSearchClose() {
    setIsSearchOpen(false);
    setQuery("");
  }

  // Kullanıcı hala yazıyorsa veya sonuçlar henüz gelmediyse loading göster
  const showLoading =
    isLoading || (query.trim().length > 0 && query !== lastFetchedQuery);

  // Birleşik Liste Mantığı (Google Style)
  const combinedItems = useMemo(() => {
    // 1. Eşleşen geçmiş aramalar
    const matchingHistory = query.trim()
      ? recentSearches
          .filter((s) =>
            s.toLocaleLowerCase("tr").startsWith(query.toLocaleLowerCase("tr")),
          )
          .slice(0, 3)
          .map((term) => ({ type: "history" as const, term, id: `h-${term}` }))
      : recentSearches.slice(0, isMobile ? 10 : 8).map((term) => ({
          type: "history" as const,
          term,
          id: `h-${term}`,
        }));

    // 2. Canlı sonuçlar (geçmişten farklı olanlar + Sıkı Filtreleme)
    const historyTerms = new Set(matchingHistory.map((h) => h.term));
    const queryWords = query.toLocaleLowerCase("tr").trim().split(/\s+/);

    const uniqueResults = results.reduce<
      { type: "result"; food: Food; id: string; _label: string }[]
    >((acc, food) => {
      // GÖRÜNÜR ZİNCİR (Display-Synced Chain Match):
      // Etiketi bir kez hesapla, hem zincir kontrolü hem sıralama için sakla.
      const label = buildSearchTerm(food, query);
      const displayLabel = label.toLocaleLowerCase("tr");
      const displayWords = displayLabel.split(/\s+/);

      const isChainBroken = queryWords.some((qw, i) => {
        if (!displayWords[i]) return true; // Kelime bitti ama sorgu devam ediyor
        return !displayWords[i].startsWith(qw); // Sıradaki kelime eşleşmiyor
      });

      if (!isChainBroken && !historyTerms.has(displayLabel)) {
        acc.push({
          type: "result" as const,
          food,
          id: `r-${food.id}`,
          _label: label,
        });
      }

      return acc;
    }, []);

    // Akıllı Sıralama: Katmanlı Skorlama + Uzunluk Bazlı Tiebreaker
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

        // KİMLİK BONUSU: Tam isim eşleşmesi
        const isIdentityMatch = nameText === q || qWords.includes(nameText);
        if (isIdentityMatch) totalPenalty -= 500;

        for (const qw of qWords) {
          let bestQwPenalty = 1000;

          // 1. Kademe: İSİM ÖNCELİĞİ (Absolute Priority)
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

          // 2. Kademe: MARKA
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

          // 3. Kademe: BELİRTEÇ (Qualifier)
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

      // 2. Öncelik: Tamamen Markasız (Genel) Ürün Koruması
      const isGenericA = !a.food.brand || a.food.brand === "Genel";
      const isGenericB = !b.food.brand || b.food.brand === "Genel";
      if (isGenericA && !isGenericB) return -1;
      if (!isGenericA && isGenericB) return 1;

      // 3. Öncelik: Az Belirteç (Fewer Qualifiers) Önceliği
      // 0 belirteç > 1 belirteç > 2 belirteç... (Sade ürün her zaman kazanır)
      const qualCountA = a.food.qualifier?.length || 0;
      const qualCountB = b.food.qualifier?.length || 0;
      if (qualCountA !== qualCountB) return qualCountA - qualCountB;

      // 4. Öncelik: İsim Sadelik Önceliği (Name Complexity)
      // "Yoğurt" (1 kelime) > "Yeşil Mercimek" (2 kelime). Temel ürünler önce gelir.
      const nameWordsA = a.food.name.split(/\s+/).length;
      const nameWordsB = b.food.name.split(/\s+/).length;
      if (nameWordsA !== nameWordsB) return nameWordsA - nameWordsB;

      // 4. Öncelik: Veritabanındaki Marka Önceliği (brand_priority)
      const brandPriA = a.food.brand_priority ?? 99999;
      const brandPriB = b.food.brand_priority ?? 99999;
      if (brandPriA !== brandPriB) return brandPriA - brandPriB;

      // 5. Öncelik: Veritabanındaki Belirteç Önceliği (qualifier_score)
      const qualPriA = a.food.qualifier_score ?? 99999;
      const qualPriB = b.food.qualifier_score ?? 99999;
      if (qualPriA !== qualPriB) return qualPriA - qualPriB;

      // TIEBREAKER: Aynı skorda olanlar için etiket uzunluğuna bak (Kısa olan her zaman daha isabetlidir)
      return a._label.length - b._label.length;
    });

    return [...matchingHistory, ...sortedResults].slice(0, isMobile ? 10 : 7);
  }, [query, results, recentSearches, isMobile]);

  return (
    <>
      <SearchOverlay
        isOpen={isSearchOpen}
        query={query}
        onQueryChange={setQuery}
        onClose={handleSearchClose}
        combinedItems={combinedItems}
        isLoading={showLoading}
        onClearHistory={clearHistory}
        onRemoveRecent={removeSearch}
        onAddSearch={addSearch}
        buildSearchTerm={buildSearchTerm}
      />

      <section className="flex-1 w-full flex flex-col items-center justify-center pb-[12dvh] sm:pb-[8dvh] px-[3dvw] sm:px-6">
        <div className="w-full max-w-3xl flex flex-col items-center gap-[3dvh] sm:gap-[4dvh]">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight text-center">
            Bugün ne <span className="text-emerald-600">yedin</span>?
          </h1>
          {/* Arama Barı - Her zaman rounded-full */}
          <div className="w-full relative">
            <div
              className={`flex items-center gap-[2dvw] sm:gap-[1dvw] bg-white dark:bg-gray-800 shadow-lg rounded-full px-[4dvw] py-2.5 sm:px-5 sm:py-3 transition-all duration-300 ${
                isDropdownOpen && !isMobile
                  ? "ring-2 ring-emerald-500/20 dark:ring-emerald-500/10"
                  : ""
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-gray-400" />
              <div
                className="flex-1 flex"
                onClick={() => {
                  if (isMobile) {
                    setIsSearchOpen(true);
                  }
                }}
              >
                <input
                  ref={searchInputRef}
                  type="search"
                  enterKeyHint="search"
                  value={query}
                  autoComplete="off"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                    if (!isMobile && e.target.value.trim())
                      setIsDropdownOpen(true);
                  }}
                  onClick={() => {
                    if (!isMobile) setIsDropdownOpen(true);
                  }}
                  onBlur={(e) => {
                    // Focus dropdown içine geçtiyse kapatma
                    const related = e.relatedTarget as HTMLElement | null;
                    if (related?.closest("[data-dropdown]")) return;
                    setIsDropdownOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (!isDropdownOpen) setIsDropdownOpen(true);
                      setIsKeyboardNav(true);
                      setSelectedIndex((i) =>
                        Math.min(i + 1, combinedItems.length - 1),
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIsKeyboardNav(true);
                      setSelectedIndex((i) => Math.max(i - 1, -1));
                    } else if (e.key === "Enter") {
                      handleSearch();
                    } else if (e.key === "Escape") {
                      setIsDropdownOpen(false);
                    }
                  }}
                  placeholder="Elma, yumurta..."
                  className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none bg-transparent min-w-0"
                  {...(isMobile ? { readOnly: true, tabIndex: -1 } : {})}
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
                disabled={!query.trim()}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className={`transition-opacity ${query.trim() ? "opacity-100" : "opacity-50"}`}
              >
                <SendHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Google tarzı: Dropdown Overlay */}
            {isDropdownOpen && !isMobile && (
              <div
                data-dropdown
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <DesktopDropdownContent
                  query={query}
                  onClose={() => setIsDropdownOpen(false)}
                  selectedIndex={selectedIndex}
                  onHover={(i: number) => {
                    setIsKeyboardNav(false);
                    setSelectedIndex(i);
                  }}
                  isKeyboardNav={isKeyboardNav}
                  combinedItems={combinedItems}
                  isLoading={showLoading}
                  onRemoveSearch={removeSearch}
                  onAddSearch={addSearch}
                  buildSearchTerm={buildSearchTerm}
                  onMouseLeave={() => setSelectedIndex(-1)}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// Masaüstü dropdown bileşeni
function DesktopDropdownContent({
  query,
  onClose,
  selectedIndex,
  onHover,
  isKeyboardNav,
  combinedItems,
  isLoading,
  onAddSearch,
  onRemoveSearch,
  buildSearchTerm,
  onMouseLeave,
}: {
  query: string;
  onClose: () => void;
  selectedIndex: number;
  onHover: (index: number) => void;
  isKeyboardNav: boolean;
  combinedItems: CombinedItem[];
  isLoading: boolean;
  onAddSearch: (term: string) => void;
  onRemoveSearch: (term: string) => void;
  buildSearchTerm: (food: Food, query?: string) => string;
  onMouseLeave?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      onMouseLeave={onMouseLeave}
      className="bg-white dark:bg-gray-800 flex flex-col"
    >
      <ul className="flex flex-col">
        {isLoading && query && (
          <li className="px-5 py-2 text-xs text-gray-400">Aranıyor...</li>
        )}

        {combinedItems.map((item, index) => (
          <li
            key={item.id}
            className={`group flex items-center transition-colors ${
              index === selectedIndex
                ? "bg-gray-50 dark:bg-gray-700/50"
                : isKeyboardNav
                  ? ""
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
            onMouseEnter={() => onHover(index)}
          >
            <button
              onMouseDown={() => {
                onClose();
                if (item.type === "history") {
                  onAddSearch(item.term);
                  navigate(`/search?q=${encodeURIComponent(item.term)}`);
                } else {
                  const searchTerm = buildSearchTerm(item.food, query);
                  onAddSearch(searchTerm);
                  navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                }
              }}
              className="flex-1 flex items-center gap-3 px-5 py-1.5 text-left min-w-0"
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
            {item.type === "history" && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveSearch(item.term);
                }}
                className="p-2 pr-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Sil"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}

        {combinedItems.length === 0 && query && !isLoading && (
          <li className="px-5 py-4 text-sm text-gray-400 text-center">
            "{query}" için sonuç bulunamadı.
          </li>
        )}
      </ul>
    </div>
  );
}
