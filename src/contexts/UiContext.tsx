"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Lang, translations } from "../lib/i18n";

type Theme = "light" | "dark";
type TranslationKeys = (typeof translations)["en"];

export type TransactionStatus = 
  | { state: "idle" }
  | { state: "signing"; message?: string }
  | { state: "processing"; txHash?: string }
  | { state: "success"; txHash: string; message?: string }
  | { state: "error"; message: string };

interface UiContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: TranslationKeys;
  txStatus: TransactionStatus;
  setTxStatus: (status: TransactionStatus) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ state: "idle" });

  useEffect(() => {
    // Load saved preferences
    const savedLang = localStorage.getItem("kastj-lang") as Lang | null;
    const savedTheme = localStorage.getItem("kastj-theme") as Theme | null;

    if (savedLang === "en" || savedLang === "es") {
      setLangState(savedLang);
    }

    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark if no preference
      document.documentElement.classList.add("dark");
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem("kastj-lang", next);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    localStorage.setItem("kastj-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <UiContext.Provider
      value={{
        lang,
        setLang,
        theme,
        toggleTheme,
        t: translations[lang],
        txStatus,
        setTxStatus,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
