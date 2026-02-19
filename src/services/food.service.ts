import { supabase } from "../lib/supabase";
import type { Food } from "../types";

export const foodService = {
  async searchFoods(query: string): Promise<Food[]> {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching foods:", error);
      return [];
    }

    return data || [];
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
