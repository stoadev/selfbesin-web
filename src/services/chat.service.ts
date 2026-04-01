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
  ): Promise<ChatResponse> {
    const webhookUrl = import.meta.env.VITE_CHATBOT_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error("Chatbot webhook URL not configured.");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-10), // son 10 mesajı gönder
        userId,
      }),
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
