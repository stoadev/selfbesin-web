export interface Food {
  id: string;
  name: string;
  slug: string;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  serving_unit_name?: string;
  serving_unit_grams?: number;
  created_at?: string;
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
