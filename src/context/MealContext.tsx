import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { MealWithFoods } from "../types";
import { MealContext } from "./MealContextBase";

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithFoods[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const cacheKey = useRef(
    user ? `meals_cache_${user.id}_${getTodayDate()}` : null,
  );

  const refreshMeals = useCallback(
    async (showLoading = false) => {
      if (!user) return [];
      if (showLoading) setLoading(true);

      cacheKey.current = `meals_cache_${user.id}_${selectedDate}`;

      try {
        const { data, error } = await supabase
          .from("selfbesin_meals")
          .select(
            `
          *,
          meal_foods:selfbesin_meal_foods (
            *,
            food:selfbesin_foods (*)
          )
        `,
          )
          .eq("user_id", user.id)
          .eq("logged_date", selectedDate)
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
    [user, selectedDate],
  );

  // Initialize from cache
  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    cacheKey.current = `meals_cache_${user.id}_${selectedDate}`;
    const cachedData = localStorage.getItem(cacheKey.current);
    if (cachedData) {
      try {
        setMeals(JSON.parse(cachedData));
      } catch (e) {
        console.error("Error parsing meals cache:", e);
      }
    } else {
      setMeals([]);
    }

    // Initial fetch
    refreshMeals(meals.length === 0);
  }, [user, selectedDate, refreshMeals]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MealContext.Provider
      value={{
        meals,
        loading,
        selectedDate,
        setSelectedDate,
        refreshMeals,
        setMeals,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}
