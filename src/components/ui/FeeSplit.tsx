import React from "react";
import { InfoTooltip } from "./InfoTooltip";

export function FeeSplit() {
  return (
    <div className="group relative w-full pt-2">
      <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
        <span>Distribution</span>
      </div>
      
      <div className="flex h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
        {/* Recipient - 93% */}
        <div 
          className="h-full bg-cyan-500/80" 
          style={{ width: "93%" }}
          title="Recipient: 93%"
        ></div>
        {/* Creator - 5% */}
        <div 
          className="h-full bg-blue-500/80" 
          style={{ width: "5%" }}
          title="Creator: 5%"
        ></div>
        {/* Platform - 2% */}
        <div 
          className="h-full bg-zinc-500/50" 
          style={{ width: "2%" }}
          title="Platform: 2%"
        ></div>
      </div>

      {/* Legend on Hover (Compact) */}
      <div className="mt-2 flex items-center gap-3 text-[8px] font-bold uppercase tracking-tighter opacity-0 transition-opacity duration-500 group-hover:opacity-100 text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-cyan-500"></div>
          <span>93% Recipient</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-blue-500"></div>
          <span>5% Creator</span>
        </div>
      </div>
    </div>
  );
}
