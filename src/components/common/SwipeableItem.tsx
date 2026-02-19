import React, { useState, useRef, useEffect } from "react";

interface SwipeableItemProps {
  children: React.ReactNode;
  actions: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
    textColor?: string;
  }[];
  threshold?: number;
}

export default function SwipeableItem({
  children,
  actions,
  threshold = 60,
}: SwipeableItemProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxTranslate = actions.length * 64; // Her buton yaklaşık 64px genişliğinde

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const diff = e.touches[0].clientX - startX;

    // Sadece sola kaydırmaya izin ver (veya açıkken sağa)
    if (diff < 0 || isOpen) {
      let translate = isOpen ? -maxTranslate + diff : diff;

      // Limitler
      if (translate > 0) translate = 0;
      if (translate < -maxTranslate - 20) translate = -maxTranslate - 20;

      setCurrentX(translate);
    }
  };

  const handleTouchEnd = () => {
    if (currentX < -threshold) {
      setCurrentX(-maxTranslate);
      setIsOpen(true);
    } else {
      setCurrentX(0);
      setIsOpen(false);
    }
    setStartX(null);
  };

  // Dışarı tıklandığında kapat
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setCurrentX(0);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative overflow-hidden group">
      {/* Arka Plan Eylemleri */}
      <div className="absolute inset-0 flex justify-end items-stretch pointer-events-none">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              setCurrentX(0);
              setIsOpen(false);
            }}
            className={`w-16 h-full flex flex-col items-center justify-center transition-all duration-200 pointer-events-auto ${action.color} ${action.textColor || "text-white"}`}
            style={{
              opacity: currentX < -20 ? 1 : 0,
              transform: `translateX(${isOpen ? 0 : 20}px)`,
            }}
          >
            <div className="mb-1">{action.icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Ön Plan İçerik */}
      <div
        className="relative transition-transform duration-200 ease-out will-change-transform bg-white dark:bg-gray-950"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${currentX}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
