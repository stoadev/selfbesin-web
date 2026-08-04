import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Lightbulb,
  SendHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import DraftPanel from "../../components/DraftPanel";
import Button from "../../components/common/Button";
import { foodService } from "../../services/food.service";
import {
  aiChatService,
  type AiChatMessage,
} from "../../services/aiChat.service";
import {
  aiSearchService,
  type AiSearchItem,
} from "../../services/aiSearch.service";
import AiAnswerBlock from "../../components/AiAnswerBlock";
import type { AiAddStatus } from "../../components/AiAnswerBlock";
import { useAuth } from "../../hooks/useAuth";
import { useMeals } from "../../hooks/useMeals";
import { supabase } from "../../lib/supabase";
import { getMealSlot } from "../../utils/mealSlot";

type AssistantContent = {
  answer: string;
  items?: AiSearchItem[];
  total?: number;
};

type AddState = { isAdding: boolean; status: AiAddStatus };

function parseAssistantContent(content: unknown): AssistantContent {
  if (content && typeof content === "object") {
    const parsed = content as Record<string, unknown>;
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer : "",
      items: Array.isArray(parsed.items)
        ? (parsed.items as AiSearchItem[])
        : undefined,
      total: typeof parsed.total === "number" ? parsed.total : undefined,
    };
  }

  return { answer: typeof content === "string" ? content : "" };
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "text" in content) {
    const text = (content as { text: unknown }).text;
    if (typeof text === "string") return text;
  }
  return "";
}

export default function ChatPage() {
  const { id: chatId } = useParams();
  const [loaded, setLoaded] = useState<{
    chatId: string | null;
    messages: AiChatMessage[];
  }>({ chatId: null, messages: [] });
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraftItems] = useState<AiSearchItem[]>([]);
  const [draftAddState, setDraftAddState] = useState<AddState>({
    isAdding: false,
    status: "idle",
  });
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const askedRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScrollRef = useRef(false);

  const { user } = useAuth();
  const { refreshMeals } = useMeals();

  const isLoading = !chatId || loaded.chatId !== chatId;
  const messages = loaded.messages;
  const lastMessage = messages[messages.length - 1];
  const needsAnswer = !isLoading && lastMessage?.role === "user";
  const isAnswering = needsAnswer && !error;
  const draftTotal = draft.reduce((acc, item) => acc + (item.calories || 0), 0);

  useEffect(() => {
    if (!chatId) return;

    let active = true;
    didInitialScrollRef.current = false;

    aiChatService
      .getMessages(chatId)
      .then((data) => {
        if (!active) return;
        setError(null);
        setLoaded({ chatId, messages: data });
      })
      .catch((err) => {
        console.error("Error fetching chat messages:", err);
        if (active) setLoaded({ chatId, messages: [] });
      });

    return () => {
      active = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    let active = true;

    aiChatService
      .getDraft(chatId)
      .then((items) => {
        if (active) setDraftItems(items);
      })
      .catch((err) => {
        console.error("Error fetching chat draft:", err);
      });

    return () => {
      active = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (isLoading) return;

    const container = scrollRef.current;
    if (!container) return;

    const behavior: ScrollBehavior = didInitialScrollRef.current
      ? "smooth"
      : "auto";
    didInitialScrollRef.current = true;

    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior });
      });
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [isLoading, messages, isAnswering]);

  useEffect(() => {
    if (!chatId || !needsAnswer || !lastMessage) return;

    const askKey = `${chatId}|${lastMessage.id}`;
    if (askedRef.current === askKey) return;
    askedRef.current = askKey;

    let active = true;

    const askAndStore = async () => {
      try {
        const history = messages.slice(-6).map((message) => ({
          role: message.role,
          text:
            message.role === "user"
              ? extractText(message.content)
              : parseAssistantContent(message.content).answer,
        }));

        const res = await aiSearchService.ask(
          extractText(lastMessage.content),
          history,
          draft,
        );
        await aiChatService.addMessage(chatId, "assistant", {
          answer: res.answer,
          items: res.items,
          total: res.total,
        });

        const rawIntent = (res as unknown as { intent?: unknown }).intent;
        const intent = typeof rawIntent === "string" ? rawIntent : "new";

        const currentDraft = await aiChatService.getDraft(chatId);
        const nextDraft = aiChatService.applyIntent(
          currentDraft,
          intent,
          res.items ?? [],
        );
        await aiChatService.setDraft(chatId, nextDraft);

        const data = await aiChatService.getMessages(chatId);
        if (active) {
          setDraftItems(nextDraft);
          setLoaded({ chatId, messages: data });
        }
      } catch (err) {
        console.error("Error answering chat message:", err);
        if (active) setError("Cevap alınamadı, tekrar deneyin.");
      }
    };

    askAndStore();

    return () => {
      active = false;
    };
  }, [chatId, needsAnswer, lastMessage, messages, draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!chatId || !text || isSending) return;

    setIsSending(true);
    try {
      await aiChatService.addMessage(chatId, "user", { text });
      setInputValue("");
      const data = await aiChatService.getMessages(chatId);
      setError(null);
      setLoaded({ chatId, messages: data });
    } catch (err) {
      console.error("Error sending chat message:", err);
      setError("Mesaj gönderilemedi, tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggest = async () => {
    try {
      const food = await foodService.getRandomFood();
      if (food) {
        setInputValue(food.display_name?.trim() || food.name || "");
      }
    } catch (err) {
      console.error("Error getting random food:", err);
    }
  };

  const handleAddToLog = async () => {
    if (!user || draft.length === 0) return;
    if (draftAddState.isAdding || draftAddState.status === "success") return;

    setDraftAddState({ isAdding: true, status: "idle" });

    try {
      const now = new Date();
      const loggedDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split("T")[0];

      const { data: meal, error: mealError } = await supabase
        .from("selfbesin_meals")
        .insert([
          {
            user_id: user.id,
            logged_date: loggedDate,
            name: getMealSlot(now).name,
          },
        ])
        .select()
        .single();

      if (mealError) throw mealError;

      const { error: foodsError } = await supabase
        .from("selfbesin_meal_foods")
        .insert(
          draft.map((item) => ({
            meal_id: meal.id,
            food_id: item.food_id,
            user_id: user.id,
            grams: item.grams,
            calories: item.calories,
          })),
        );

      if (foodsError) throw foodsError;

      await refreshMeals();

      if (chatId) await aiChatService.setDraft(chatId, []);
      setDraftItems([]);
      setDraftAddState({ isAdding: false, status: "success" });
    } catch (err) {
      console.error("Error adding AI items to log:", err);
      setDraftAddState({ isAdding: false, status: "error" });
    }
  };

  const handleRemoveDraftItem = async (index: number) => {
    if (!chatId) return;

    const next = draft.filter((_, i) => i !== index);
    setDraftItems(next);
    setDraftAddState({ isAdding: false, status: "idle" });

    try {
      await aiChatService.setDraft(chatId, next);
    } catch (err) {
      console.error("Error updating chat draft:", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row lg:gap-4">
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto w-full max-w-2xl mx-auto px-4 py-6 md:py-8"
        >
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-2/3 ml-auto rounded-2xl bg-gray-100 dark:bg-gray-900" />
              <div className="h-24 w-full rounded-2xl bg-gray-100 dark:bg-gray-900" />
              <div className="h-10 w-1/2 ml-auto rounded-2xl bg-gray-100 dark:bg-gray-900" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-20">
              Bu sohbette henüz mesaj yok.
            </p>
          ) : (
            <ul className="space-y-6">
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <li key={message.id} className="flex justify-end">
                      <p className="w-fit max-w-lg rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                        {extractText(message.content) ||
                          JSON.stringify(message.content)}
                      </p>
                    </li>
                  );
                }

                const parsed = parseAssistantContent(message.content);

                return (
                  <li key={message.id} className="flex justify-start">
                    <div className="w-full max-w-lg [&>section]:mb-0">
                      <AiAnswerBlock
                        answer={parsed.answer}
                        items={parsed.items}
                        total={parsed.total}
                        isLoading={false}
                        isLoggedIn={true}
                        isChat
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {isAnswering && (
            <div className="mt-6 w-full max-w-lg [&>div]:mb-0 [&>section]:mb-0">
              <AiAnswerBlock
                answer=""
                isLoading={true}
                isLoggedIn={true}
                isChat
              />
            </div>
          )}

          {error && (
            <p className="mt-4 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="lg:hidden shrink-0 w-full max-w-2xl mx-auto px-4">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsDraftOpen((open) => !open)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <span className="truncate">
                Öğün ({draft.length} besin, {Math.round(draftTotal)} kcal)
              </span>
              {isDraftOpen ? (
                <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" />
              )}
            </button>

            {isDraftOpen && (
              <div className="px-4 pb-4 max-h-[40dvh] flex flex-col min-h-0">
                <DraftPanel
                  items={draft}
                  total={draftTotal}
                  isAdding={draftAddState.isAdding}
                  addStatus={draftAddState.status}
                  onAdd={handleAddToLog}
                  onRemove={handleRemoveDraftItem}
                />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 w-full max-w-2xl mx-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-[2dvw] sm:gap-[1dvw] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl ring-1 ring-black/5 dark:ring-white/10 rounded-full px-[4dvw] py-2.5 sm:px-5 sm:py-3 transition-all duration-300">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-gray-400" />
              <input
                type="search"
                enterKeyHint="send"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Elma, yumurta..."
                className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none bg-transparent min-w-0"
              />
              <Button
                type="button"
                variant="third"
                size="md"
                onClick={handleSuggest}
                className="!p-2"
              >
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputValue.trim() || isSending}
                className={`transition-opacity ${
                  inputValue.trim() ? "opacity-100" : "opacity-50"
                }`}
              >
                <SendHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <aside className="hidden lg:flex flex-col shrink-0 w-full max-w-sm min-h-0 border-l border-gray-100 dark:border-gray-800 px-4 py-6">
        <DraftPanel
          items={draft}
          total={draftTotal}
          isAdding={draftAddState.isAdding}
          addStatus={draftAddState.status}
          onAdd={handleAddToLog}
          onRemove={handleRemoveDraftItem}
        />
      </aside>
    </div>
  );
}
