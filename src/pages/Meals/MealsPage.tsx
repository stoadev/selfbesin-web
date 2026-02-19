import { useState, useEffect, useCallback } from "react";
import { Plus, Utensils, Calendar, Info, Apple } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Button from "../../components/common/Button";
import AddMealModal from "../../components/meals/AddMealModal";
import type { MealWithFoods } from "../../types";

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithFoods[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 pt-4 sm:pt-8">
        <header className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Öğünlerim
              </h1>
            </div>
            <Button
              variant="primary"
              className="h-10 sm:h-12 px-4 sm:px-6 shadow-lg shadow-emerald-500/20 flex items-center justify-center whitespace-nowrap"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2 shrink-0" />
              <span className="text-sm sm:text-base">Öğün Ekle</span>
            </Button>
          </div>
          <div className="sm:pl-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Günlük beslenme takibini buradan yönetebilirsin.
            </p>
          </div>
        </header>

        {meals.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Henüz öğün eklememişsin
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Besinleri arayarak ilk öğününü oluşturmaya başlayabilirsin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Meal Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {meal.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(meal.created_at).toLocaleDateString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Total Macros for Meal */}
                  <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 min-w-[260px] sm:min-w-[400px]">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight group-hover:text-emerald-500 transition-colors">
                        Kalori
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(
                          meal.meal_foods.reduce(
                            (acc, mf) => acc + mf.calories,
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight group-hover:text-blue-500 transition-colors">
                        Protein
                      </span>
                      <span className="text-sm font-bold text-blue-500">
                        {Math.round(
                          meal.meal_foods.reduce(
                            (acc, mf) => acc + mf.protein,
                            0,
                          ),
                        )}
                        g
                      </span>
                    </div>
                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight group-hover:text-yellow-500 transition-colors">
                        Karb.
                      </span>
                      <span className="text-sm font-bold text-yellow-500">
                        {Math.round(
                          meal.meal_foods.reduce(
                            (acc, mf) => acc + (mf.carbs || 0),
                            0,
                          ),
                        )}
                        g
                      </span>
                    </div>
                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 shrink-0"></div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight group-hover:text-orange-500 transition-colors">
                        Yağ
                      </span>
                      <span className="text-sm font-bold text-orange-500">
                        {Math.round(
                          meal.meal_foods.reduce((acc, mf) => acc + mf.fat, 0),
                        )}
                        g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meal Foods List */}
                <div className="p-0">
                  {meal.meal_foods.map((mf) => (
                    <div
                      key={mf.id}
                      className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          <Apple className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {mf.food?.name || "Bilinmeyen Besin"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {mf.grams}g • {Math.round(mf.calories)} kcal
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div className="hidden sm:flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                              {" "}
                              P{" "}
                            </span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {Math.round(mf.protein)}g
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                              {" "}
                              K{" "}
                            </span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {Math.round(mf.carbs)}g
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                              {" "}
                              Y{" "}
                            </span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {Math.round(mf.fat)}g
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="p-2 h-auto text-gray-400 hover:text-red-500"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMeals}
      />
    </>
  );
}
