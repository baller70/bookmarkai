import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-110 shadow-md"
      aria-label="Toggle theme"
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
      <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500" />
    </button>
  );
}
