import { MeiliSearch } from "meilisearch";
import { supabase } from "../lib/supabase";
import { QUALIFIER_PRIORITY_MAP } from "../constants/qualifiers";
import { BRAND_PRIORITY_MAP } from "../constants/brands";

const client = new MeiliSearch({
  host: import.meta.env.VITE_MEILISEARCH_URL,
  apiKey: import.meta.env.VITE_MEILISEARCH_API_KEY,
});

/**
 * Parses qualifier string and returns individual qualifiers (lowercase).
 * Handles comma-separated qualifiers like "Tam Yağlı, Laktozsuz"
 */
function parseQualifiers(qualifier?: string | null): string[] {
  if (!qualifier) return [];
  return qualifier
    .split(",")
    .map((q) => q.trim().toLocaleLowerCase("tr"))
    .filter(Boolean);
}

/**
 * Calculates qualifier_score from the sum of individual qualifier priorities.
 * Unknown qualifiers get a high default priority (9999).
 */
function calcQualifierScore(qualifiers: string[]): number {
  if (qualifiers.length === 0) return 0;
  return qualifiers.reduce((sum, q) => {
    return sum + (QUALIFIER_PRIORITY_MAP.get(q) ?? 9999);
  }, 0);
}

/**
 * Looks up brand priority. Unknown brands get 999.
 */
function calcBrandPriority(brand?: string | null): number {
  if (!brand) return 999;
  return BRAND_PRIORITY_MAP.get(brand.toLocaleLowerCase("tr")) ?? 999;
}

const seed = async () => {
  const { data, error } = await supabase.from("foods").select("*");
  if (error) throw error;

  // Enrich each document with ranking fields
  const enriched = (data ?? []).map((food) => {
    const qualifiers = parseQualifiers(food.qualifier);
    return {
      ...food,
      qualifier_count: qualifiers.length,
      qualifier_score: calcQualifierScore(qualifiers),
      brand_priority: calcBrandPriority(food.brand),
      qualifier_vector: qualifiers.join(", ") || "",
    };
  });

  const index = client.index("foods");
  await index.addDocuments(enriched);
  await index.updateSettings({
    searchableAttributes: ["name", "brand", "slug"],
    filterableAttributes: ["qualifier_vector"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
      "qualifier_count:asc",
      "qualifier_score:asc",
      "brand_priority:asc",
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
  });

  console.log("Yüklendi:", enriched.length, "besin (ranking alanlarıyla)");
};

seed();
