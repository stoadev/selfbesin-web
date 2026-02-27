import { useState, useEffect, useCallback } from "react";
import { Utensils, Check, Save } from "lucide-react";
import Modal from "../common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useMeals } from "../../hooks/useMeals";
import Loading from "../common/Loading";
import type { Food, Meal, FoodUnit } from "../../types";
import { getBasisLabel } from "../../types";
import Button from "../common/Button";

type AddToMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  food: Food;
  grams: number;
};

export default function AddToMealModal({
  isOpen,
  onClose,
  onSuccess,
  food,
  grams,
}: AddToMealModalProps) {
  const { user } = useAuth();
  const { refreshMeals } = useMeals();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMeals(data || []);
      if (data && data.length > 0) {
        setSelectedMealId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchMeals();
    }
  }, [isOpen, user, fetchMeals]);

  const calculateMacros = () => {
    const factor = grams / 100;
    return {
      calories: food.calories_per_100g * factor,
      protein: food.protein_g_per_100g * factor,
      carbs: food.carbs_g_per_100g * factor,
      fat: food.fat_g_per_100g * factor,
    };
  };

  async function handleAddFood() {
    if (!user || !selectedMealId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Mevcut kaydı sorgula
      const { data: existingEntry, error: fetchError } = await supabase
        .from("meal_foods")
        .select("*")
        .eq("meal_id", selectedMealId)
        .eq("food_id", food.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingEntry) {
        // 2. Varsa güncelle (UPDATE)
        const newGrams = existingEntry.grams + grams;
        const factor = newGrams / 100;

        const { error: updateError } = await supabase
          .from("meal_foods")
          .update({
            grams: newGrams,
            calories: food.calories_per_100g * factor,
            protein: food.protein_g_per_100g * factor,
            carbs: food.carbs_g_per_100g * factor,
            fat: food.fat_g_per_100g * factor,
          })
          .eq("id", existingEntry.id);

        if (updateError) throw updateError;
      } else {
        // 3. Yoksa yeni ekle (INSERT)
        const factor = grams / 100;
        const { error: insertError } = await supabase
          .from("meal_foods")
          .insert([
            {
              meal_id: selectedMealId,
              food_id: food.id,
              grams: grams,
              calories: food.calories_per_100g * factor,
              protein: food.protein_g_per_100g * factor,
              carbs: food.carbs_g_per_100g * factor,
              fat: food.fat_g_per_100g * factor,
            },
          ]);

        if (insertError) throw insertError;
      }

      await refreshMeals();
      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error handling food to meal:", error);
      alert("Besin eklenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[400px]">
      {isSubmitting && <Loading />}
      <div className="p-6 flex flex-col gap-6">
        {/* Header (Manüel) */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Öğününe Ekle
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Besini hangi öğününe eklemek istersin?
          </p>
        </div>

        {/* Seçili Besin Özeti */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm">
            <Utensils className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {food.name}
              {food.qualifier && food.qualifier.length > 0 && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                  {food.qualifier.join(" ")}
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {grams}
              {getBasisLabel(food).unit} •{" "}
              <span className="text-red-500 font-bold">
                {Math.round(food.calories_per_100g * (grams / 100))} kcal
              </span>
              {(() => {
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

                const matchingUnit = units.find(
                  (u) => grams % u.grams === 0 || u.grams % grams === 0,
                );
                if (matchingUnit && matchingUnit.grams > 0) {
                  const count = (grams / matchingUnit.grams)
                    .toFixed(1)
                    .replace(".0", "");
                  return (
                    <span className="ml-1 text-[10px] font-bold text-gray-400">
                      ({count} {matchingUnit.name})
                    </span>
                  );
                }
                return null;
              })()}
            </p>
          </div>
        </div>

        {/* Öğün Listesi */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
            Hangi Öğüne Eklensin?
          </label>
          {meals.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Henüz bir öğün oluşturmamışsın.
              </p>
              <Button to="/meals" variant="secondary" size="sm">
                Öğün Oluşturmaya Git
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-hide">
              {meals.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => setSelectedMealId(meal.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    selectedMealId === meal.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                      : "border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {meal.name}
                  </span>
                  {selectedMealId === meal.id && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Makro Özet */}
        {(() => {
          const totals = calculateMacros();
          return (
            <div className="grid grid-cols-4 gap-2 mb-4 sm:mb-6 text-center border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Kalori
                </span>
                <span className="text-sm font-bold text-red-500">
                  {Math.round(totals.calories)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Protein
                </span>
                <span className="text-sm font-bold text-blue-500">
                  {Math.round(totals.protein)}g
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Karb.
                </span>
                <span className="text-sm font-bold text-yellow-500">
                  {Math.round(totals.carbs)}g
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Yağ
                </span>
                <span className="text-sm font-bold text-orange-500">
                  {Math.round(totals.fat)}g
                </span>
              </div>
            </div>
          );
        })()}

        {/* Butonlar */}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="bluePrimary"
            className="flex-[2] py-3 h-12"
            disabled={!selectedMealId || isSubmitting}
            loading={isSubmitting}
            onClick={handleAddFood}
          >
            <Save className="w-4 h-4 mr-2" />
            Öğüne Ekle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
