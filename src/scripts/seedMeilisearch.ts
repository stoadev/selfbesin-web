import { MeiliSearch } from "meilisearch";
import { supabase } from "../lib/supabase";

const client = new MeiliSearch({
  host: import.meta.env.VITE_MEILISEARCH_URL,
  apiKey: import.meta.env.VITE_MEILISEARCH_API_KEY,
});

const seed = async () => {
  const { data, error } = await supabase.from("foods").select("*");
  if (error) throw error;

  const index = client.index("foods");
  await index.addDocuments(data ?? []);
  await index.updateSettings({
    searchableAttributes: ["name", "brand", "slug"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
  });

  console.log("Yüklendi:", data?.length, "besin");
};

seed();
