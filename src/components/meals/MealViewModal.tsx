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
      maxHeight="h-[80dvh] sm:h-[600px]"
      showCloseButton={true}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-[3dvh] border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            {meal.name}
          </h2>
        </div>

        {/* Food List */}
        <div className="flex-1 overflow-y-auto p-[2dvh] sm:p-6 space-y-[1dvh] pb-[2dvh]">
          {meal.meal_foods.map((mf) => (
            <div
              key={mf.id}
              onClick={() => onFoodClick?.(mf)}
              className="flex flex-col cursor-pointer group scale-[0.98] hover:scale-100 transition-all"
            >
              {/* Top Piece: Name and Amount */}
              <div className="flex items-center gap-[1.5dvw] p-[1.5dvw] bg-white dark:bg-gray-800 rounded-t-xl border border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
                  {mf.food?.image_url ? (
                    <img
                      src={mf.food.image_url}
                      alt={mf.food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Apple className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {mf.food?.name || "Bilinmeyen Besin"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    <span>
                      {(() => {
                        const units = mf.food?.serving_units || [];
                        const matchingUnit = units.find(
                          (u) =>
                            mf.grams % u.grams === 0 ||
                            u.grams % mf.grams === 0,
                        );
                        if (matchingUnit && matchingUnit.grams > 0) {
                          const count = (mf.grams / matchingUnit.grams)
                            .toFixed(1)
                            .replace(".0", "");
                          return `${count} ${matchingUnit.name} (${mf.grams}g)`;
                        }
                        return `${mf.grams}g`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Piece: Joined Macro Bar */}
              <div className="grid grid-cols-4 bg-gray-50/80 dark:bg-gray-900/40 rounded-b-xl border-x border-b border-gray-100 dark:border-gray-700 py-[0.8dvh]">
                <div className="flex flex-col items-center justify-center border-r border-gray-200/50 dark:border-gray-800/50">
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-none mb-0.5">
                    Kalori
                  </span>
                  <span className="text-[10px] sm:text-[10px] font-bold text-red-500">
                    {Math.round(mf.calories)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-gray-200/50 dark:border-gray-800/50">
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-none mb-0.5">
                    Protein
                  </span>
                  <span className="text-[10px] sm:text-[10px] font-bold text-blue-500">
                    {Math.round(mf.protein)}g
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-gray-200/50 dark:border-gray-800/50">
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-none mb-0.5">
                    Karb.
                  </span>
                  <span className="text-[10px] sm:text-[10px] font-bold text-yellow-500">
                    {Math.round(mf.carbs || 0)}g
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-none mb-0.5">
                    Yağ
                  </span>
                  <span className="text-[10px] sm:text-[10px] font-bold text-orange-500">
                    {Math.round(mf.fat)}g
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Macro Summary Footer */}
        <div className="p-[2dvh] sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
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
