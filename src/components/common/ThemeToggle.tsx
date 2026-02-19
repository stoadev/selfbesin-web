import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import Button from "./Button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={toggleTheme}
      className="!p-2 rounded-full border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
      aria-label="Temayı değiştir"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </Button>
  );
}
