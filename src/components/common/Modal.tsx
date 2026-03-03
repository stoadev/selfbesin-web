import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
};

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-[480px]",
  maxHeight = "max-h-[90vh]",
  className = "",
  showCloseButton = true,
  closeButtonClassName = "top-6 right-6",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const pendingCloseRef = useRef(false);

  // User-initiated close: animate first, then notify parent
  const requestClose = useCallback(() => {
    if (pendingCloseRef.current) return;
    pendingCloseRef.current = true;
    setVisible(false);
  }, []);

  // Mount/unmount with animation
  useEffect(() => {
    if (isOpen) {
      pendingCloseRef.current = false;
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Unmount after fade-out transition ends
  const handleTransitionEnd = () => {
    if (!visible) {
      setMounted(false);
      if (pendingCloseRef.current) {
        pendingCloseRef.current = false;
        onClose();
      }
    }
  };

  // Body overflow toggle
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mounted]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        requestClose();
      }
    };

    if (mounted) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mounted, requestClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-max flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200 ${
        visible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        ref={modalRef}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        className={`w-full ${maxWidth} ${maxHeight} overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl flex flex-col relative transition-all duration-200 ${
          visible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95"
        } ${className}`}
        role="dialog"
      >
        {showCloseButton && (
          <button
            onClick={requestClose}
            aria-label="Close"
            className={`absolute ${closeButtonClassName} p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
