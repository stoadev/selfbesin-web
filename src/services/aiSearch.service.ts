import { supabase } from "../lib/supabase";

export interface AiSearchItem {
  name: string;
  amount: string;
  calories: number;
  food_id: string;
  grams: number;
}

export interface AiSearchResponse {
  answer: string;
  items?: AiSearchItem[];
  total?: number;
  intent?: string;
}

function normalizeItems(value: unknown): AiSearchItem[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const items = value
    .filter(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as AiSearchItem).name === "string" &&
        typeof (item as AiSearchItem).amount === "string" &&
        typeof (item as AiSearchItem).calories === "number" &&
        typeof (item as AiSearchItem).food_id === "string" &&
        (item as AiSearchItem).food_id !== "" &&
        typeof (item as AiSearchItem).grams === "number" &&
        Number.isFinite((item as AiSearchItem).grams),
    )
    .map((item) => ({
      name: (item as AiSearchItem).name,
      amount: (item as AiSearchItem).amount,
      calories: (item as AiSearchItem).calories,
      food_id: (item as AiSearchItem).food_id,
      grams: (item as AiSearchItem).grams,
    }));

  if (items.length === 0) return undefined;

  return items;
}

function normalizeTotal(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export interface AiSearchHistoryEntry {
  role: string;
  text: string;
}

export const aiSearchService = {
  async ask(
    query: string,
    history?: AiSearchHistoryEntry[],
    draft?: AiSearchItem[],
  ): Promise<AiSearchResponse> {
    const webhookUrl = import.meta.env.VITE_AI_SEARCH_WEBHOOK_URL;

    if (!webhookUrl) {
      return { answer: "" };
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return { answer: "" };
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query,
          ...(history && history.length > 0 ? { history } : {}),
          ...(draft && draft.length > 0 ? { draft } : {}),
        }),
      });

      if (!response.ok) {
        return { answer: "" };
      }

      const data = await response.json();

      if (typeof data === "string") {
        return { answer: data };
      }

      return {
        answer: data.answer || data.output || data.text || "",
        items: normalizeItems(data.items),
        total: normalizeTotal(data.total),
        intent: typeof data.intent === "string" ? data.intent : undefined,
      };
    } catch {
      return { answer: "" };
    }
  },
};
