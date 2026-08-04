import { supabase } from "../lib/supabase";

export interface AiSearchItem {
  name: string;
  amount: string;
  calories: number;
}

export interface AiSearchResponse {
  answer: string;
  items?: AiSearchItem[];
  total?: number;
}

function normalizeItems(value: unknown): AiSearchItem[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const isValid = value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as AiSearchItem).name === "string" &&
      typeof (item as AiSearchItem).amount === "string" &&
      typeof (item as AiSearchItem).calories === "number",
  );

  if (!isValid) return undefined;

  return (value as AiSearchItem[]).map((item) => ({
    name: item.name,
    amount: item.amount,
    calories: item.calories,
  }));
}

function normalizeTotal(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export const aiSearchService = {
  async ask(query: string): Promise<AiSearchResponse> {
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
        body: JSON.stringify({ query }),
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
      };
    } catch {
      return { answer: "" };
    }
  },
};
