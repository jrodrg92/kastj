import React from "react";
import { InfoTooltip } from "./InfoTooltip";

export function FeeSplit() {
  return (
    <div className="group relative w-full pt-2">
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
        <span>Distribución</span>
        <InfoTooltip content="Recurso compartido: 93% Beneficiario, 5% Creador, 2% Plataforma." />
      </div>
      
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary/30 ring-1 ring-inset ring-black/5 dark:ring-white/5">
        {/* Recipient - 93% */}
        <div 
          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
          style={{ width: "93%" }}
          title="Beneficiario: 93%"
        ></div>
        {/* Creator - 5% */}
        <div 
          className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
          style={{ width: "5%" }}
          title="Creador: 5%"
        ></div>
        {/* Platform - 2% */}
        <div 
          className="h-full bg-zinc-500" 
          style={{ width: "2%" }}
          title="Plataforma: 2%"
        ></div>
      </div>

      {/* Legend on Hover */}
      <div className="mt-2 flex gap-4 text-[9px] font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
          <span>93% Beneficiario</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
          <span>5% Creador</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-500"></div>
          <span>2% Fees</span>
        </div>
      </div>
    </div>
  );
}
