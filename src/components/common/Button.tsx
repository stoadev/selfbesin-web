type ButtonProps = {
  variant?: "primary" | "secondary" | "third" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-label"?: string; // Aria label desteği ekleyelim
};

const variantClasses = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700",
  secondary:
    "bg-white text-emerald-600 border border-emerald-600 hover:bg-emerald-100 dark:bg-gray-900 dark:text-emerald-600 dark:border-emerald-600 dark:hover:bg-emerald-900",
  third:
    "flex items-center gap-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-900 rounded-full transition-colors text-xs sm:text-sm whitespace-nowrap",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  onMouseDown,
  children,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled || loading}
      className={`
        rounded-full font-medium transition-colors duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Yükleniyor...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
