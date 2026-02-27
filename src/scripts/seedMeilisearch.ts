import { MeiliSearch } from "meilisearch";
import { supabase } from "../lib/supabase";
import { QUALIFIER_PRIORITY_MAP } from "../constants/qualifiers";
import { BRAND_PRIORITY_MAP } from "../constants/brands";

const client = new MeiliSearch({
  host: import.meta.env.VITE_MEILISEARCH_URL,
  apiKey: import.meta.env.VITE_MEILISEARCH_ADMIN_KEY,
});

/**
 * Normalizes qualifier input (array or comma-separated string) to lowercase array.
 */
function parseQualifiers(qualifier?: string | string[] | null): string[] {
  if (!qualifier) return [];
  const raw = Array.isArray(qualifier) ? qualifier : qualifier.split(",");
  return raw.map((q) => q.trim().toLocaleLowerCase("tr")).filter(Boolean);
}

/**
 * Calculates qualifier_score from the sum of individual qualifier priorities.
 * Unknown qualifiers get a high default priority (99999).
 */
function calcQualifierScore(qualifiers: string[]): number {
  if (qualifiers.length === 0) return 0;
  return qualifiers.reduce((sum, q) => {
    return sum + (QUALIFIER_PRIORITY_MAP.get(q) ?? 99999);
  }, 0);
}

/**
 * Looks up brand priority. Unknown brands get 99999.
 */
function calcBrandPriority(brand?: string | null): number {
  if (!brand) return 99999;
  return BRAND_PRIORITY_MAP.get(brand.toLocaleLowerCase("tr")) ?? 99999;
}

/**
 * Builds a composite search_text: "qualifier1 qualifier2 name"
 * Enables proper proximity scoring when searching "yarım yağlı süt"
 */
function buildSearchText(qualifiers: string[], name: string): string {
  const parts = [...qualifiers, name.toLocaleLowerCase("tr")];
  return parts.join(" ");
}

const seed = async () => {
  const { data, error } = await supabase.from("foods").select("*");
  if (error) throw error;

  // Detect problematic qualifiers (ones that contain food-type words unrelated to the food name)
  const foodTypeWords = [
    "süt",
    "peynir",
    "yoğurt",
    "ekmek",
    "makarna",
    "pirinç",
    "tavuk",
    "et",
  ];
  const problematic: { name: string; qualifier: string[]; slug: string }[] = [];

  // Enrich each document with ranking fields
  const enriched = (data ?? []).map((food) => {
    const qualifiers = parseQualifiers(food.qualifier);

    // Flag qualifiers that contain food-type words not in the food's own name
    for (const q of qualifiers) {
      const hasExtraFoodWord = foodTypeWords.some(
        (fw) =>
          q.includes(fw) && !food.name.toLocaleLowerCase("tr").includes(fw),
      );
      if (hasExtraFoodWord) {
        problematic.push({
          name: food.name,
          qualifier: qualifiers,
          slug: food.slug,
        });
        break;
      }
    }

    return {
      ...food,
      search_text: buildSearchText(qualifiers, food.name),
      name_word_count: food.name.trim().split(/\s+/).length,
      qualifier_count: qualifiers.length,
      qualifier_score: calcQualifierScore(qualifiers),
      brand_priority: calcBrandPriority(food.brand),
      qualifier_vector: qualifiers.join(", ") || "",
    };
  });

  const index = client.index("foods");
  await index.addDocuments(enriched);
  await index.updateSettings({
    searchableAttributes: ["search_text", "name", "brand"],
    filterableAttributes: ["qualifier_vector"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
      "name_word_count:asc",
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

  if (problematic.length > 0) {
    console.log("\n⚠️  Sorunlu qualifier'lar (besin tipi kelime içerenler):");
    for (const p of problematic) {
      console.log(`  - ${p.name} [${p.qualifier.join(", ")}] (${p.slug})`);
    }
  }
};

seed();
