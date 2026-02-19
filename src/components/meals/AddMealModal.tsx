import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Save, Utensils, Apple } from "lucide-react";
import Modal from "../common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { foodService } from "../../services/food.service";
import type { Food } from "../../types";
import Button from "../common/Button";

type SelectedFood = {
  food: Food;
  grams: number;
};

type AddMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function AddMealModalContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [mealName, setMealName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search foods as user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await foodService.searchFoods(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddFood = (food: Food) => {
    if (!selectedFoods.find((sf) => sf.food.id === food.id)) {
      setSelectedFoods([...selectedFoods, { food, grams: 100 }]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((sf) => sf.food.id !== foodId));
  };

  const handleUpdateGrams = (foodId: string, grams: number) => {
    setSelectedFoods(
      selectedFoods.map((sf) =>
        sf.food.id === foodId ? { ...sf, grams: Math.max(0, grams) } : sf,
      ),
    );
  };

  const calculateMacros = () => {
    return selectedFoods.reduce(
      (acc, sf) => {
        const factor = sf.grams / 100;
        return {
          calories: acc.calories + sf.food.calories_per_100g * factor,
          protein: acc.protein + sf.food.protein_g_per_100g * factor,
          carbs: acc.carbs + sf.food.carbs_g_per_100g * factor,
          fat: acc.fat + sf.food.fat_g_per_100g * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mealName.trim() || selectedFoods.length === 0) return;

    setIsSubmitting(true);
    try {
      // 1. Create Meal
      const { data: meal, error: mealError } = await supabase
        .from("meals")
        .insert([{ user_id: user.id, name: mealName.trim() }])
        .select()
        .single();

      if (mealError) throw mealError;

      // 2. Create Meal Foods
      const mealFoodsToInsert = selectedFoods.map((sf) => {
        const factor = sf.grams / 100;
        return {
          meal_id: meal.id,
          food_id: sf.food.id,
          grams: sf.grams,
          calories: sf.food.calories_per_100g * factor,
          protein: sf.food.protein_g_per_100g * factor,
          carbs: sf.food.carbs_g_per_100g * factor,
          fat: sf.food.fat_g_per_100g * factor,
        };
      });

      const { error: foodsError } = await supabase
        .from("meal_foods")
        .insert(mealFoodsToInsert);

      if (foodsError) throw foodsError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating meal:", error);
      alert("Öğün kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateMacros();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" />
          Yeni Öğün Ekle
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Meal Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Öğün İsmi
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Sabah Kahvaltısı"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
          />
        </div>

        {/* Food Search */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Besin Ekle
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Besin ara..."
              className="w-full h-12 pl-12 pr-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800"
                  onClick={() => handleAddFood(food)}
                >
                  <div className="flex items-center gap-3">
                    <Apple className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {food.name}
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Foods List */}
        <div
          className={
            selectedFoods.length === 0 ? "flex-1 flex flex-col" : "space-y-3"
          }
        >
          {selectedFoods.length > 0 ? (
            selectedFoods.map((sf) => (
              <div
                key={sf.food.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {sf.food.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <span>
                      {Math.round(sf.food.calories_per_100g * (sf.grams / 100))}{" "}
                      kcal
                    </span>
                    <span>•</span>
                    <span>
                      P:{" "}
                      {Math.round(
                        sf.food.protein_g_per_100g * (sf.grams / 100),
                      )}
                      g
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 px-2 h-8">
                    <input
                      type="number"
                      className="w-12 bg-transparent text-center text-sm font-bold text-gray-900 dark:text-white outline-none"
                      value={sf.grams}
                      onChange={(e) =>
                        handleUpdateGrams(
                          sf.food.id,
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      g
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFood(sf.food.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-8 px-4 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Henüz besin eklenmedi
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                Yukarıdan besin arayarak öğününe ekleyebilirsin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Summary */}
      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
        <div className="grid grid-cols-4 gap-2 mb-4 sm:mb-6 text-center">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Kalori
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
              Karbon.
            </span>
            <span className="text-sm font-bold text-orange-500">
              {Math.round(totals.carbs)}g
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Yağ
            </span>
            <span className="text-sm font-bold text-red-500">
              {Math.round(totals.fat)}g
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-[2] h-12 flex items-center justify-center gap-2"
            disabled={
              !mealName.trim() || selectedFoods.length === 0 || isSubmitting
            }
            loading={isSubmitting}
          >
            <Save className="w-4 h-4" />
            Öğünü Kaydet
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function AddMealModal({
  isOpen,
  onClose,
  onSuccess,
}: AddMealModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      maxHeight="h-[80vh] sm:h-[600px]"
      showCloseButton={true}
      closeButtonClassName="top-6 right-6"
    >
      <AddMealModalContent onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}
