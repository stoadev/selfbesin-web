import { Link, type LinkProps } from "react-router-dom";
import React, { type ElementType } from "react";

type ButtonProps = Omit<Partial<LinkProps>, "as" | "to"> & {
  variant?:
    | "primary"
    | "secondary"
    | "third"
    | "ghost"
    | "redSecondary"
    | "bluePrimary"
    | "blueSecondary"
    | "cta"
    | "blueCta";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-label"?: string;
  as?: ElementType;
  to?: string;
  isFloating?: boolean;
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
  redSecondary:
    "bg-white text-red-600 border border-red-600 hover:bg-red-100 dark:bg-gray-950 dark:text-red-600 dark:border-red-600 dark:hover:bg-red-900",
  bluePrimary:
    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
  blueSecondary:
    "bg-white text-blue-600 border border-blue-600 hover:bg-blue-100 dark:bg-gray-900 dark:text-blue-600 dark:border-blue-600 dark:hover:bg-blue-900",
  cta: "bg-emerald-600/90 dark:bg-emerald-500/90 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] backdrop-blur-md",
  blueCta:
    "bg-blue-600/90 dark:bg-blue-500/90 hover:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.5)] backdrop-blur-md",
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
  as: Component = "button",
  to,
  isFloating = false,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 text-center
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${isFloating ? "fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 right-4 z-40 group flex items-center gap-2 hover:-translate-y-1 active:scale-95" : ""}
    ${className}
  `;

  const content = loading ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Yükleniyor...
    </span>
  ) : (
    children
  );

  if (to) {
    return (
      <Link
        to={to}
        className={baseClasses}
        {...(props as Omit<LinkProps, "to">)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Component
      type={type}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled || loading}
      className={baseClasses}
      {...props}
    >
      {content}
    </Component>
  );
}
