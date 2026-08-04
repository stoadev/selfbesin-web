import { X } from "lucide-react";
import type { AiSearchItem } from "../services/aiSearch.service";
import type { AiAddStatus } from "./AiAnswerBlock";

type DraftPanelProps = {
  items: AiSearchItem[];
  total: number;
  isAdding: boolean;
  addStatus: AiAddStatus;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export default function DraftPanel({
  items,
  total,
  isAdding,
  addStatus,
  onAdd,
  onRemove,
}: DraftPanelProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="shrink-0 text-sm font-bold text-gray-900 dark:text-white mb-3">
        Öğün
      </h2>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Henüz besin eklenmedi.
        </p>
      ) : (
        <>
          <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
            {items.map((item, i) => (
              <li
                key={`${item.food_id}-${i}`}
                className="group flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="flex-1 min-w-0 truncate">
                  {item.amount ? `${item.amount} ` : ""}
                  {item.name}
                </span>
                <span className="shrink-0 text-gray-900 dark:text-gray-100 tabular-nums">
                  {item.calories} kcal
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Besini çıkar"
                  className="shrink-0 p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="shrink-0 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
              <span>Toplam</span>
              <span className="tabular-nums">{Math.round(total)} kcal</span>
            </div>

            <button
              type="button"
              onClick={onAdd}
              disabled={isAdding || items.length === 0}
              className="mt-3 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              {isAdding ? "Ekleniyor..." : "Beslenme Kaydına Ekle"}
            </button>

            {addStatus !== "idle" && (
              <p
                className={`mt-2 text-xs text-center ${
                  addStatus === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {addStatus === "success"
                  ? "Beslenme kaydına eklendi"
                  : "Eklenemedi, tekrar deneyin"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
