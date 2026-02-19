import { useRef, useEffect } from "react";
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

  // Body overflow toggle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-max flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} ${maxHeight} overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200 ${className}`}
        role="dialog"
      >
        {showCloseButton && (
          <button
            onClick={onClose}
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
