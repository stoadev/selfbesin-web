import { supabase } from "../lib/supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
  action?: {
    type: "meal_added" | "food_added" | "meal_created";
    data?: Record<string, unknown>;
  };
}

export const chatService = {
  async sendMessage(
    message: string,
    history: ChatMessage[],
    userId: string,
    meals: { id: string; name: string }[] = [],
  ): Promise<ChatResponse> {
    const webhookUrl = import.meta.env.VITE_CHATBOT_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error("Chatbot webhook URL not configured.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }

    void userId;
    const payload = { message, history: history.slice(-10), meals };
    console.log("ChatBot payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    const data = await response.json();

    // n8n'den gelen yanıtı normalize et
    if (typeof data === "string") {
      return { reply: data };
    }

    return {
      reply: data.reply || data.output || data.text || "Bir hata olustu.",
      action: data.action,
    };
  },
};
