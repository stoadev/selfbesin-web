import { Outlet, useLocation } from "react-router-dom";
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

  const isLandingPage = location.pathname === "/";
  const isMealsPage = location.pathname === "/meals";
  const isDetailsPage = location.pathname?.startsWith("/besin/");

  return (
    <div
      className={`${
        isMealsPage || isDetailsPage || isLandingPage
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
          isMealsPage || isDetailsPage ? "overflow-hidden" : ""
        } ${className}`}
      >
        <Outlet />
      </main>
      {showFooter && !isDetailsPage && <Footer />}

      {user && !isDetailsPage && <ChatBot />}

      {user && !isDetailsPage && (
        <Button
          to={isMealsPage ? "/" : "/meals"}
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
