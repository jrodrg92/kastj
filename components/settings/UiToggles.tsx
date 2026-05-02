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
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-base border border-border">
          {lang === "en" ? "🇬🇧" : "🇪🇸"}
        </span>
        {lang.toUpperCase()}
      </button>

      <button
        onClick={toggleTheme}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-3 text-sm font-bold text-foreground transition hover:bg-accent"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
        {theme === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  );
}