"use client";

import { useUi } from "../../contexts/UiContext";
import { Globe, Moon, Sun } from "lucide-react";

export function UiToggles() {
  const { theme, toggleTheme, lang, setLang } = useUi();

  const nextLang = lang === "en" ? "es" : "en";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setLang(nextLang)}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent hover:shadow-sm active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-inner">
          <Globe size={14} className="text-cyan-500" />
        </span>
        {lang.toUpperCase()}
      </button>

      <button
        onClick={toggleTheme}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent hover:shadow-sm active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-inner">
          {theme === "dark" ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
        </span>
        {theme === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  );
}