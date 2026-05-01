"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Lang, translations } from "../lib/i18n";

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("kastj-lang");
    if (saved === "en" || saved === "es") {
      setLangState(saved);
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem("kastj-lang", next);
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}