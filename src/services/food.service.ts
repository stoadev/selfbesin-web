import { MeiliSearch, Index } from "meilisearch";
import { supabase } from "../lib/supabase";
import type { Food } from "../types";

const meiliUrl = import.meta.env.VITE_MEILISEARCH_URL;
const meiliKey = import.meta.env.VITE_MEILISEARCH_API_KEY;

let index: Index<Food> | null = null;

if (meiliUrl && meiliKey) {
  try {
    const client = new MeiliSearch({
      host: meiliUrl,
      apiKey: meiliKey,
    });
    index = client.index("foods");
  } catch (err) {
    console.error("MeiliSearch initialization error:", err);
  }
}

const STANDALONE_NUMBER_PATTERN = /(^|[^\w%.,])\d{1,3}(?!\w|[.,]\d)/g;

function stripStandaloneNumbers(q: string): string {
  const cleaned = q
    .replace(STANDALONE_NUMBER_PATTERN, (_match, prefix: string) => `${prefix} `)
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || q;
}

const SEARCH_STOPWORDS = new Set([
  "tane",
  "adet",
  "kac",
  "kaç",
  "kadar",
  "hangi",
  "porsiyon",
  "dilim",
  "kalori",
  "kalorisi",
]);

function stripStopwords(q: string): string {
  const cleaned = q
    .split(/\s+/)
    .filter((word) => {
      const normalized = word
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
        .toLocaleLowerCase("tr");
      return normalized !== "" && !SEARCH_STOPWORDS.has(normalized);
    })
    .join(" ")
    .trim();

  return cleaned || q;
}

export const foodService = {
  async searchFoods(query: string): Promise<Food[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    if (!index) {
      console.warn("MeiliSearch index not initialized. Search is disabled.");
      return [];
    }

    const searchTerm = stripStopwords(stripStandaloneNumbers(q));

    try {
      const result = await index.search(searchTerm, {
        limit: 100, // Frontend sıralama mantığının daha iyi sonuç seçebilmesi için limiti artırdık
      });
      return result.hits.filter((f) => f.brand !== "Odd");
    } catch (err) {
      console.error("MeiliSearch search error:", err);
      return [];
    }
  },

  async getFoodById(id: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from("selfbesin_foods")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching food:", error);
      return null;
    }

    return data;
  },

  async getFoodBySlug(slug: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from("selfbesin_foods")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching food by slug:", error);
      return null;
    }

    return data;
  },

  async getRandomFood(): Promise<Food | null> {
    const { count, error: countError } = await supabase
      .from("selfbesin_foods")
      .select("*", { count: "exact", head: true });

    if (countError || count === null) {
      console.error("Error fetching food count:", countError);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * count);

    const { data, error } = await supabase
      .from("selfbesin_foods")
      .select("*")
      .range(randomIndex, randomIndex)
      .maybeSingle();

    if (error) {
      console.error("Error fetching random food:", error);
      return null;
    }

    return data;
  },

  async fetchAndLoadFood(query: string): Promise<number> {
    const webhookUrl = import.meta.env.VITE_FOOD_FETCH_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("Food fetch webhook URL not configured.");
      return 0;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
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
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    const data = await response.json();
    return typeof data?.added === "number" ? data.added : 0;
  },
};
