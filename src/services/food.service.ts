import { MeiliSearch, Index } from "meilisearch";
import { supabase } from "../lib/supabase";
import type { Food } from "../types";
import { QUALIFIER_LIST } from "../constants/qualifiers";

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

/**
 * Detects known qualifiers present in the search query.
 * Returns matched qualifier display names (lowercase).
 * Longer qualifiers are matched first to avoid partial matches
 * (e.g. "Yüksek Proteinli" before "Proteinli").
 */
function detectQualifiers(query: string): string[] {
  const lowerQuery = query.toLocaleLowerCase("tr");

  // Sort by length descending so longer qualifiers match first
  const sorted = [...QUALIFIER_LIST].sort(
    (a, b) => b.display_name.length - a.display_name.length,
  );

  const matched: string[] = [];
  let remaining = lowerQuery;

  for (const q of sorted) {
    const lowerName = q.display_name.toLocaleLowerCase("tr");
    if (remaining.includes(lowerName)) {
      matched.push(lowerName);
      remaining = remaining.replace(lowerName, "").trim();
    }
  }

  return matched;
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
      const detectedQualifiers = detectQualifiers(q);

      // No qualifiers in query → single search, custom ranking handles ordering
      if (detectedQualifiers.length === 0) {
        const result = await index.search(q, {
          limit: 20,
          attributesToSearchOn: ["name", "brand", "slug"],
        });
        return result.hits;
      }

      // Qualifiers detected → 2-phase search
      // Build filter for qualifier_vector containing ALL detected qualifiers
      const qualifierFilters = detectedQualifiers
        .map((qv) => `qualifier_vector CONTAINS "${qv}"`)
        .join(" AND ");

      const notFilters = detectedQualifiers
        .map((qv) => `NOT qualifier_vector CONTAINS "${qv}"`)
        .join(" OR ");

      // Phase 1: Foods that match the detected qualifiers
      const phase1 = await index.search(q, {
        limit: 20,
        attributesToSearchOn: ["name", "brand", "slug"],
        filter: qualifierFilters,
      });

      // Phase 2: Foods that DON'T match the detected qualifiers
      const phase2 = await index.search(q, {
        limit: 10,
        attributesToSearchOn: ["name", "brand", "slug"],
        filter: `(${notFilters}) OR qualifier_vector IS EMPTY`,
      });

      // Merge: qualifier-matched first, then the rest
      const seenIds = new Set(phase1.hits.map((h) => h.id));
      const uniquePhase2 = phase2.hits.filter((h) => !seenIds.has(h.id));

      return [...phase1.hits, ...uniquePhase2];
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
