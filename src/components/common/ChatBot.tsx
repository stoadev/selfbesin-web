import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatService, type ChatMessage } from "../../services/chat.service";
import { useAuth } from "../../hooks/useAuth";
import { useMeals } from "../../hooks/useMeals";

const STORAGE_KEY = "chatbot_messages";
const MAX_MESSAGES = 20;
const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Merhaba! Ben Selfbesin asistaniyim. Ogun eklemek, besin aramak veya beslenme hakkinda sorular sormak icin bana yazabilirsin.",
};

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [INITIAL_MESSAGE];
}

function saveMessages(msgs: ChatMessage[]) {
  const trimmed = msgs.slice(-MAX_MESSAGES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export default function ChatBot() {
  const { user } = useAuth();
  const { refreshMeals, meals } = useMeals();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !user) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatService.sendMessage(
        text,
        messages,
        user.id,
        meals.map((m) => ({ id: m.id, name: m.name })),
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);

      refreshMeals();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Baglanti hatasi olustu. Lutfen tekrar deneyin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 left-4 z-40 w-[15dvw] h-[15dvw] md:w-16 md:h-16 rounded-full bg-emerald-600/90 dark:bg-emerald-500/90 text-white shadow-[0_12px_40px_-8px_rgba(5,150,105,0.5)] dark:shadow-[0_12px_40px_-8px_rgba(16,185,129,0.4)] border-2 border-white/30 dark:border-emerald-500/30 ring-4 ring-emerald-500/5 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
          aria-label="Chatbot"
        >
          <img src="/icons/robot.svg" width={24} height={24} className="w-[10dvw] h-[10dvw] md:w-12 md:h-12 group-hover:scale-110 transition-transform duration-300 invert" alt="" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 sm:bottom-6 sm:left-4 z-50 w-full sm:w-96 h-[100dvh] sm:h-[32rem] flex flex-col bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-[fade-in-standard_0.3s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 dark:bg-emerald-700 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">Selfbesin Asistan</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajinizi yazin..."
                className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                aria-label="Gonder"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
