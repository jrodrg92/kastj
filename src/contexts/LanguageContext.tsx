"use client";

import { useUi } from "./UiContext";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // No longer needed as UiProvider handles it
}

export function useLanguage() {
  return useUi();
}