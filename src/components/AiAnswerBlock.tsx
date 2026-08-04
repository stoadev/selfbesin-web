import { Sparkles } from "lucide-react";
import type { AiSearchItem } from "../services/aiSearch.service";

interface AiAnswerBlockProps {
  answer: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  items?: AiSearchItem[];
  total?: number;
}

export default function AiAnswerBlock({
  answer,
  isLoading,
  isLoggedIn,
  onLoginClick,
  items,
  total,
}: AiAnswerBlockProps) {
  const hasItems = !!items && items.length > 0;

  if (isLoggedIn && !isLoading && !answer.trim() && !hasItems) return null;

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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Yedikleriniz
          </h2>

          <ul className="space-y-2">
            {items!.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {item.name} ({item.amount})
                <span aria-hidden="true" className="mx-1.5 text-gray-400 dark:text-gray-600">
                  ·
                </span>
                <span className="text-gray-900 dark:text-gray-100 tabular-nums">
                  {item.calories} kcal
                </span>
              </li>
            ))}
          </ul>

          {total !== undefined && (
            <>
              <div className="my-3 border-t border-gray-200 dark:border-gray-800" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Toplam
                <span aria-hidden="true" className="mx-1.5 text-gray-400 dark:text-gray-600">
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
    </section>
  );
}
