import { Utensils, Apple, Edit2 } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import type { MealWithFoods, MealFood } from "../../types";

type MealViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  meal: MealWithFoods | null;
  onEdit: () => void;
  onFoodClick?: (mealFood: MealFood) => void;
};

export default function MealViewModal({
  isOpen,
  onClose,
  meal,
  onEdit,
  onFoodClick,
}: MealViewModalProps) {
  if (!meal) return null;

  const totals = meal.meal_foods.reduce(
    (acc, mf) => ({
      calories: acc.calories + mf.calories,
      protein: acc.protein + mf.protein,
      carbs: acc.carbs + mf.carbs,
      fat: acc.fat + mf.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      maxHeight="h-[80vh] sm:h-[600px]"
      showCloseButton={true}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            {meal.name}
          </h2>
        </div>

        {/* Food List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 pb-8">
          {meal.meal_foods.map((mf) => (
            <div
              key={mf.id}
              onClick={() => onFoodClick?.(mf)}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group scale-[0.98] hover:scale-100"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                  <Apple className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {mf.food?.name || "Bilinmeyen Besin"}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] font-normal mt-1.5 w-full">
                    <span className="text-gray-400 dark:text-gray-500">
                      {mf.grams}g
                    </span>
                    <span className="text-red-500/80 dark:text-red-400/80">
                      {Math.round(mf.calories)} kcal
                    </span>
                    <span className="text-blue-500/80 dark:text-blue-400/80">
                      {Math.round(mf.protein)}g Prot
                    </span>
                    <span className="text-yellow-600/80 dark:text-yellow-500/80">
                      {Math.round(mf.carbs)}g Karb
                    </span>
                    <span className="text-orange-500/80 dark:text-orange-400/80">
                      {Math.round(mf.fat)}g Yağ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Macro Summary Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1 grid grid-cols-4 gap-1 text-center">
              <div>
                <span className="block text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
                  Kalori
                </span>
                <span className="text-xs sm:text-sm font-bold text-red-500">
                  {Math.round(totals.calories)}
                </span>
              </div>
              <div>
                <span className="block text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
                  Protein
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-500">
                  {Math.round(totals.protein)}g
                </span>
              </div>
              <div>
                <span className="block text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
                  Karb.
                </span>
                <span className="text-xs sm:text-sm font-bold text-yellow-500">
                  {Math.round(totals.carbs)}g
                </span>
              </div>
              <div>
                <span className="block text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
                  Yağ
                </span>
                <span className="text-xs sm:text-sm font-bold text-orange-500">
                  {Math.round(totals.fat)}g
                </span>
              </div>
            </div>

            {/* Edit Button CTA */}
            <Button
              variant="cta"
              className="w-12 h-12 p-0 rounded-full flex items-center justify-center shrink-0 shadow-lg"
              onClick={onEdit}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
