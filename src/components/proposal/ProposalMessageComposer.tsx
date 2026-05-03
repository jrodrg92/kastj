"use client";

import React, { useState } from "react";
import type { ProposalMessage, ProposalMessageAuthorRole } from "@/core/proposal/proposal.messages";
import { Send, X, Reply } from "lucide-react";
import { useUi } from "@/contexts/UiContext";

interface Props {
  onSend: (body: string, parentId?: string | null) => Promise<void>;
  authorRole: ProposalMessageAuthorRole;
  isSending: boolean;
  replyingTo?: ProposalMessage | null;
  onCancelReply?: () => void;
}

export function ProposalMessageComposer({ onSend, authorRole, isSending, replyingTo, onCancelReply }: Props) {
  const [body, setBody] = useState("");
  const { t } = useUi();

  const handleSend = async () => {
    if (!body.trim() || isSending) return;
    try {
      await onSend(body, replyingTo?.id);
      setBody("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="composer-section" className="premium-glass space-y-4 rounded-[2rem] p-6 shadow-xl border-cyan-500/10 relative">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-xl bg-cyan-500/10 px-4 py-2.5 text-sm border border-cyan-500/20 mb-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500">
              <Reply className="h-3 w-3" />
            </div>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {t.replyingTo || "Replying to"} {replyingTo.authorWallet.slice(0, 6)}...{replyingTo.authorWallet.slice(-4)}
            </span>
          </div>
          <button 
            onClick={onCancelReply} 
            className="text-cyan-600/70 hover:bg-cyan-500/20 hover:text-cyan-600 p-1.5 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.commentPlaceholder || "Type your message..."}
          className="min-h-[140px] w-full rounded-2xl border border-border bg-background/50 p-5 text-sm text-foreground outline-none transition-all focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30 resize-none shadow-inner"
          maxLength={2000}
        />
        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/40 tabular-nums">
          {body.length} / 2000
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={handleSend}
          disabled={!body.trim() || isSending}
          className="premium-btn flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-sm uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSending ? t.posting : t.postMessage}
        </button>
      </div>
    </div>
  );
}
