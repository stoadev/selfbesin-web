import { useContext } from "react";
import { MealContext } from "../context/MealContextBase";

export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error("useMeals must be used within a MealProvider");
  }
  return context;
}
