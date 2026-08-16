export interface FoodUnit {
  name: string;
  grams: number;
}

export interface Food {
  id: string;
  name?: string;
  display_name?: string;
  base_name?: string;
  variety?: string;
  product_line?: string;
  qualifier?: string[];
  slug: string;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  serving_units: FoodUnit[];
  category?: string;
  brand?: string;
  image_url?: string;
  basis_unit?: string;
  created_at?: string;
  // Meilisearch ranking fields (not in Supabase)
  qualifier_count?: number;
  qualifier_score?: number;
  brand_priority?: number;
  qualifier_vector?: string;
}

export function getBasisLabel(food: { basis_unit?: string }) {
  const isML = food.basis_unit === "ml";
  return {
    unit: isML ? "ml" : "g",
    unitLabel: isML ? "ml" : "Gram",
    quantityLabel: isML ? "Miktar (ml)" : "Miktar (gram)",
  };
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface MealFood {
  id: string;
  meal_id: string;
  food_id: string;
  grams: number;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  created_at: string;
  food?: Food;
}

export interface MealWithFoods extends Meal {
  meal_foods: MealFood[];
}
