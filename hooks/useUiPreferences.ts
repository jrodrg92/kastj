"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LANG, DEFAULT_THEME, Lang, Theme } from "../lib/uiPreferences";

export function useUiPreferences() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const savedLang = localStorage.getItem("kastj-lang") as Lang | null;
    const savedTheme = localStorage.getItem("kastj-theme") as Theme | null;

    if (savedLang === "en" || savedLang === "es") {
      setLang(savedLang);
    }

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);

      // 🔥 CLAVE: usar "dark", no "light"
      document.documentElement.classList.toggle(
        "dark",
        savedTheme === "dark"
      );
    }
  }, []);

  function toggleLang() {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem("kastj-lang", next);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("kastj-theme", next);

    // 🔥 CLAVE AQUÍ TAMBIÉN
    document.documentElement.classList.toggle(
      "dark",
      next === "dark"
    );
  }

  return {
    lang,
    theme,
    toggleLang,
    toggleTheme,
  };
}