import React from "react";

export function ProposalSkeleton() {
  return (
    <div className="premium-glass relative flex flex-col rounded-3xl p-7 animate-shimmer">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-3/4 rounded-lg bg-muted"></div>
          <div className="h-3 w-1/4 rounded-lg bg-muted/50"></div>
        </div>
        <div className="h-6 w-16 rounded-full bg-muted/50"></div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded-lg bg-muted/30"></div>
        <div className="h-4 w-5/6 rounded-lg bg-muted/30"></div>
      </div>

      <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-background/50 p-4 md:grid-cols-2">
        <div className="h-4 w-24 rounded bg-muted/20"></div>
        <div className="h-4 w-24 rounded bg-muted/20"></div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-muted/30"></div>
          <div className="h-3 w-10 rounded bg-muted/30"></div>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary"></div>
      </div>

      <div className="mt-8 flex gap-3">
        <div className="h-10 w-28 rounded-xl bg-muted/40"></div>
        <div className="h-10 w-32 rounded-xl bg-muted/40"></div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="premium-glass rounded-2xl p-5 animate-shimmer">
          <div className="h-3 w-16 rounded bg-muted/50 mb-3"></div>
          <div className="h-8 w-24 rounded bg-muted"></div>
        </div>
      ))}
    </section>
  );
}
