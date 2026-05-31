import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Search, X, Utensils } from "lucide-react";
import { foodService } from "../../services/food.service";
import type { Food } from "../../types";
import { getBasisLabel } from "../../types";
import SearchOverlay from "../../components/common/SearchOverlay";
import FoodImage from "../../components/common/FoodImage";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import type { CombinedItem } from "../Landing/HeroSection";
import { buildSearchTerm } from "../../utils/searchUtils";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const { addSearch, recentSearches, removeSearch, clearHistory } =
    useRecentSearches();

  // URL'deki query değişince inputu güncelle ve ara
  useEffect(() => {
    setInputValue(query);
    if (query) {
      handleFetchResults(query);
    }
  }, [query]);

  const handleFetchResults = async (q: string) => {
    setIsLoading(true);
    try {
      const localResults = await foodService.searchFoods(q);
      setResults(localResults);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addSearch(inputValue.trim());
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleClear = () => {
    setInputValue("");
  };

  const combinedItems = useMemo(() => {
    const matchingHistory = inputValue.trim()
      ? recentSearches
          .filter((s) =>
            s
              .toLocaleLowerCase("tr")
              .startsWith(inputValue.toLocaleLowerCase("tr")),
          )
          .slice(0, 3)
          .map((term) => ({ type: "history" as const, term, id: `h-${term}` }))
      : recentSearches
          .slice(0, 8)
          .map((term) => ({ type: "history" as const, term, id: `h-${term}` }));

    const historyTerms = new Set(matchingHistory.map((h) => h.term));
    const uniqueResults = results.reduce<CombinedItem[]>((acc, food) => {
      const label = buildSearchTerm(food, inputValue);
      const displayLabel = label.toLocaleLowerCase("tr");
      if (!historyTerms.has(displayLabel)) {
        acc.push({
          type: "result" as const,
          food,
          id: `r-${food.id}`,
          _label: label,
        });
      }
      return acc;
    }, []);

    return [...matchingHistory, ...uniqueResults].slice(0, 10);
  }, [inputValue, results, recentSearches]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>
          {query
            ? `"${query}" Arama Sonuçları – Selfbesin`
            : "Besin Ara – Selfbesin"}
        </title>
        <meta
          name="description"
          content={
            query
              ? `"${query}" için besin değerleri arama sonuçları. Kalori, protein ve makro besin bilgileri.`
              : "Binlerce besini ara, anında besin değerlerini öğren."
          }
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://selfbesin.com/og-image.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://selfbesin.com/og-image.png"
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://selfbesin.com/search" />
      </Helmet>

      {/* Sticky Google Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <form onSubmit={handleFormSubmit} className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="search"
                enterKeyHint="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onClick={() => {
                  if (window.innerWidth < 640) {
                    setIsSearchOverlayOpen(true);
                  }
                }}
                className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2.5 pl-11 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 dark:text-gray-200 transition-all shadow-sm"
                placeholder="Besin ara..."
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h1 className="sr-only">
          {query ? `"${query}" için besin arama sonuçları` : "Besin Arama"}
        </h1>

        {/* Sonuç Sayısı ve Info */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isLoading
              ? "Aranıyor..."
              : results.length > 0
                ? `"${query}" için yaklaşık ${results.length} sonuç bulundu.`
                : query
                  ? `"${query}" için sonuç bulunamadı.`
                  : "Arama yapmak için besin adı girin."}
          </p>
        </div>

        {/* Results List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {results.map((food) => (
            <article key={food.id} className="group py-6 first:pt-0 last:pb-0">
              <button
                onClick={() => navigate(`/besin/${food.slug}`)}
                className="w-full text-left flex gap-4 md:gap-6"
              >
                <div className="flex-1 min-w-0">
                  {/* Site URL / Breadcrumb style */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Utensils className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[11px] md:text-sm text-gray-600 dark:text-gray-400 truncate">
                      selfbesin.com › besin › {food.slug}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg md:text-xl font-semibold text-[#1a0dab] dark:text-[#8ab4f8] group-hover:underline mb-1 cursor-pointer">
                    {food.display_name?.trim() || food.name}
                  </h3>

                  {/* Snippet / Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
                    {food.display_name?.trim() || food.name}{" "}
                    besininin 100{" "}
                    {getBasisLabel(food).unit === "ml" ? "ml'si" : "gramı"}{" "}
                    {food.calories_per_100g} kaloridir. Macro değerleri:{" "}
                    {food.protein_g_per_100g}g Protein, {food.carbs_g_per_100g}g
                    Karbonhidrat, {food.fat_g_per_100g}g Yağ içerir.
                  </p>
                </div>

                {/* Image or Placeholder using FoodImage component */}
                <FoodImage
                  src={food.image_url}
                  alt={food.display_name?.trim() || food.name || ""}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 shrink-0"
                  iconClassName="w-8 h-8"
                />
              </button>
            </article>
          ))}
        </div>

        {/* Empty state handles */}
        {!isLoading && results.length === 0 && query && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sonuç bulunamadı
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Farklı bir terim aramayı deneyin veya yazım hatası yapmadığınızdan
              emin olun.
            </p>
          </div>
        )}
      </main>

      {/* Re-use search overlay for mobile re-searches */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        query={inputValue}
        onQueryChange={setInputValue}
        onClose={() => setIsSearchOverlayOpen(false)}
        combinedItems={combinedItems}
        isLoading={isLoading}
        onClearHistory={clearHistory}
        onRemoveRecent={removeSearch}
        onAddSearch={addSearch}
        buildSearchTerm={buildSearchTerm}
      />
    </div>
  );
}
