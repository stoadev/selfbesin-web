import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Beef, Wheat, Droplets } from "lucide-react";
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
  const [serving, setServing] = useState(100);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    async function fetchFood() {
      if (!slug) return;
      setLoading(true);
      const data = await foodService.getFoodBySlug(slug);
      setFood(data);
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

  const isUnitSelected = (unitCount: number) => {
    if (!food.serving_unit_grams) return false;
    return Math.abs(serving - food.serving_unit_grams * unitCount) < 1;
  };

  return (
    <>
      {/* Üst bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {food.name}
        </h1>
      </div>

      <div className="w-full max-lg mx-auto px-5 py-8 flex flex-col gap-8 pb-32">
        {/* Porsiyon seçici */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {food.serving_unit_name
                ? `${food.serving_unit_name.charAt(0).toUpperCase() + food.serving_unit_name.slice(1)} / Gram`
                : "Porsiyon (gram)"}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600">
                {serving}g
              </span>
              {food.serving_unit_name && food.serving_unit_grams && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  (
                  {(serving / food.serving_unit_grams)
                    .toFixed(1)
                    .replace(".0", "")}{" "}
                  {food.serving_unit_name})
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={serving}
              onChange={(e) => {
                setServing(Number(e.target.value));
                setIsAdded(false);
              }}
              className="flex-1 accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                  ((serving - 10) / (500 - 10)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} ${
                  ((serving - 10) / (500 - 10)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} 100%)`,
              }}
            />

            {/* Hızlı Birim Seçimi */}
            {food.serving_unit_name && food.serving_unit_grams && (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((unitCount) => (
                  <button
                    key={unitCount}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setServing(food.serving_unit_grams! * unitCount);
                      setIsAdded(false);
                    }}
                    className={`flex-1 py-3 px-1 rounded-xl border text-[10px] font-bold transition-all duration-200 ${
                      isUnitSelected(unitCount)
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}
                  >
                    {unitCount} {food.serving_unit_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Makro kartları */}
        <div className="grid grid-cols-2 gap-3">
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
