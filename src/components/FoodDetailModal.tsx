import { useEffect, useState } from "react";
import Modal from "./common/Modal";
import Loading from "./common/Loading";
import FoodImage from "./common/FoodImage";
import { foodService } from "../services/food.service";
import type { Food, FoodUnit } from "../types";
import { getBasisLabel } from "../types";

type FoodDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  foodId: string | null;
};

function parseUnits(food: Food): FoodUnit[] {
  try {
    if (Array.isArray(food.serving_units)) return food.serving_units;
    if (typeof food.serving_units === "string")
      return JSON.parse(food.serving_units);
  } catch (err) {
    console.error("Scale parsing error:", err);
  }
  return [];
}

export default function FoodDetailModal({
  isOpen,
  onClose,
  foodId,
}: FoodDetailModalProps) {
  const [loaded, setLoaded] = useState<{
    foodId: string;
    food: Food | null;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !foodId) return;

    let active = true;

    foodService
      .getFoodById(foodId)
      .then((food) => {
        if (active) setLoaded({ foodId, food });
      })
      .catch((err) => {
        console.error("Error fetching food:", err);
        if (active) setLoaded({ foodId, food: null });
      });

    return () => {
      active = false;
    };
  }, [isOpen, foodId]);

  const food = loaded?.foodId === foodId ? loaded.food : null;
  const isLoading = !!foodId && loaded?.foodId !== foodId;
  const unit = food ? getBasisLabel(food).unit : "g";
  const units = food ? parseUnits(food) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[420px]">
      <div className="p-[3dvh] flex flex-col gap-[2dvh]">
        {isLoading ? (
          <Loading fullScreen={false} backdrop={false} />
        ) : !food ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">
            Besin bilgisi bulunamadı.
          </p>
        ) : (
          <>
            <FoodImage
              src={food.image_url}
              alt={food.display_name?.trim() || food.name || ""}
              className="w-full h-40 rounded-2xl border border-gray-100 dark:border-gray-800"
              iconClassName="w-10 h-10"
            />

            <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-8">
              {food.display_name?.trim() || food.name}
            </h2>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Kalori
                </span>
                <span className="text-sm font-bold text-red-500">
                  {Math.round(food.calories_per_100g)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Protein
                </span>
                <span className="text-sm font-bold text-blue-500">
                  {Math.round(food.protein_g_per_100g)}g
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Karb.
                </span>
                <span className="text-sm font-bold text-yellow-500">
                  {Math.round(food.carbs_g_per_100g)}g
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Yağ
                </span>
                <span className="text-sm font-bold text-orange-500">
                  {Math.round(food.fat_g_per_100g)}g
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              100 {unit} için
            </p>

            {units.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {units.map((servingUnit, i) => (
                  <span
                    key={`${servingUnit.name}-${i}`}
                    className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-3 py-1"
                  >
                    {servingUnit.name} · {servingUnit.grams}
                    {unit}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
