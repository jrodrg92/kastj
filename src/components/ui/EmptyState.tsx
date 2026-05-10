import { FolderOpen } from "lucide-react";

type Props = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className = "" }: Props) {
  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] border border-white/[0.05] bg-gradient-to-b from-card/60 to-card/20 p-20 text-center backdrop-blur-xl ${className}`}>
      {/* Dynamic Background Effects */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[100px] transition-all duration-700 group-hover:bg-cyan-500/10 group-hover:scale-125" />
      
      <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
        <div className="relative mb-8">
           <div className="absolute inset-0 animate-ping rounded-2xl bg-cyan-500/20 opacity-20" />
           <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent text-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] ring-1 ring-cyan-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
             <FolderOpen size={32} strokeWidth={1} />
           </div>
        </div>
        
        <h3 className="text-2xl font-black tracking-tighter text-foreground group-hover:text-cyan-400 transition-colors duration-500">{title}</h3>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/60">
          {description}
        </p>
        
        {/* Subtle decorative elements */}
        <div className="mt-10 flex gap-2">
           <div className="h-1 w-8 rounded-full bg-cyan-500/20" />
           <div className="h-1 w-12 rounded-full bg-cyan-500/40" />
           <div className="h-1 w-8 rounded-full bg-cyan-500/20" />
        </div>
      </div>
    </div>
  );
}
