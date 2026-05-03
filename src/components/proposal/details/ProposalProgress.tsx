"use client";

interface ProposalProgressProps {
  progress: number;
  contributors: number;
  t: any;
}

export function ProposalProgress({
  progress,
  contributors,
  t
}: ProposalProgressProps) {
  return (
    <div className="space-y-3">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/5">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-sm font-medium">
        <span className="text-cyan-500 font-bold">{progress.toFixed(2)}%</span>
        <span className="text-muted-foreground">
          {contributors} {contributors === 1 ? (t.contributor || "contributor") : (t.contributors || "contributors")}
        </span>
      </div>
    </div>
  );
}
