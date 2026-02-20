import { useState } from "react";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";
import Modal from "../common/Modal";
import type { Food } from "../../types";
import Button from "../common/Button";

type FoodAmountSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (grams: number) => void;
  food: Food | null;
  initialGrams?: number;
};

export default function FoodAmountSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  food,
  initialGrams = 100,
}: FoodAmountSelectionModalProps) {
  const [serving, setServing] = useState(initialGrams);
  const [selectionMode, setSelectionMode] = useState<"gram" | "unit">("gram");

  if (!food) return null;

  const ratio = serving / 100;
  const calc = (val: number) => (val * ratio).toFixed(1);

  // Slider değerleri
  const sliderMin = 0;
  const sliderMax = selectionMode === "gram" ? 500 : 10;
  const sliderStep = selectionMode === "gram" ? 5 : 1;
  const sliderValue =
    selectionMode === "gram"
      ? serving
      : serving / (food.serving_unit_grams || 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[440px]">
      <div className="p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {food.name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Miktar Seçimi
          </p>
        </div>

        {/* Serving Selector */}
        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {selectionMode === "unit" && food.serving_unit_name
                ? `${food.serving_unit_name.charAt(0).toUpperCase() + food.serving_unit_name.slice(1)}`
                : "Ağırlık (gram)"}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600">
                {selectionMode === "unit" && food.serving_unit_grams
                  ? (serving / food.serving_unit_grams)
                      .toFixed(1)
                      .replace(".0", "")
                  : `${serving}g`}
              </span>
              {selectionMode === "unit" && food.serving_unit_name && (
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-1">
                  ({serving}g)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (selectionMode === "gram") {
                  setServing(val);
                } else if (food.serving_unit_grams) {
                  setServing(val * food.serving_unit_grams);
                }
              }}
              className="flex-1 accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} ${
                  ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
                }%, ${localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb"} 100%)`,
              }}
            />

            {/* Hızlı Birim Seçimi */}
            <div className="flex gap-2">
              {[
                {
                  label: "Gram",
                  grams: 100,
                  mode: "gram" as const,
                },
                ...(food.serving_unit_name && food.serving_unit_grams
                  ? [
                      {
                        label:
                          food.serving_unit_name.charAt(0).toUpperCase() +
                          food.serving_unit_name.slice(1),
                        grams: food.serving_unit_grams,
                        mode: "unit" as const,
                      },
                    ]
                  : []),
              ].map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setServing(option.grams);
                    setSelectionMode(option.mode);
                  }}
                  className={`flex-1 py-3 px-1 rounded-xl border text-[11px] font-bold transition-all duration-200 ${
                    selectionMode === option.mode
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Macro Cards */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard
            icon={<Flame className="w-4 h-4 text-red-500" />}
            label="Kalori"
            value={calc(food.calories_per_100g)}
            unit="kcal"
            bg="bg-red-50 dark:bg-red-950/20"
          />
          <MacroCard
            icon={<Beef className="w-4 h-4 text-blue-500" />}
            label="Protein"
            value={calc(food.protein_g_per_100g)}
            unit="g Prot"
            bg="bg-blue-50 dark:bg-blue-950/20"
          />
          <MacroCard
            icon={<Wheat className="w-4 h-4 text-yellow-500" />}
            label="Karb."
            value={calc(food.carbs_g_per_100g)}
            unit="g Karb"
            bg="bg-yellow-50 dark:bg-yellow-950/20"
          />
          <MacroCard
            icon={<Droplets className="w-4 h-4 text-orange-500" />}
            label="Yağ"
            value={calc(food.fat_g_per_100g)}
            unit="g Yağ"
            bg="bg-orange-50 dark:bg-orange-950/20"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="primary"
            className="flex-[2] h-12 shadow-lg shadow-emerald-500/20"
            disabled={serving <= 0}
            onClick={() => {
              onConfirm(serving);
              onClose();
            }}
          >
            {initialGrams ? "Güncelle" : "Öğüne Ekle"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
    <div
      className={`p-3 rounded-2xl ${bg} border border-black/5 dark:border-white/5`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-base font-bold text-gray-900 dark:text-white leading-none">
          {value}
        </span>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
          {unit}
        </span>
      </div>
    </div>
  );
}
