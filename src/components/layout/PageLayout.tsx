import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";
import { Utensils, Search } from "lucide-react";
import Button from "../common/Button";

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

  const isMealsPage = location.pathname === "/meals";
  const isDetailsPage = location.pathname.startsWith("/besin/");

  return (
    <div
      className={`${
        isMealsPage ? "h-[100dvh]" : "min-h-[100dvh]"
      } grid grid-rows-[auto_1fr_auto] bg-white bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 overflow-hidden`}
    >
      <Navbar />
      <main
        className={`flex flex-col w-full h-full ${
          isMealsPage ? "overflow-hidden" : ""
        } ${className}`}
      >
        <Outlet />
      </main>
      {showFooter && <Footer />}

      {user && !isDetailsPage && (
        <Button
          to={isMealsPage ? "/" : "/meals"}
          variant="cta"
          className=" py-3"
          isFloating
        >
          {isMealsPage ? (
            <>
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-bold tracking-wide">Besin Ara</span>
            </>
          ) : (
            <>
              <Utensils className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm font-bold tracking-wide">Öğünlerim</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
