import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AiSearchItem } from "../services/aiSearch.service";
import { supabase } from "../lib/supabase";
import FoodDetailModal from "./FoodDetailModal";

interface AiAnswerBlockProps {
  answer: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  items?: AiSearchItem[];
  total?: number;
  isChat?: boolean;
}

export type AiAddStatus = "idle" | "success" | "error";

export default function AiAnswerBlock({
  answer,
  isLoading,
  isLoggedIn,
  onLoginClick,
  items,
  total,
  isChat = false,
}: AiAnswerBlockProps) {
  const hasItems = !!items && items.length > 0;
  const singleFoodId =
    items && items.length === 1 ? (items[0].food_id ?? null) : null;

  const [loadedImage, setLoadedImage] = useState<{
    foodId: string;
    url: string | null;
  } | null>(null);
  const [failedFoodId, setFailedFoodId] = useState<string | null>(null);
  const [detailFoodId, setDetailFoodId] = useState<string | null>(null);

  useEffect(() => {
    if (!singleFoodId) return;

    let active = true;

    supabase
      .from("selfbesin_foods")
      .select("image_url")
      .eq("id", singleFoodId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        setLoadedImage({
          foodId: singleFoodId,
          url: error ? null : (data?.image_url ?? null),
        });
      });

    return () => {
      active = false;
    };
  }, [singleFoodId]);

  const imageUrl =
    singleFoodId &&
    loadedImage?.foodId === singleFoodId &&
    failedFoodId !== singleFoodId
      ? loadedImage.url
      : null;

  if (isLoggedIn && !isLoading && !answer.trim() && !hasItems) return null;

  if (isChat && isLoading && isLoggedIn) {
    return (
      <div className="mb-6 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
        Düşünüyor
        <span className="flex items-end gap-0.5 ml-0.5">
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400">
          Selfbesin AI
        </span>
      </div>

      {!isLoggedIn ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Yapay zeka destekli cevap için giriş yapın
          </p>
          <button
            type="button"
            onClick={onLoginClick}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Giriş Yap
          </button>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-2.5">
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800 w-full" />
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800 w-11/12" />
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800 w-2/3" />
        </div>
      ) : hasItems ? (
        <div>
          <ul className="space-y-2">
            {items!.map((item, i) => (
              <li key={`${item.name}-${i}`}>
                <button
                  type="button"
                  onClick={() => item.food_id && setDetailFoodId(item.food_id)}
                  className="w-full flex items-center gap-3 text-left text-sm text-gray-700 dark:text-gray-300 rounded-xl -mx-1 px-1 py-0.5 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      loading="lazy"
                      onError={() => setFailedFoodId(singleFoodId)}
                      className="w-14 h-14 shrink-0 rounded-xl object-cover bg-gray-100 dark:bg-gray-800"
                    />
                  )}
                  <span className="min-w-0">
                    {item.amount ? `${item.amount} ` : ""}
                    {item.name}
                    {typeof item.grams === "number" && (
                      <span className="ml-1 text-xs text-gray-400 dark:text-gray-600">
                        {item.grams}g
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className="mx-1.5 text-gray-400 dark:text-gray-600"
                    >
                      ·
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 tabular-nums">
                      {item.calories} kcal
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {total !== undefined && (
            <>
              <div className="my-3 border-t border-gray-200 dark:border-gray-800" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Toplam
                <span
                  aria-hidden="true"
                  className="mx-1.5 text-gray-400 dark:text-gray-600"
                >
                  ·
                </span>
                <span className="tabular-nums">{total} kcal</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {answer}
        </p>
      )}

      <FoodDetailModal
        isOpen={!!detailFoodId}
        onClose={() => setDetailFoodId(null)}
        foodId={detailFoodId}
      />
    </section>
  );
}
