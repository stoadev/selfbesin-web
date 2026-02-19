import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

type PageLayoutProps = {
  showFooter?: boolean;
  className?: string;
};

export default function PageLayout({
  showFooter = true,
  className = "",
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white bg-gradient-to-b dark:from-gray-900 dark:to-gray-950">
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
    </div>
  );
}
