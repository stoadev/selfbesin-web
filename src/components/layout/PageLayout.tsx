import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";
import { Utensils } from "lucide-react";

type PageLayoutProps = {
  showFooter?: boolean;
  className?: string;
};

export default function PageLayout({
  showFooter = true,
  className = "",
}: PageLayoutProps) {
  const { user } = useAuth();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 overflow-x-hidden">
      <Navbar />
      {/*
        flex-1: Navbar ve Footer dışındaki tüm alanı kaplar
        flex flex-col: Sayfa içindeki öğelerin (HeroSection gibi) dikeyde büyümesini/ortalanmasını sağlar
        pt-nav: Fixed Navbar boyu kadar içeriği aşağı itir (64px)
      */}
      <main className={`flex-1 flex flex-col pt-nav w-full ${className}`}>
        <Outlet />
      </main>
      {showFooter && <Footer />}

      {/* Floating Meals FAB */}
      {user && (
        <Link
          to="/meals"
          className="fixed bottom-12 sm:bottom-8 right-4 z-40 group flex items-center gap-3 px-5 py-3.5 bg-emerald-600/90 dark:bg-emerald-500/90 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 active:scale-95"
        >
          <Utensils className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-sm font-bold tracking-wide">Öğünlerim</span>
        </Link>
      )}
    </div>
  );
}
