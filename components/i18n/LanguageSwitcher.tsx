export function LanguageSwitcher({
  lang,
  changeLang,
}: {
  lang: string;
  changeLang: (l: "en" | "es") => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLang("en")}
        className={`rounded-lg px-3 py-1 text-sm ${
          lang === "en"
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => changeLang("es")}
        className={`rounded-lg px-3 py-1 text-sm ${
          lang === "es"
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        ES
      </button>
    </div>
  );
}