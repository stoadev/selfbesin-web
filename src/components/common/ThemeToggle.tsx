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
      variant="third"
      size="md"
      onClick={toggleTheme}
      className="!p-2"
      aria-label="Temayı değiştir"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
