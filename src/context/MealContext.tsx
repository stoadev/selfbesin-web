import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { MealWithFoods } from "../types";
import { MealContext } from "./MealContextBase";

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithFoods[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheKey = useRef(user ? `meals_cache_${user.id}` : null);

  const refreshMeals = useCallback(
    async (showLoading = false) => {
      if (!user) return [];
      if (showLoading) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("selfbesin_meals")
          .select(
            `
          *,
          selfbesin_meal_foods (
            *,
            food:selfbesin_foods (*)
          )
        `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const fetchedMeals = data || [];
        setMeals(fetchedMeals);

        // Update cache
        if (cacheKey.current) {
          localStorage.setItem(cacheKey.current, JSON.stringify(fetchedMeals));
        }

        return fetchedMeals;
      } catch (error) {
        console.error("Error fetching meals:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // Initialize from cache
  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    cacheKey.current = `meals_cache_${user.id}`;
    const cachedData = localStorage.getItem(cacheKey.current);
    if (cachedData) {
      try {
        setMeals(JSON.parse(cachedData));
      } catch (e) {
        console.error("Error parsing meals cache:", e);
      }
    }

    // Initial fetch
    refreshMeals(meals.length === 0);
  }, [user, refreshMeals]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MealContext.Provider value={{ meals, loading, refreshMeals, setMeals }}>
      {children}
    </MealContext.Provider>
  );
}
