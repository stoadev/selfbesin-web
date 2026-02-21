import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Utensils,
  X,
} from "lucide-react";
import { foodService } from "../../services/food.service";
import type { Food } from "../../types";
import Button from "../../components/common/Button";
import AuthModal from "../../components/common/AuthModal";
import AddToMealModal from "../../components/meals/AddToMealModal";
import { useAuth } from "../../hooks/useAuth";

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

  useEffect(() => {
    async function fetchFood() {
      if (!slug) return;
      setLoading(true);
      const data = await foodService.getFoodBySlug(slug);
      setFood(data);

      // Varsayılan porsiyonu her zaman 100g olarak ayarla
      setServing(100);
      setSelectionMode("gram");

      setLoading(false);
    }
    fetchFood();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
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

  // Slider değerleri
  const sliderMin = 0;
  const sliderMax = selectionMode === "gram" ? 500 : 10;
  const sliderStep = selectionMode === "gram" ? 5 : 1;
  const sliderValue =
    selectionMode === "gram"
      ? serving
      : food?.serving_unit_grams
        ? serving / food.serving_unit_grams
        : 1;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {food.name}
        </h1>
      </div>

      <div className="w-full max-w-lg mx-auto px-5 py-6 flex flex-col gap-4 pb-10">
        {/* Daraltılmış ve kompakt Hero Görsel Kartı - Sadece ekran yüksekliği yeterliyse gösterilir */}
        <div
          onClick={() => food.image_url && setIsZoomed(true)}
          className={`show-on-tall w-[100%] mx-auto h-48 sm:h-56 rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-100/30 dark:border-emerald-500/10 shadow-sm overflow-hidden items-center justify-center relative ${food.image_url ? "cursor-zoom-in active:scale-[0.98] transition-transform" : ""}`}
        >
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <Utensils className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-200 uppercase tracking-widest">
                Görsel Yok
              </span>
            </div>
          )}

          {/* Dekoratif Gradyan Overlay (Sadece Resim Varsa) */}
          {food.image_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
          )}
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
        {/* Porsiyon seçici */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {selectionMode === "unit" && food.serving_unit_name
                ? `${food.serving_unit_name.charAt(0).toUpperCase() + food.serving_unit_name.slice(1)}`
                : "Ağırlık (gram)"}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600">
                {selectionMode === "unit" && food.serving_unit_grams
                  ? (serving / food.serving_unit_grams)
                      .toFixed(1)
                      .replace(".0", "")
                  : `${serving}g`}
              </span>
              {selectionMode === "unit" && food.serving_unit_name && (
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">
                  {food.serving_unit_name} ({serving}g)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
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
                } else if (food.serving_unit_grams) {
                  setServing(val * food.serving_unit_grams);
                }
                setIsAdded(false);
              }}
              className="flex-1 accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} 100%)`,
              }}
            />

            {/* Hızlı Birim Seçimi */}
            <div className="flex gap-2">
              {[
                {
                  label: "Gram",
                  grams: 100,
                  mode: "gram" as const,
                },
                ...(food.serving_unit_name && food.serving_unit_grams
                  ? [
                      {
                        label:
                          food.serving_unit_name.charAt(0).toUpperCase() +
                          food.serving_unit_name.slice(1),
                        grams: food.serving_unit_grams,
                        mode: "unit" as const,
                      },
                    ]
                  : []),
              ].map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setServing(option.grams);
                    setSelectionMode(option.mode);
                    setIsAdded(false);
                  }}
                  className={`flex-1 py-3 px-1 rounded-xl border text-[11px] font-bold transition-all duration-200 ${
                    selectionMode === option.mode
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Makro kartları - Mobilde 2x2, PC'de 4x1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Sabit Alt Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-5 py-4">
          {user ? (
            <div className="flex gap-3">
              <Button
                variant={isAdded ? "blueSecondary" : "blueCta"}
                className="flex-1 h-12"
                onClick={() => setIsAddModalOpen(true)}
                disabled={serving <= 0}
              >
                {isAdded ? "Besin öğüne eklendi" : "Öğününe Ekle"}
              </Button>
              <Button variant="cta" className="flex-1 h-12" to="/meals">
                Öğünlerime Dön
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              className="w-full h-12"
              onClick={() => setIsAuthModalOpen(true)}
              disabled={serving <= 0}
            >
              Giriş Yap
            </Button>
          )}
        </div>
      </div>

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
    </>
  );
}

// Küçük yardımcı bileşen
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
    <div className={`${bg} rounded-2xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
