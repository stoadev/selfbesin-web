import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Food } from "../types";

export const useFoods = () => {
  return useQuery({
    queryKey: ["foods"],
    queryFn: async (): Promise<Food[]> => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
};
