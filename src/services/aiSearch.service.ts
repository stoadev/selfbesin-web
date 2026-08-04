import { supabase } from "../lib/supabase";

export interface AiSearchResponse {
  answer: string;
  foodIds?: string[];
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
        foodIds: data.foodIds,
      };
    } catch {
      return { answer: "" };
    }
  },
};
