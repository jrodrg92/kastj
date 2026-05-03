import React, { useState, useRef, useEffect } from "react";

export type SortOption = "newest" | "raised" | "ending";

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
  labels: {
    newest: string;
    raised: string;
    ending: string;
  };
}

export function SortDropdown({ value, onChange, labels }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { value: SortOption; label: string; icon: string }[] = [
    { value: "newest", label: labels.newest, icon: "✨" },
    { value: "raised", label: labels.raised, icon: "📈" },
    { value: "ending", label: labels.ending, icon: "⌛" },
  ];

  const activeOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative md:w-56" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] px-5 text-sm font-bold text-foreground transition-all hover:bg-white/[0.04] active:scale-95 outline-none focus:border-cyan-500/40 focus:bg-background/60 focus:ring-1 focus:ring-cyan-500/30"
      >
        <span className="flex items-center gap-3">
          <span className="text-base grayscale opacity-70">{activeOption.icon}</span>
          {activeOption.label}
        </span>
        <svg
          className={`h-4 w-4 text-cyan-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[200] mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                value === opt.value
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-foreground/70 hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <span className="text-base grayscale opacity-70">{opt.icon}</span>
              {opt.label}
              {value === opt.value && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
