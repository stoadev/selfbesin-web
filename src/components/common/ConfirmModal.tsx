import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Evet, Eminim",
  cancelText = "İptal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      iconBg: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      buttonVariant: "redSecondary" as const,
    },
    warning: {
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      buttonVariant: "secondary" as const,
    },
    info: {
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonVariant: "blueSecondary" as const,
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[400px]"
      showCloseButton={false}
    >
      <div className="p-[3dvh] text-center">
        <div
          className={`w-16 h-16 ${style.iconBg} ${style.iconColor} rounded-2xl flex items-center justify-center mx-auto mb-[2dvh]`}
        >
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-[1dvh]">
          {title}
        </h3>

        <p className="text-gray-500 dark:text-gray-400 mb-[4dvh]">{message}</p>

        <div className="flex flex-col sm:flex-row gap-[1.5dvw]">
          <Button
            variant="ghost"
            className="flex-1 order-2 sm:order-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={style.buttonVariant}
            className="flex-1 order-1 sm:order-2"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
