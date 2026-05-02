import { FolderOpen } from "lucide-react";

type Props = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 p-16 text-center backdrop-blur-sm ${className}`}>
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
      
      {/* Subtle glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[50px]" />

      <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/[0.08] text-cyan-500 shadow-inner ring-1 ring-cyan-500/20">
          <FolderOpen size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
