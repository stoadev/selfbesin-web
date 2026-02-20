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

export const foodService = {
  async searchFoods(query: string): Promise<Food[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    if (!index) {
      console.warn("MeiliSearch index not initialized. Search is disabled.");
      return [];
    }

    try {
      const result = await index.search(q, { limit: 20 });
      return result.hits;
    } catch (err) {
      console.error("MeiliSearch search error:", err);
      return [];
    }
  },

  async getFoodById(id: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from("foods")
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
      .from("foods")
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
      .from("foods")
      .select("*", { count: "exact", head: true });

    if (countError || count === null) {
      console.error("Error fetching food count:", countError);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * count);

    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .range(randomIndex, randomIndex)
      .maybeSingle();

    if (error) {
      console.error("Error fetching random food:", error);
      return null;
    }

    return data;
  },
};
