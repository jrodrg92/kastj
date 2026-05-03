import React from "react";

export function InfoTooltip({ content }: { content: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <span className="cursor-help text-muted-foreground hover:text-foreground transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 opacity-0 transition-all group-hover:opacity-100 z-50">
        <div className="premium-glass rounded-xl p-3 text-xs leading-relaxed shadow-2xl">
          {content}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-border/50"></div>
        </div>
      </div>
    </div>
  );
}
