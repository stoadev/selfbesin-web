import { useState, useMemo } from "react";
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
import Loading from "../../components/common/Loading";
import SwipeableItem from "../../components/common/SwipeableItem";
import { useAuth } from "../../hooks/useAuth";
import { useMeals } from "../../hooks/useMeals";
import { supabase } from "../../lib/supabase";
import Button from "../../components/common/Button";
import AddMealModal from "../../components/meals/AddMealModal";
import MealViewModal from "../../components/meals/MealViewModal";
import AddFoodSearchModal from "../../components/meals/AddFoodSearchModal";
import FoodAmountSelectionModal from "../../components/meals/FoodAmountSelectionModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import type { MealWithFoods, Food, MealFood } from "../../types";

export default function MealsPage() {
  const { user } = useAuth();
  const { meals, loading, refreshMeals } = useMeals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealWithFoods | null>(null);
  const [mealToEdit, setMealToEdit] = useState<MealWithFoods | null>(null);
  const [foodToEditAmount, setFoodToEditAmount] = useState<Food | null>(null);
  const [editingMealFoodId, setEditingMealFoodId] = useState<string | null>(
    null,
  );
  const [isAddFoodSearchOpen, setIsAddFoodSearchOpen] = useState(false);
  const [foodToAdd, setFoodToAdd] = useState<Food | null>(null);

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

  const dailyTotals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        const foods = meal.meal_foods || [];
        const mealTotals = foods.reduce(
          (mAcc, mf) => ({
            calories: mAcc.calories + (mf.calories || 0),
            protein: mAcc.protein + (mf.protein || 0),
            carbs: mAcc.carbs + (mf.carbs || 0),
            fat: mAcc.fat + (mf.fat || 0),
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
  }, [meals]);

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
        .from("selfbesin_meal_foods")
        .update({
          grams,
          calories: foodToEditAmount.calories_per_100g * factor,
          protein: foodToEditAmount.protein_g_per_100g * factor,
          carbs: foodToEditAmount.carbs_g_per_100g * factor,
          fat: foodToEditAmount.fat_g_per_100g * factor,
        })
        .eq("id", editingMealFoodId);

      if (error) throw error;

      const updatedMeals = await refreshMeals();

      if (selectedMeal) {
        const found = updatedMeals.find((m) => m.id === selectedMeal.id);
        if (found) setSelectedMeal(found);
      }
    } catch (error) {
      console.error("Error updating food grams:", error);
      alert("Miktar güncellenirken bir hata oluştu.");
      throw error;
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
            .from("selfbesin_meal_foods")
            .delete()
            .eq("id", editingMealFoodId);

          if (error) throw error;

          await refreshMeals();

          if (selectedMeal) {
            const found = (await refreshMeals()).find(
              (m) => m.id === selectedMeal.id,
            );
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

  const handleAddFoodToMeal = async (grams: number) => {
    if (!foodToAdd || !selectedMeal) return;

    try {
      // Check if food already exists in meal
      const { data: existingEntry, error: fetchError } = await supabase
        .from("selfbesin_meal_foods")
        .select("*")
        .eq("meal_id", selectedMeal.id)
        .eq("food_id", foodToAdd.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingEntry) {
        const newGrams = existingEntry.grams + grams;
        const factor = newGrams / 100;

        const { error: updateError } = await supabase
          .from("selfbesin_meal_foods")
          .update({
            grams: newGrams,
            calories: foodToAdd.calories_per_100g * factor,
            protein: foodToAdd.protein_g_per_100g * factor,
            carbs: foodToAdd.carbs_g_per_100g * factor,
            fat: foodToAdd.fat_g_per_100g * factor,
          })
          .eq("id", existingEntry.id);

        if (updateError) throw updateError;
      } else {
        const factor = grams / 100;
        const { error: insertError } = await supabase
          .from("selfbesin_meal_foods")
          .insert([
            {
              meal_id: selectedMeal.id,
              food_id: foodToAdd.id,
              grams,
              calories: foodToAdd.calories_per_100g * factor,
              protein: foodToAdd.protein_g_per_100g * factor,
              carbs: foodToAdd.carbs_g_per_100g * factor,
              fat: foodToAdd.fat_g_per_100g * factor,
            },
          ]);

        if (insertError) throw insertError;
      }

      const updatedMeals = await refreshMeals();
      const found = updatedMeals.find((m) => m.id === selectedMeal.id);
      if (found) setSelectedMeal(found);
    } catch (error) {
      console.error("Error adding food to meal:", error);
      alert("Besin eklenirken bir hata oluştu.");
      throw error;
    }
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
            .from("selfbesin_meals")
            .delete()
            .eq("id", mealId);

          if (error) throw error;
          await refreshMeals();
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
    setIsMutating(true);
    try {
      const { data: newMeal, error: mealError } = await supabase
        .from("selfbesin_meals")
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
          .from("selfbesin_meal_foods")
          .insert(mealFoodsToInsert);

        if (foodsError) throw foodsError;
      }

      await refreshMeals();
    } catch (error) {
      console.error("Error duplicating meal:", error);
      alert("Öğün çoğaltılırken bir hata oluştu.");
    } finally {
      setIsMutating(false);
    }
  };

  const Skeleton = ({
    className,
    shimmerColor,
  }: {
    className?: string;
    shimmerColor?: string;
  }) => (
    <div
      className={`shimmer bg-gray-100 dark:bg-gray-800/50 rounded-xl ${className}`}
      style={
        shimmerColor
          ? ({ "--shimmer-color": shimmerColor } as React.CSSProperties)
          : {}
      }
    />
  );

  return (
    <>
      {isMutating && <Loading />}
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
        <div className="mb-[3dvh] grid grid-cols-4 gap-[2.5dvw] sm:gap-4 shrink-0 px-1">
          {[
            {
              label: "Kcal",
              val: dailyTotals.calories,
              color: "text-red-600 dark:text-red-400",
              bg: "bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/20 dark:to-gray-900",
              border: "border-red-100/50 dark:border-red-900/20",
              iconBg: "bg-red-100/50 dark:bg-red-900/40",
              shimmerColor: "rgba(239, 68, 68, 0.4)",
              icon: <Flame className="w-3 h-3 text-red-500" />,
              unit: "",
            },
            {
              label: "Protein",
              val: dailyTotals.protein,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900",
              border: "border-blue-100/50 dark:border-blue-900/20",
              iconBg: "bg-blue-100/50 dark:bg-blue-900/40",
              shimmerColor: "rgba(59, 130, 246, 0.4)",
              icon: <Beef className="w-3 h-3 text-blue-500" />,
              unit: "g",
            },
            {
              label: "Karb",
              val: dailyTotals.carbs,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-gray-900",
              border: "border-amber-100/50 dark:border-amber-900/20",
              iconBg: "bg-amber-100/50 dark:bg-amber-900/40",
              shimmerColor: "rgba(245, 158, 11, 0.4)",
              icon: <Wheat className="w-3 h-3 text-amber-500" />,
              unit: "g",
            },
            {
              label: "Yağ",
              val: dailyTotals.fat,
              color: "text-orange-600 dark:text-orange-400",
              bg: "bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-gray-900",
              border: "border-orange-100/50 dark:border-orange-900/20",
              iconBg: "bg-orange-100/50 dark:bg-orange-900/40",
              shimmerColor: "rgba(249, 115, 22, 0.4)",
              icon: <Droplets className="w-3 h-3 text-orange-500" />,
              unit: "g",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center py-[1.2dvh] rounded-2xl ${item.bg} border ${item.border} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            >
              <div
                className={`w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center mb-1`}
              >
                {item.icon}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                {item.label}
              </span>
              <div className="h-4 flex items-center justify-center">
                {loading && meals.length === 0 ? (
                  <Skeleton
                    className="h-2 w-10 sm:w-12 rounded-full !bg-transparent"
                    shimmerColor={item.shimmerColor}
                  />
                ) : (
                  <span
                    className={`text-xs sm:text-sm font-black ${item.color} leading-none tracking-tight`}
                  >
                    {Math.round(item.val)}
                    <span className="text-[9px] ml-0.5 opacity-70 font-bold uppercase whitespace-nowrap">
                      {item.unit}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {loading && meals.length === 0 ? (
          <div className="flex-1 min-h-0 relative mb-[1dvh]">
            <div className="h-[50dvh] sm:h-[60dvh] inset-0 overflow-y-auto scrollbar-hide border-2 border-gray-50 dark:border-gray-800/50 rounded-[2rem] p-[1dvh] bg-gray-100 dark:bg-gray-900/10 shadow-inner">
              <div className="space-y-[1dvh]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="relative overflow-hidden rounded-3xl">
                    <div className="relative bg-white dark:bg-gray-950 rounded-3xl">
                      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-[1dvh] sm:gap-[2dvh] min-w-0">
                            <div className="min-w-0 flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-32 sm:w-40" />
                              <Skeleton className="h-3 w-20 sm:w-24" />
                            </div>
                          </div>
                          <div className="w-[25dvh] shrink-0 h-[38px] sm:h-[42px]">
                            <Skeleton className="h-full w-full rounded-lg sm:rounded-xl opacity-40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : meals.length === 0 ? (
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
                    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group/card relative">
                      {/* Accent Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/80 to-emerald-600/80 rounded-full my-4" />

                      <div
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-800/40 pl-6"
                        onClick={() => handleMealClick(meal)}
                      >
                        <div className="flex items-center gap-[1dvh] sm:gap-[2dvh] min-w-0">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight truncate mb-1">
                              {meal.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                              <Calendar className="w-3 h-3 text-emerald-500/70" />
                              {new Date(meal.created_at).toLocaleDateString(
                                "tr-TR",
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div className="flex items-center gap-1 bg-gray-50/50 dark:bg-gray-950/50 p-1 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                            {[
                              {
                                val: Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.calories,
                                    0,
                                  ),
                                ),
                                color: "text-red-500",
                                label: "K",
                              },
                              {
                                val: Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.protein,
                                    0,
                                  ),
                                ),
                                color: "text-blue-500",
                                label: "P",
                              },
                              {
                                val: Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + (mf.carbs || 0),
                                    0,
                                  ),
                                ),
                                color: "text-amber-500",
                                label: "C",
                              },
                              {
                                val: Math.round(
                                  meal.meal_foods.reduce(
                                    (acc, mf) => acc + mf.fat,
                                    0,
                                  ),
                                ),
                                color: "text-orange-500",
                                label: "Y",
                              },
                            ].map((macro, midx) => (
                              <div
                                key={midx}
                                className="flex flex-col items-center justify-center w-8 sm:w-10 py-1"
                              >
                                <span
                                  className={`text-[10px] sm:text-xs font-black ${macro.color} leading-none mb-0.5`}
                                >
                                  {macro.val}
                                </span>
                                <span className="text-[7px] font-black text-gray-400 dark:text-gray-600 uppercase">
                                  {macro.label}
                                </span>
                              </div>
                            ))}
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
          const updatedMeals = await refreshMeals();
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
        onAddFood={() => setIsAddFoodSearchOpen(true)}
        onFoodClick={handleFoodClickFromView}
      />

      <AddFoodSearchModal
        isOpen={isAddFoodSearchOpen}
        onClose={() => setIsAddFoodSearchOpen(false)}
        onFoodSelect={(food) => {
          setFoodToAdd(food);
          setIsAddFoodSearchOpen(false);
        }}
      />

      <FoodAmountSelectionModal
        key={
          foodToEditAmount
            ? `${foodToEditAmount.id}-${editingMealFoodId || "new"}`
            : "none"
        }
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

      <FoodAmountSelectionModal
        key={foodToAdd ? `add-${foodToAdd.id}` : "add-none"}
        isOpen={!!foodToAdd}
        onClose={() => setFoodToAdd(null)}
        food={foodToAdd}
        onConfirm={handleAddFoodToMeal}
        confirmLabel="Öğüne Ekle"
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
