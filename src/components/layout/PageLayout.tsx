import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";
import { Utensils, Search } from "lucide-react";
import Button from "../common/Button";
import ChatBot from "../common/ChatBot";

type PageLayoutProps = {
  showFooter?: boolean;
  className?: string;
};

export default function PageLayout({
  showFooter = true,
  className = "",
}: PageLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLandingPage = location.pathname === "/";
  const isMealsPage = location.pathname === "/meals";
  const isDetailsPage = location.pathname?.startsWith("/besin/");

  const isChatPage = location.pathname?.startsWith("/chat/");

  const handleMealsBack = () => {
    if (location.key === "default") {
      navigate("/");
      return;
    }
    navigate(-1);
  };

  return (
    <div
      className={`${
        isMealsPage || isChatPage || isDetailsPage || isLandingPage
          ? "h-[100dvh]"
          : "min-h-[100dvh]"
      } ${
        isDetailsPage ? "flex flex-col" : "grid grid-rows-[auto_1fr_auto]"
      } bg-white bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 overflow-x-hidden`}
    >
      {!isDetailsPage && <Navbar />}
      <main
        key={location.key}
        className={`flex flex-col w-full h-full min-w-0 page-transition ${
          isMealsPage || isChatPage || isDetailsPage ? "overflow-hidden" : ""
        } ${className}`}
      >
        <Outlet />
      </main>
      {showFooter && !isDetailsPage && !isChatPage && <Footer />}

      {user && !isDetailsPage && !isChatPage && <ChatBot />}

      {user && !isDetailsPage && !isChatPage && (
        <Button
          {...(isMealsPage ? { onClick: handleMealsBack } : { to: "/meals" })}
          variant="cta"
          className="w-[15dvw] h-[15dvw] md:w-16 md:h-16 p-0 shadow-[0_12px_40px_-8px_rgba(16,185,129,0.5)] dark:shadow-[0_12px_40px_-8px_rgba(5,150,105,0.4)] border-2 border-white/30 dark:border-emerald-500/30 ring-4 ring-emerald-500/5 hover:scale-105 active:scale-95 transition-all duration-300"
          isFloating
          aria-label={isMealsPage ? "Besin Ara" : "Öğünlerim"}
        >
          {isMealsPage ? (
            <Search className="w-[7dvw] h-[7dvw] md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <Utensils className="w-[7dvw] h-[7dvw] md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-300" />
          )}
        </Button>
      )}
    </div>
  );
}
