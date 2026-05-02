"use client";

import React, { useMemo } from "react";
import { useProposalMessages, useCreateProposalMessage, useSoftDeleteMessage, useTogglePinMessage } from "../../features/proposal-messages/hooks";
import { ProposalMessageComposer } from "./ProposalMessageComposer";
import { ProposalMessageItem } from "./ProposalMessageItem";
import { MessageSquare, MessageSquareOff } from "lucide-react";
import type { ProposalMessageAuthorRole, ProposalMessageType } from "../../core/domain/ProposalMessage";

interface Props {
  proposalId: string;
  currentWallet?: string | null;
  creatorWallet: string;
  recipientWallet: string;
}

export function ProposalMessages({
  proposalId,
  currentWallet,
  creatorWallet,
  recipientWallet,
}: Props) {
  const { data: messages = [], isLoading } = useProposalMessages(proposalId);
  const createMutation = useCreateProposalMessage(proposalId);
  const deleteMutation = useSoftDeleteMessage(proposalId);
  const pinMutation = useTogglePinMessage(proposalId);

  const currentAuthorRole = useMemo(() => {
    if (!currentWallet) return "visitor";
    const wallet = currentWallet.toLowerCase();
    if (wallet === creatorWallet.toLowerCase()) return "creator";
    if (wallet === recipientWallet.toLowerCase()) return "recipient";
    return "supporter";
  }, [currentWallet, creatorWallet, recipientWallet]);

  const canPin = currentAuthorRole === "creator" || currentAuthorRole === "moderator";

  const handleSend = async (body: string, type: ProposalMessageType) => {
    if (!currentWallet) return;
    await createMutation.mutateAsync({
      authorWallet: currentWallet,
      authorRole: currentAuthorRole,
      type,
      body,
    });
  };

  const handleDelete = async (messageId: string) => {
    if (!currentWallet) return;
    await deleteMutation.mutateAsync({ messageId, authorWallet: currentWallet });
  };

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    await pinMutation.mutateAsync({ messageId, isPinned });
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-emerald-500" />
            Discussion
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            Connect with the community and stay updated on the progress.
          </p>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-500 border border-emerald-500/20">
          {messages.length} Messages
        </div>
      </div>

      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <ProposalMessageItem
              key={msg.id}
              message={msg}
              isOwnMessage={!!currentWallet && msg.authorWallet.toLowerCase() === currentWallet.toLowerCase()}
              canPin={canPin}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))
        ) : !isLoading ? (
          <div className="premium-glass rounded-[2rem] p-12 text-center border-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">First Word?</h3>
            <p className="mx-auto mt-3 max-w-[320px] text-sm font-medium text-muted-foreground/70 leading-relaxed">
              This proposal doesn't have any messages yet. Be the pioneer and start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-glass h-32 rounded-2xl animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        )}
      </div>

      {currentWallet ? (
        <ProposalMessageComposer
          onSend={handleSend}
          authorRole={currentAuthorRole}
          isSending={createMutation.isPending}
        />
      ) : (
        <div className="premium-glass rounded-[2rem] p-10 text-center border-dashed border-border shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
            <MessageSquareOff className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Join the Discussion</h3>
          <p className="text-sm font-medium text-muted-foreground mt-3 max-w-[300px] mx-auto">Connect your wallet to share your thoughts or ask questions about this proposal.</p>
        </div>
      )}
    </section>
  );
}
