"use client";

import { useUiPreferences } from "../../hooks/useUiPreferences";
import { useLanguage } from "../../contexts/LanguageContext";

export function UiToggles() {
  const { theme, toggleTheme } = useUiPreferences();
  const { lang, setLang } = useLanguage();

  const nextLang = lang === "en" ? "es" : "en";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setLang(nextLang)}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent hover:shadow-sm active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      >
        <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-inner">
          <img 
            src={lang === "en" ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/es.png"} 
            alt={lang === "en" ? "English" : "Español"}
            className="h-full w-full object-cover scale-150"
          />
        </span>
        {lang.toUpperCase()}
      </button>

      <button
        onClick={toggleTheme}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent hover:shadow-sm active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-inner">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
        {theme === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  );
}