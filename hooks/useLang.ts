import { useEffect, useState } from "react";
import { translations, defaultLang, Lang } from "../lib/i18n";

export function useLang() {
  const [lang, setLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang;
    if (saved) setLang(saved);
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("lang", l);
  }

  const t = translations[lang];

  return { lang, changeLang, t };
}