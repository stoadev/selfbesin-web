import { createContext } from "react";
import type { MealWithFoods } from "../types";

export type MealContextType = {
  meals: MealWithFoods[];
  loading: boolean;
  refreshMeals: (showLoading?: boolean) => Promise<MealWithFoods[]>;
  setMeals: (meals: MealWithFoods[]) => void;
};

export const MealContext = createContext<MealContextType | undefined>(
  undefined,
);
