"use client";

import { FileSearch } from "lucide-react";

interface ProposalDescriptionProps {
  description: string;
  t: any;
}

export function ProposalDescription({ description, t }: ProposalDescriptionProps) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <FileSearch size={20} />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t.aboutProject || "About this project"}</h2>
      </div>
      
      <div className="premium-glass rounded-3xl border-border/50 p-8 text-lg leading-relaxed text-muted-foreground shadow-xl">
        <p className="whitespace-pre-wrap">{description}</p>
        
        {!description && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-muted p-4 text-muted-foreground/30">
              <FileSearch className="h-full w-full" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground italic">
              {t.noDescriptionProvided || "No detailed description was provided for this proposal."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
