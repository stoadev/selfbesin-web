import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Flame, Beef, Wheat, Droplets, X } from "lucide-react";
import { foodService } from "../../services/food.service";
import type { Food, FoodUnit } from "../../types";
import { getBasisLabel } from "../../types";
import Button from "../../components/common/Button";
import AuthModal from "../../components/common/AuthModal";
import AddToMealModal from "../../components/meals/AddToMealModal";
import Loading from "../../components/common/Loading";
import { useAuth } from "../../hooks/useAuth";
import FoodImage from "../../components/common/FoodImage";

export default function FoodDetailPage() {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [serving, setServing] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const [selectionMode, setSelectionMode] = useState<"gram" | "unit">("gram");
  const [activeUnit, setActiveUnit] = useState<{
    name: string;
    grams: number;
  } | null>(null);

  useEffect(() => {
    async function fetchFood() {
      if (!slug) return;
      setLoading(true);
      const data = await foodService.getFoodBySlug(slug);
      setFood(data);

      if (data) {
        let initialUnits: FoodUnit[] = [];
        try {
          initialUnits = Array.isArray(data.serving_units)
            ? data.serving_units
            : typeof data.serving_units === "string"
              ? JSON.parse(data.serving_units)
              : [];
        } catch (e) {
          console.error("Scale parsing error:", e);
          initialUnits = [];
        }

        // Önce 100 gram olan bir birim var mı diye bak
        const unitAt100 = initialUnits.find(
          (u: FoodUnit) => Number(u.grams) === 100,
        );

        if (unitAt100) {
          setSelectionMode("unit");
          setActiveUnit(unitAt100);
          setServing(100);
        } else if (initialUnits.length > 0) {
          setSelectionMode("gram");
          setActiveUnit(initialUnits[0]);
          setServing(100);
        } else {
          setSelectionMode("gram");
          setServing(100);
        }
      }

      setLoading(false);
    }
    fetchFood();
  }, [slug]);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!food) {
    return (
      <div className="flex flex-col items-center justify-center gap-[2dvh] py-[10dvh] px-[3dvw] text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          Besin bulunamadı.
        </p>
        <Link
          to="/"
          className="text-emerald-600 hover:underline text-sm font-medium"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  // Porsiyona göre hesapla
  const ratio = serving / 100;
  const calc = (val: number) => (val * ratio).toFixed(1);
  const { unit, unitLabel, quantityLabel } = getBasisLabel(food);

  // Seçili birimleri bul
  let units: FoodUnit[] = [];
  try {
    units = Array.isArray(food.serving_units)
      ? food.serving_units
      : typeof food.serving_units === "string"
        ? JSON.parse(food.serving_units)
        : [];
  } catch (e) {
    console.error("Scale parsing error:", e);
    units = [];
  }

  // Slider değerleri
  const sliderMin = 0;
  const sliderMax = selectionMode === "gram" ? 500 : 10;
  const sliderStep = selectionMode === "gram" ? 5 : 1;
  const sliderValue =
    selectionMode === "gram"
      ? serving
      : activeUnit
        ? serving / activeUnit.grams
        : serving;

  const jsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: food.qualifier?.length
      ? `${food.name} ${food.qualifier.join(" ")}`
      : food.name,
    url: `https://selfbesin.com/besin/${food.slug}`,
    ...(food.image_url && { image: food.image_url }),
    description: `${food.name}${food.qualifier?.length ? ` ${food.qualifier.join(" ")}` : ""} besin değerleri: kalori, protein, karbonhidrat ve yağ bilgileri.`,
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: `100 ${unit}`,
      calories: `${food.calories_per_100g} calories`,
      proteinContent: `${food.protein_g_per_100g} g`,
      carbohydrateContent: `${food.carbs_g_per_100g} g`,
      fatContent: `${food.fat_g_per_100g} g`,
    },
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: "https://selfbesin.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: food.qualifier?.length
          ? `${food.name} ${food.qualifier.join(" ")}`
          : food.name,
        item: `https://selfbesin.com/besin/${food.slug}`,
      },
    ],
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      <Helmet>
        <title>
          {food.name}
          {food.qualifier?.length ? ` ${food.qualifier.join(" ")}` : ""} Besin
          Değerleri – Selfbesin
        </title>
        <meta
          name="description"
          content={`${food.name}${food.qualifier?.length ? ` ${food.qualifier.join(" ")}` : ""} besin değerleri: 100${unit} için ${food.calories_per_100g} kcal kalori, ${food.protein_g_per_100g}g protein, ${food.carbs_g_per_100g}g karbonhidrat, ${food.fat_g_per_100g}g yağ.`}
        />
        <meta
          property="og:title"
          content={`${food.name}${food.qualifier?.length ? ` ${food.qualifier.join(" ")}` : ""} Besin Değerleri – Selfbesin`}
        />
        <meta
          property="og:description"
          content={`${food.name}${food.qualifier?.length ? ` ${food.qualifier.join(" ")}` : ""}: 100${unit} = ${food.calories_per_100g} kcal kalori, ${food.protein_g_per_100g}g protein`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://selfbesin.com/besin/${food.slug}`}
        />
        <meta
          property="og:image"
          content={food.image_url || "https://selfbesin.com/og-image.png"}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={food.image_url || "https://selfbesin.com/og-image.png"}
        />
        <link
          rel="canonical"
          href={`https://selfbesin.com/besin/${food.slug}`}
        />
        <script type="application/ld+json">
          {JSON.stringify(jsonLdProduct)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdBreadcrumb)}
        </script>
      </Helmet>

      {/* Header - %10 dikey alan */}
      <div className="h-bar relative flex items-center justify-center px-[2dvw] border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-30 shrink-0">
        <Link
          to="/"
          className="absolute left-[2dvw] p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[65dvw]">
            {food.name}
            {food.qualifier && food.qualifier.length > 0 && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                {food.qualifier.join(" ")}
              </span>
            )}
          </h1>
          {food.brand && food.brand !== "Genel" && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {food.brand}
            </span>
          )}
        </div>
      </div>

      {/* Ana İçerik Alanı - Esnek Alan */}
      <div className="flex-1 flex flex-col px-5 py-[3dvh] overflow-y-auto">
        {/* Hero Görsel Kartı */}
        <div
          onClick={() => food.image_url && setIsZoomed(true)}
          className={`w-full mx-auto h-[30dvh] rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-100/30 dark:border-emerald-500/10 shadow-sm overflow-hidden flex items-center justify-center relative shrink-0 ${food.image_url ? "cursor-zoom-in active:scale-[0.98] transition-transform" : ""}`}
        >
          <FoodImage
            src={food.image_url}
            alt={food.name}
            className="w-full h-full"
            iconClassName="w-12 h-12"
          />
          {food.image_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none" />
          )}
        </div>

        {/* Porsiyon seçici - %25 civarı pay */}
        <div className="mt-auto flex flex-col gap-[2dvh]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {selectionMode === "unit" && activeUnit
                ? activeUnit.name.charAt(0).toUpperCase() +
                  activeUnit.name.slice(1)
                : quantityLabel}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600">
                {selectionMode === "unit" && activeUnit
                  ? (serving / activeUnit.grams).toFixed(1).replace(".0", "")
                  : `${serving}${unit}`}
              </span>
              {selectionMode === "unit" && activeUnit && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1">
                  ({serving}{unit})
                </span>
              )}
            </div>
          </div>

          {/* Slider ve Butonlar - Slider altındaki gap 1.5x */}
          <div className="flex flex-col gap-[4.5dvh]">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (selectionMode === "gram") {
                  setServing(val);
                } else if (activeUnit) {
                  setServing(val * activeUnit.grams);
                }
                setIsAdded(false);
              }}
              className="w-full accent-emerald-600 h-[1dvh] bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} 100%)`,
              }}
            />

            {/* Hızlı Birim Seçimi */}
            <div className="flex flex-wrap gap-[1dvh]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setServing(100);
                  setSelectionMode("gram");
                  setIsAdded(false);
                }}
                className={`flex-1 min-w-[60px] py-[1.2dvh] sm:py-3 px-1 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all duration-200 ${
                  selectionMode === "gram"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                }`}
              >
                <span className="truncate">{unitLabel}</span>
              </button>
              {units.map((unit, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setServing(Number(unit.grams));
                    setSelectionMode("unit");
                    setActiveUnit(unit);
                    setIsAdded(false);
                  }}
                  className={`flex-1 min-w-[60px] py-[1.2dvh] sm:py-3 px-1 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all duration-200 ${
                    selectionMode === "unit" && activeUnit?.name === unit.name
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <span className="truncate">
                    {unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Makro kartları - %25 pay */}
        <div className="mt-auto grid grid-cols-2 gap-[1dvh] sm:gap-[3dvh]">
          <MacroCard
            icon={<Flame className="w-5 h-5 text-red-500" />}
            label="Kalori"
            value={calc(food.calories_per_100g)}
            unit="kcal"
            bg="bg-red-50 dark:bg-red-950/30"
          />
          <MacroCard
            icon={<Beef className="w-5 h-5 text-blue-500" />}
            label="Protein"
            value={calc(food.protein_g_per_100g)}
            unit="g"
            bg="bg-blue-50 dark:bg-blue-950/30"
          />
          <MacroCard
            icon={<Wheat className="w-5 h-5 text-yellow-500" />}
            label="Karbonhidrat"
            value={calc(food.carbs_g_per_100g)}
            unit="g"
            bg="bg-yellow-50 dark:bg-yellow-950/30"
          />
          <MacroCard
            icon={<Droplets className="w-5 h-5 text-orange-500" />}
            label="Yağ"
            value={calc(food.fat_g_per_100g)}
            unit="g"
            bg="bg-orange-50 dark:bg-orange-950/30"
          />
        </div>
      </div>

      {/* Sabit Alt Bar - %10 pay */}
      <div className="h-[calc(8dvh+env(safe-area-inset-bottom))] flex items-center bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] shrink-0">
        <div className="w-full max-w-lg mx-auto px-5">
          {user ? (
            <div className="flex gap-3">
              <Button
                variant={isAdded ? "secondary" : "cta"}
                className="flex-1 h-[6dvh] sm:h-[6dvh]"
                onClick={() => setIsAddModalOpen(true)}
                disabled={serving <= 0}
              >
                {isAdded ? "Öğüne Eklendi!" : "Öğününe Ekle"}
              </Button>
              <Button
                variant={isAdded ? "cta" : "secondary"}
                className="flex-1 h-[6dvh] sm:h-[6dvh]"
                to="/meals"
              >
                Öğünlerime Dön
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              className="w-full h-[8dvh] sm:h-[6dvh]"
              onClick={() => setIsAuthModalOpen(true)}
              disabled={serving <= 0}
            >
              Giriş Yap
            </Button>
          )}
        </div>
      </div>

      {/* Görsel Zoom Lightbox (Portal alternatifi inline overlay) */}
      {isZoomed && food.image_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[110]"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="w-full h-full p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={food.image_url}
              alt={food.name}
              className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {food && (
        <AddToMealModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => setIsAdded(true)}
          food={food}
          grams={serving}
        />
      )}
    </div>
  );
}

function MacroCard({
  icon,
  label,
  value,
  unit,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  bg: string;
}) {
  return (
    <div
      className={`${bg} rounded-xl p-[2dvh] flex flex-col gap-[0.5dvh] shrink-0`}
    >
      <div className="flex items-center gap-[1dvh]">
        <div className="shrink-0 scale-90 sm:scale-100">{icon}</div>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
          {label}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
        {value}
        <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}
