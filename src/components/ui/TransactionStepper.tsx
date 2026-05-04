import React from "react";
import { Check, Loader2, Circle } from "lucide-react";
import { TransactionStep } from "@/contexts/UiContext";
import { cn } from "@/lib/utils";

interface StepItem {
  id: TransactionStep;
  label: string;
}

const STEPS: StepItem[] = [
  { id: "review", label: "Review" },
  { id: "approve", label: "Approve" },
  { id: "submit", label: "Submit" },
  { id: "pending", label: "Processing" },
  { id: "confirmed", label: "Confirmed" },
  { id: "indexed", label: "Indexed" },
  { id: "verified", label: "Verified" },
];

interface Props {
  currentStep: TransactionStep;
  status: "signing" | "processing" | "success" | "error";
  className?: string;
}

export function TransactionStepper({ currentStep, status, className }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("flex w-full items-center justify-between gap-2 px-2", className)}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex || (status === "success" && index === STEPS.length - 1);
        const isCurrent = index === currentIndex && status !== "success";
        const isFailed = index === currentIndex && status === "error";

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                  isCurrent ? "border-cyan-500 bg-cyan-500/10 text-cyan-500" :
                  isFailed ? "border-rose-500 bg-rose-500/10 text-rose-500" :
                  "border-white/10 text-white/20"
                )}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : isCurrent ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Circle size={8} fill="currentColor" className="opacity-40" />
                )}
                
                {/* Glow for current step */}
                {isCurrent && (
                   <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                isCompleted || isCurrent ? "text-white" : "text-white/20"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className="h-[2px] flex-1 bg-white/5 overflow-hidden rounded-full mb-6">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    index < currentIndex ? "w-full bg-emerald-500" : 
                    index === currentIndex && status === "processing" ? "w-1/2 bg-cyan-500 animate-pulse" :
                    "w-0"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
