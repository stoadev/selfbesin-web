import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Save, Utensils, Apple } from "lucide-react";
import Modal from "../common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { foodService } from "../../services/food.service";
import type { Food, MealWithFoods, FoodUnit } from "../../types";
import Button from "../common/Button";
import ConfirmModal from "../common/ConfirmModal";
import Loading from "../common/Loading";
import FoodAmountSelectionModal from "./FoodAmountSelectionModal";

type SelectedFood = {
  food: Food;
  grams: number;
};

type AddMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mealToEdit?: MealWithFoods | null;
};

function AddMealModalContent({
  onClose,
  onSuccess,
  mealToEdit,
}: {
  onClose: () => void;
  onSuccess: () => void;
  mealToEdit?: MealWithFoods | null;
}) {
  const { user } = useAuth();
  const [mealName, setMealName] = useState(mealToEdit?.name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>(
    mealToEdit?.meal_foods
      ?.filter((mf) => mf.food)
      .map((mf) => ({
        food: mf.food!,
        grams: mf.grams,
      })) || [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [foodToSelectAmount, setFoodToSelectAmount] = useState<Food | null>(
    null,
  );

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
    setFoodToSelectAmount(food);
  };

  const onConfirmAmount = (grams: number) => {
    if (!foodToSelectAmount) return;

    setSelectedFoods((prev) => {
      const existing = prev.find((sf) => sf.food.id === foodToSelectAmount.id);
      if (existing) {
        // GÜNCELLEME (Ekleme değil, miktar değiştirme)
        return prev.map((sf) =>
          sf.food.id === foodToSelectAmount.id ? { ...sf, grams } : sf,
        );
      }
      return [...prev, { food: foodToSelectAmount, grams }];
    });
    setSearchQuery("");
    setSearchResults([]);
    setFoodToSelectAmount(null);
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((sf) => sf.food.id !== foodId));
  };

  const calculateMacros = () => {
    return selectedFoods.reduce(
      (acc, sf) => {
        if (!sf.food) return acc;
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
    if (!user || !mealName.trim()) return;

    setIsSubmitting(true);
    try {
      let mealId = mealToEdit?.id;

      if (mealToEdit) {
        // 1. Update Meal Name
        const { error: updateError } = await supabase
          .from("meals")
          .update({ name: mealName.trim() })
          .eq("id", mealToEdit.id);

        if (updateError) throw updateError;

        // 2. Delete Existing Foods
        const { error: deleteError } = await supabase
          .from("meal_foods")
          .delete()
          .eq("meal_id", mealToEdit.id);

        if (deleteError) throw deleteError;
      } else {
        // 1. Create New Meal
        const { data: meal, error: mealError } = await supabase
          .from("meals")
          .insert([{ user_id: user.id, name: mealName.trim() }])
          .select()
          .single();

        if (mealError) throw mealError;
        mealId = meal.id;
      }

      // 2. Insert Meal Foods
      const mealFoodsToInsert = selectedFoods
        .filter((sf) => sf.food)
        .map((sf) => {
          const factor = sf.grams / 100;
          return {
            meal_id: mealId,
            food_id: sf.food.id,
            grams: sf.grams,
            calories: sf.food.calories_per_100g * factor,
            protein: sf.food.protein_g_per_100g * factor,
            carbs: sf.food.carbs_g_per_100g * factor,
            fat: sf.food.fat_g_per_100g * factor,
          };
        });

      if (mealFoodsToInsert.length > 0) {
        const { error: foodsError } = await supabase
          .from("meal_foods")
          .insert(mealFoodsToInsert);

        if (foodsError) throw foodsError;
      }

      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving meal:", error);
      alert("Öğün kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!mealToEdit || !user) return;
    setShowDeleteConfirm(false);

    setIsSubmitting(true);
    try {
      // Meal Foods'lar veritabanında cascade delete değilse manuel silmek gerekebilir.
      // Ancak genellikle setup'ımızda meals silinince bağlı meal_foods'lar silinir.
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealToEdit.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("Öğün silinirken bir hata oluştu.");
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
      {isSubmitting && <Loading />}
      <div className="p-[3dvh] border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" />
          {mealToEdit ? "Öğünü Düzenle" : "Yeni Öğün Ekle"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-[3dvh] flex flex-col gap-[3dvh]">
        {/* Meal Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Öğün İsmi
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Sabah Kahvaltısı"
            className="w-full h-[6dvh] min-h-[44px] px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
              className="w-full h-[6dvh] min-h-[44px] pl-12 pr-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loading fullScreen={false} backdrop={false} className="p-0" />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-[1dvh] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl max-h-[30dvh] overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  className="w-full flex items-center justify-between p-[2dvh] px-[4dvw] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800"
                  onClick={() => handleAddFood(food)}
                >
                  <div className="flex items-center gap-3">
                    <Apple className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {food.brand && food.brand !== "Genel"
                        ? `${food.brand} ${food.name}`
                        : food.name}
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
                onClick={() => handleAddFood(sf.food)} // Mevcut handleAddFood modalı açıyor
                className="flex items-center gap-4 p-[2dvh] rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {sf.food.name}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-tight mt-1">
                    <span className="text-red-500">
                      {Math.round(sf.food.calories_per_100g * (sf.grams / 100))}{" "}
                      kcal
                    </span>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <span className="text-blue-500">
                      P:{" "}
                      {Math.round(
                        sf.food.protein_g_per_100g * (sf.grams / 100),
                      )}
                      g
                    </span>
                    <span className="text-yellow-500">
                      K:{" "}
                      {Math.round(sf.food.carbs_g_per_100g * (sf.grams / 100))}g
                    </span>
                    <span className="text-orange-500">
                      Y: {Math.round(sf.food.fat_g_per_100g * (sf.grams / 100))}
                      g
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 px-2 h-8">
                    <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {(() => {
                        let units: FoodUnit[] = [];
                        try {
                          units = Array.isArray(sf.food.serving_units)
                            ? sf.food.serving_units
                            : typeof sf.food.serving_units === "string"
                              ? JSON.parse(sf.food.serving_units)
                              : [];
                        } catch (e) {
                          console.error("Scale parsing error:", e);
                          units = [];
                        }

                        const matchingUnit = units.find(
                          (u) =>
                            sf.grams % u.grams === 0 ||
                            u.grams % sf.grams === 0,
                        );
                        if (matchingUnit && matchingUnit.grams > 0) {
                          const count = (sf.grams / matchingUnit.grams)
                            .toFixed(1)
                            .replace(".0", "");
                          return `${count} ${matchingUnit.name}`;
                        }
                        return `${sf.grams}g`;
                      })()}
                    </span>
                    {(() => {
                      let units: FoodUnit[] = [];
                      try {
                        units = Array.isArray(sf.food.serving_units)
                          ? sf.food.serving_units
                          : typeof sf.food.serving_units === "string"
                            ? JSON.parse(sf.food.serving_units)
                            : [];
                      } catch (e) {
                        console.error("Scale parsing error:", e);
                        units = [];
                      }

                      const hasUnit = units.some(
                        (u) =>
                          sf.grams % u.grams === 0 || u.grams % sf.grams === 0,
                      );
                      return hasUnit ? (
                        <span className="text-[9px] font-bold text-gray-400 ml-1">
                          ({sf.grams}g)
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Modalın açılmasını engelle
                      handleRemoveFood(sf.food.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-[5dvh] px-[2dvw] text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
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
      <div className="p-[2dvh] sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
        <div className="grid grid-cols-4 gap-[1dvw] mb-[2dvh] sm:mb-[3dvw] text-center">
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

        <div className="flex gap-3">
          {mealToEdit ? (
            <Button
              variant="redSecondary"
              className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              SİL
            </Button>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              İptal
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            className="flex-[2] h-[6dvh] min-h-[44px] flex items-center justify-center gap-2"
            disabled={!mealName.trim() || isSubmitting}
            loading={isSubmitting}
          >
            <Save className="w-4 h-4" />
            {mealToEdit ? "Güncelle" : "Öğünü Kaydet"}
          </Button>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteMeal}
        title="Öğünü Sil"
        message="Bu öğünü ve içindeki tüm besinleri silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmText="Öğünü Sil"
        cancelText="Vazgeç"
        variant="danger"
        isLoading={isSubmitting}
      />

      <FoodAmountSelectionModal
        key={foodToSelectAmount?.id}
        isOpen={!!foodToSelectAmount}
        onClose={() => setFoodToSelectAmount(null)}
        food={foodToSelectAmount}
        onConfirm={onConfirmAmount}
        initialGrams={
          selectedFoods.find((sf) => sf.food.id === foodToSelectAmount?.id)
            ?.grams
        }
      />
    </form>
  );
}

export default function AddMealModal({
  isOpen,
  onClose,
  onSuccess,
  mealToEdit,
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
      <AddMealModalContent
        key={mealToEdit?.id || "new"}
        onClose={onClose}
        onSuccess={onSuccess}
        mealToEdit={mealToEdit}
      />
    </Modal>
  );
}
