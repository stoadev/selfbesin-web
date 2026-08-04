import { useState, useEffect, useRef } from "react";
import { Search, Lightbulb, SendHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import AuthModal from "../../components/common/AuthModal";
import { foodService } from "../../services/food.service";
import { aiChatService } from "../../services/aiChat.service";
import { useAuth } from "../../hooks/useAuth";

export default function HeroSection() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  // Pencere boyutu değiştiğinde isMobile güncelle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sayfa açıldığında otomatik odaklan
  useEffect(() => {
    if (!isMobile) {
      searchInputRef.current?.focus();
    }
  }, [isMobile]);

  async function handleSuggest() {
    try {
      const food = await foodService.getRandomFood();
      if (food) {
        setQuery(food.display_name?.trim() || food.name || "");
      }
    } catch (error) {
      console.error("Error getting random food:", error);
    }
  }

  async function handleSubmit() {
    const term = query.trim();
    if (!term || isStartingChat) return;

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsStartingChat(true);
    try {
      const chatId = await aiChatService.createChat();
      await aiChatService.addMessage(chatId, "user", { text: term });
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <>
      <section className="flex-1 w-full flex flex-col items-center justify-center pb-[12dvh] sm:pb-[8dvh] px-[3dvw] sm:px-6">
        <div className="w-full max-w-3xl flex flex-col items-center gap-[3dvh] sm:gap-[4dvh]">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight text-center">
            Bugün ne <span className="text-emerald-600">yedin</span>?
          </h1>
          {/* Arama Barı - Her zaman rounded-full */}
          <div className="w-full relative">
            <div className="flex items-center gap-[2dvw] sm:gap-[1dvw] bg-white dark:bg-gray-800 shadow-lg rounded-full px-[4dvw] py-2.5 sm:px-5 sm:py-3 transition-all duration-300">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-gray-400" />
              <div className="flex-1 flex">
                <input
                  ref={searchInputRef}
                  type="search"
                  enterKeyHint="send"
                  value={query}
                  autoComplete="off"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  placeholder="Elma, yumurta..."
                  className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none bg-transparent min-w-0"
                />
              </div>
              <Button
                variant="third"
                size="md"
                onClick={handleSuggest}
                className="!p-2"
              >
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!query.trim() || isStartingChat}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className={`transition-opacity ${query.trim() ? "opacity-100" : "opacity-50"}`}
              >
                {isStartingChat ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
