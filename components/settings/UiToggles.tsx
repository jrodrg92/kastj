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
        className="flex h-10 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800 light:border-zinc-300 light:bg-white light:text-zinc-900"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-base light:bg-zinc-100">
          {lang === "en" ? "🇬🇧" : "🇪🇸"}
        </span>
        {lang.toUpperCase()}
      </button>

      <button
        onClick={toggleTheme}
        className="flex h-10 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800 light:border-zinc-300 light:bg-white light:text-zinc-900"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 light:bg-zinc-100">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
        {theme === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  );
}