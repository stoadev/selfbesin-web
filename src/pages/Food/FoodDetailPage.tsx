import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { foodService } from "../../services/food.service";
import type { Food } from "../../types";

export default function FoodDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [serving, setServing] = useState(100);

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

      <div className="w-full max-w-lg mx-auto px-5 py-8 flex flex-col gap-8">
        {/* Porsiyon seçici */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Porsiyon (gram)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={serving}
              onChange={(e) => setServing(Number(e.target.value))}
              className="flex-1 accent-emerald-600"
            />
            <span className="text-sm font-bold text-emerald-600 w-14 text-right">
              {serving}g
            </span>
          </div>
        </div>

        {/* Makro kartları */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Kalori"
            value={calc(food.calories_per_100g)}
            unit="kcal"
            bg="bg-orange-50 dark:bg-orange-950/30"
          />
          <MacroCard
            icon={<Beef className="w-5 h-5 text-red-500" />}
            label="Protein"
            value={calc(food.protein_g_per_100g)}
            unit="g"
            bg="bg-red-50 dark:bg-red-950/30"
          />
          <MacroCard
            icon={<Wheat className="w-5 h-5 text-yellow-500" />}
            label="Karbonhidrat"
            value={calc(food.carbs_g_per_100g)}
            unit="g"
            bg="bg-yellow-50 dark:bg-yellow-950/30"
          />
          <MacroCard
            icon={<Droplets className="w-5 h-5 text-blue-500" />}
            label="Yağ"
            value={calc(food.fat_g_per_100g)}
            unit="g"
            bg="bg-blue-50 dark:bg-blue-950/30"
          />
        </div>

        {/* Giriş yap CTA */}
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bu besini günlük diyetine eklemek için giriş yap.
          </p>
          <Link
            to="/"
            className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-700 transition-colors inline-block"
          >
            Aramaya Dön
          </Link>
        </div>
      </div>
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
