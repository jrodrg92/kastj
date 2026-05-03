"use client";

import { History, FileText, FileSearch } from "lucide-react";
import { formatUnits } from "@/lib/currencyUtils";
import { ProposalMessages } from "@/components/proposal/ProposalMessages";

interface ProposalActivityFeedProps {
  proposalId: number;
  activity: any[];
  fundings: any[];
  currentWallet?: string | null;
  creatorWallet: string;
  recipientWallet: string;
  t: any;
}

function activityIcon(type: string) {
  if (type === "created") return "🆕";
  if (type === "funded") return "💸";
  if (type === "succeeded") return "✅";
  if (type === "failed") return "❌";
  return "•";
}

export function ProposalActivityFeed({ 
  proposalId, 
  activity, 
  fundings, 
  currentWallet,
  creatorWallet,
  recipientWallet,
  t 
}: ProposalActivityFeedProps) {
  return (
    <div className="space-y-12">
      {/* Activity Timeline */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <History size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">{t.recentActivity || "Recent Activity"}</h2>
        </div>

        <div className="space-y-4">
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-muted-foreground">{t.noActivityYet || "No activity recorded yet"}</p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-white/5">
              {activity.slice(0, 10).map((item, idx) => (
                <div key={item.id || idx} className="relative pl-10">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0f172a] text-xs shadow-[0_0_0_4px_rgba(15,23,42,1)]">
                    {activityIcon(item.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-white">
                      {item.message || (item.type === "funded" ? `Support of ${formatUnits(item.amount, 18)} KAS` : item.type)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.actor ? `${item.actor.slice(0, 6)}...${item.actor.slice(-4)}` : "System"}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Messages / Comments */}
      <section>
        <ProposalMessages 
          proposalId={proposalId} 
          currentWallet={currentWallet}
          creatorWallet={creatorWallet}
          recipientWallet={recipientWallet}
        />
      </section>
    </div>
  );
}
