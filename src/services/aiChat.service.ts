import { supabase } from "../lib/supabase";
import type { AiSearchItem } from "./aiSearch.service";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: unknown;
  created_at: string;
}

function getFirstWord(name: string) {
  return (name || "").trim().split(/\s+/)[0]?.toLocaleLowerCase("tr") || "";
}

export const aiChatService = {
  async createChat(): Promise<string> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("Oturum bulunamadı.");

    const { data, error } = await supabase
      .from("selfbesin_ai_chats")
      .insert([{ user_id: session.user.id }])
      .select("id")
      .single();

    if (error) throw error;

    return data.id;
  },

  async getMessages(chatId: string): Promise<AiChatMessage[]> {
    const { data, error } = await supabase
      .from("selfbesin_ai_messages")
      .select("id, role, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async addMessage(
    chatId: string,
    role: "user" | "assistant",
    content: unknown,
  ): Promise<void> {
    const { error } = await supabase
      .from("selfbesin_ai_messages")
      .insert([{ chat_id: chatId, role, content }]);

    if (error) throw error;
  },

  async getDraft(chatId: string): Promise<AiSearchItem[]> {
    const { data, error } = await supabase
      .from("selfbesin_ai_chats")
      .select("draft_items")
      .eq("id", chatId)
      .single();

    if (error) throw error;

    return Array.isArray(data?.draft_items) ? data.draft_items : [];
  },

  async setDraft(chatId: string, items: AiSearchItem[]): Promise<void> {
    const { error } = await supabase
      .from("selfbesin_ai_chats")
      .update({ draft_items: items })
      .eq("id", chatId);

    if (error) throw error;
  },

  applyIntent(
    current: AiSearchItem[],
    intent: string,
    incoming: AiSearchItem[],
  ): AiSearchItem[] {
    if (intent === "clear") {
      return [];
    }

    if (intent === "correction") {
      return incoming.reduce<AiSearchItem[]>(
        (acc, item) => {
          const next = [...acc];

          const byId = next.findIndex((c) => c.food_id === item.food_id);
          if (byId !== -1) {
            next[byId] = item;
            return next;
          }

          const firstWord = getFirstWord(item.name);
          const byName = firstWord
            ? next.findIndex((c) => getFirstWord(c.name) === firstWord)
            : -1;

          if (byName !== -1) {
            next[byName] = item;
            return next;
          }

          next.push(item);
          return next;
        },
        [...current],
      );
    }

    return [...current, ...incoming];
  },
};
