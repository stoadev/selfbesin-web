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
      const result = await index.search(q, {
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

  async fetchAndLoadFood(query: string): Promise<Food[]> {
    const webhookUrl = import.meta.env.VITE_FOOD_FETCH_WEBHOOK_URL;
    console.log("🔍 Triggering webhook for:", query, "URL:", webhookUrl);

    if (!webhookUrl) {
      console.warn("Food fetch webhook URL not configured.");
      return [];
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      });

      console.log("📡 Webhook Response Status:", response.status);

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Webhook Data Received:", data);

      // n8n response is an array: [{ success: true, food: { ... } }, ...]
      const results = Array.isArray(data) ? data : data ? [data] : [];

      const foods: Food[] = results
        .map((item) => {
          const foodData = item?.food;
          if (!foodData) {
            console.log("⚠️ No food data in n8n item:", item);
            return null;
          }

          // Parse serving_units if it's a string
          let servingUnits = foodData.serving_units;
          if (typeof servingUnits === "string") {
            try {
              servingUnits = JSON.parse(servingUnits);
            } catch (e) {
              console.warn("Failed to parse serving_units string:", e);
              servingUnits = [];
            }
          }

          return {
            ...foodData,
            serving_units: Array.isArray(servingUnits) ? servingUnits : [],
          };
        })
        .filter((f): f is Food => f !== null);

      console.log("✅ Parsed Foods:", foods.length);

      return foods;
    } catch (err) {
      console.error("❌ Error in fetchAndLoadFood:", err);
      return [];
    }
  },
};
