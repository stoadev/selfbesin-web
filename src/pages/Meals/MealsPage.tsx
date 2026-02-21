import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Utensils,
  Calendar,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Edit2,
  Copy,
  Trash,
} from "lucide-react";
import SwipeableItem from "../../components/common/SwipeableItem";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Button from "../../components/common/Button";
import AddMealModal from "../../components/meals/AddMealModal";
import MealViewModal from "../../components/meals/MealViewModal";
import FoodAmountSelectionModal from "../../components/meals/FoodAmountSelectionModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import type { MealWithFoods, Food, MealFood } from "../../types";

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithFoods[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealWithFoods | null>(null);
  const [mealToEdit, setMealToEdit] = useState<MealWithFoods | null>(null);
  const [foodToEditAmount, setFoodToEditAmount] = useState<Food | null>(null);
  const [editingMealFoodId, setEditingMealFoodId] = useState<string | null>(
    null,
  );

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const fetchMeals = useCallback(async () => {
    if (!user) return [];
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("meals")
        .select(
          `
          *,
          meal_foods (
            *,
            food:foods (*)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const fetchedMeals = data || [];
      setMeals(fetchedMeals);
      return fetchedMeals;
    } catch (error) {
      console.error("Error fetching meals:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const dailyTotals = meals.reduce(
    (acc, meal) => {
      const mealTotals = meal.meal_foods.reduce(
        (mAcc, mf) => ({
          calories: mAcc.calories + mf.calories,
          protein: mAcc.protein + mf.protein,
          carbs: mAcc.carbs + (mf.carbs || 0),
          fat: mAcc.fat + mf.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
      return {
        calories: acc.calories + mealTotals.calories,
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleMealClick = (meal: MealWithFoods) => {
    setSelectedMeal(meal);
    setIsViewModalOpen(true);
  };

  const handleFoodClickFromView = (mf: MealFood) => {
    if (!mf.food) return;
    setEditingMealFoodId(mf.id);
    setFoodToEditAmount(mf.food);
  };

  const handleUpdateMealFoodGrams = async (grams: number) => {
    if (!editingMealFoodId || !foodToEditAmount) return;

    try {
      const factor = grams / 100;
      const { error } = await supabase
        .from("meal_foods")
        .update({
          grams,
          calories: foodToEditAmount.calories_per_100g * factor,
          protein: foodToEditAmount.protein_g_per_100g * factor,
          carbs: foodToEditAmount.carbs_g_per_100g * factor,
          fat: foodToEditAmount.fat_g_per_100g * factor,
        })
        .eq("id", editingMealFoodId);

      if (error) throw error;

      const updatedMeals = await fetchMeals();

      if (selectedMeal) {
        const found = updatedMeals.find((m) => m.id === selectedMeal.id);
        if (found) setSelectedMeal(found);
      }
    } catch (error) {
      console.error("Error updating food grams:", error);
      alert("Miktar güncellenirken bir hata oluştu.");
    } finally {
      setEditingMealFoodId(null);
      setFoodToEditAmount(null);
    }
  };

  const handleDeleteMealFood = async () => {
    if (!editingMealFoodId) return;

    setConfirmModal({
      isOpen: true,
      title: "Besini Sil",
      message: "Bu besini öğünden silmek istediğine emin misin?",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const { error } = await supabase
            .from("meal_foods")
            .delete()
            .eq("id", editingMealFoodId);

          if (error) throw error;

          const updatedMeals = await fetchMeals();

          if (selectedMeal) {
            const found = updatedMeals.find((m) => m.id === selectedMeal.id);
            if (found) setSelectedMeal(found);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting meal food:", error);
          alert("Besin silinirken bir hata oluştu.");
        } finally {
          setEditingMealFoodId(null);
          setFoodToEditAmount(null);
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      title: "Öğünü Sil",
      message: "Bu öğünü silmek istediğine emin misin?",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const { error } = await supabase
            .from("meals")
            .delete()
            .eq("id", mealId);

          if (error) throw error;
          await fetchMeals();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting meal:", error);
          alert("Öğün silinirken bir hata oluştu.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleDuplicateMeal = async (meal: MealWithFoods) => {
    if (!user) return;
    try {
      const { data: newMeal, error: mealError } = await supabase
        .from("meals")
        .insert([{ user_id: user.id, name: `${meal.name} (Kopya)` }])
        .select()
        .single();

      if (mealError) throw mealError;

      if (meal.meal_foods.length > 0) {
        const mealFoodsToInsert = meal.meal_foods.map((mf) => ({
          meal_id: newMeal.id,
          food_id: mf.food_id,
          grams: mf.grams,
          calories: mf.calories,
          protein: mf.protein,
          carbs: mf.carbs,
          fat: mf.fat,
        }));

        const { error: foodsError } = await supabase
          .from("meal_foods")
          .insert(mealFoodsToInsert);

        if (foodsError) throw foodsError;
      }

      await fetchMeals();
    } catch (error) {
      console.error("Error duplicating meal:", error);
      alert("Öğün çoğaltılırken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-[3dvw] sm:px-6 lg:px-8 h-full flex flex-col overflow-hidden py-[2dvh]">
        <header className="mb-[2dvh] shrink-0">
          <div className="flex items-center justify-between mb-[1dvh]">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Öğün Seç
            </h1>
            <Button
              variant="cta"
              className="h-[5dvh] min-h-[36px] px-3 flex items-center justify-center whitespace-nowrap"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="text-xs font-bold">Öğün Ekle</span>
            </Button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
            Günlük beslenme takibini buradan yönetebilirsin.
          </p>
        </header>

        {/* Günlük Toplam Özet (Daha Kompakt) */}
        {meals.length > 0 && (
          <div className="mb-[3dvh] grid grid-cols-4 gap-[2dvw] sm:gap-3 bg-white dark:bg-gray-900 p-[1.5dvh] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
            <div className="flex flex-col items-center justify-center py-[0.8dvh] rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100/30 dark:border-red-900/10">
              <div className="flex items-center gap-1 mb-0.5">
                <Flame className="w-2.5 h-2.5 text-red-500" />
                <span className="text-[7px] font-black uppercase tracking-tight text-red-400">
                  Kcal
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-red-600 dark:text-red-400">
                {Math.round(dailyTotals.calories)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100/30 dark:border-blue-900/10">
              <div className="flex items-center gap-1 mb-0.5">
                <Beef className="w-2.5 h-2.5 text-blue-500" />
                <span className="text-[7px] font-black uppercase tracking-tight text-blue-400">
                  Protein
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400">
                {Math.round(dailyTotals.protein)}g
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 rounded-xl bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-100/30 dark:border-yellow-900/10">
              <div className="flex items-center gap-1 mb-0.5">
                <Wheat className="w-2.5 h-2.5 text-yellow-500" />
                <span className="text-[7px] font-black uppercase tracking-tight text-yellow-400">
                  Karb
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-yellow-600 dark:text-yellow-400">
                {Math.round(dailyTotals.carbs)}g
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-100/30 dark:border-orange-900/10">
              <div className="flex items-center gap-1 mb-0.5">
                <Droplets className="w-2.5 h-2.5 text-orange-500" />
                <span className="text-[7px] font-black uppercase tracking-tight text-orange-400">
                  Yağ
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-orange-600 dark:text-orange-400">
                {Math.round(dailyTotals.fat)}g
              </span>
            </div>
          </div>
        )}

        {meals.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-[5dvh] sm:p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Henüz öğün eklememişsin
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              Besinleri arayarak ilk öğününü oluşturabilirsin.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative mb-[1dvh]">
            <div className="h-[50dvh] sm:h-[60dvh] inset-0 overflow-y-auto scrollbar-hide border-2 border-gray-50 dark:border-gray-800/50 rounded-[2rem] p-[1dvh] bg-gray-100 dark:bg-gray-900/10 shadow-inner">
              <div className="space-y-[1dvh]">
                {meals.map((meal) => (
                  <SwipeableItem
                    key={meal.id}
                    actions={[
                      {
                        label: "Düzenle",
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                          setMealToEdit(meal);
                          setIsModalOpen(true);
                        },
                        color: "bg-emerald-500",
                        className: "rounded-l-3xl",
                      },
                      {
                        label: "Sil",
                        icon: <Trash className="w-4 h-4" />,
                        onClick: () => {
                          handleDeleteMeal(meal.id);
                        },
                        color: "bg-red-500",
                      },
                      {
                        label: "Çoğalt",
                        icon: <Copy className="w-4 h-4" />,
                        onClick: () => handleDuplicateMeal(meal),
                        color: "bg-blue-500",
                        className: "rounded-r-3xl",
                      },
                    ]}
                  >
                    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
                      <div
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/30"
                        onClick={() => handleMealClick(meal)}
                      >
                        <div className="flex items-center gap-[1dvh] sm:gap-[2dvh] min-w-0">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
                              {meal.name}
                            </h3>
                            <div className="flex items-center gap-[1dvh] sm:gap-[2dvh] text-[10px] text-gray-400 dark:text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(meal.created_at).toLocaleDateString(
                                "tr-TR",
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="w-[25dvh] shrink-0">
                          <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700 px-[1.5dvh] sm:px-3 py-[0.5dvh] sm:py-1.5 h-full">
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                Kcal
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-red-500">
                                {Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.calories,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="w-px h-3 sm:h-4 bg-gray-200 dark:bg-gray-700" />
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                Prot
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-blue-500">
                                {Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.protein,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="w-px h-3 sm:h-4 bg-gray-200 dark:bg-gray-700" />
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                Karb
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-yellow-500">
                                {Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + (mf.carbs || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="w-px h-3 sm:h-4 bg-gray-200 dark:bg-gray-700" />
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                Yağ
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-orange-500">
                                {Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.fat,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwipeableItem>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setMealToEdit(null);
        }}
        onSuccess={async () => {
          const updatedMeals = await fetchMeals();
          if (mealToEdit) {
            const updatedMeal = updatedMeals.find(
              (m) => m.id === mealToEdit.id,
            );
            if (updatedMeal) {
              setSelectedMeal(updatedMeal);
              setIsViewModalOpen(true);
            }
          }
        }}
        mealToEdit={mealToEdit}
      />

      <MealViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedMeal(null);
        }}
        meal={selectedMeal}
        onEdit={() => {
          if (selectedMeal) {
            setIsViewModalOpen(false);
            setMealToEdit(selectedMeal);
            setIsModalOpen(true);
          }
        }}
        onFoodClick={handleFoodClickFromView}
      />

      <FoodAmountSelectionModal
        key={editingMealFoodId}
        isOpen={!!foodToEditAmount}
        onClose={() => {
          setFoodToEditAmount(null);
          setEditingMealFoodId(null);
        }}
        food={foodToEditAmount}
        onConfirm={handleUpdateMealFoodGrams}
        onDelete={handleDeleteMealFood}
        initialGrams={
          selectedMeal?.meal_foods.find((mf) => mf.id === editingMealFoodId)
            ?.grams
        }
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={confirmModal.isLoading}
      />
    </>
  );
}
