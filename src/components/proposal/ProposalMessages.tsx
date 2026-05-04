"use client";

import React, { useMemo, useOptimistic, useTransition, useState } from "react";
import { useProposalMessages, useCreateProposalMessage, useSoftDeleteMessage, useTogglePinMessage } from "@/features/proposal-messages/hooks";
import { ProposalMessageComposer } from "./ProposalMessageComposer";
import { ProposalMessageItem } from "./ProposalMessageItem";
import { MessageSquare, MessageSquareOff } from "lucide-react";
import { useUi } from "@/contexts/UiContext";
import type { ProposalMessage, ProposalMessageAuthorRole, ProposalMessageType } from "@/core/proposal/proposal.messages";

interface Props {
  proposalId: string | number;
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
  const id = String(proposalId);
  const { data: messages = [], isLoading } = useProposalMessages(id);
  const createMutation = useCreateProposalMessage(id);
  const deleteMutation = useSoftDeleteMessage(id);
  const pinMutation = useTogglePinMessage(id);

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<ProposalMessage[], ProposalMessage>(
    messages,
    (state, newMessage) => [...state, newMessage]
  );

  const [isTransitioning, startTransition] = useTransition();
  const [replyingTo, setReplyingTo] = useState<ProposalMessage | null>(null);

  const currentAuthorRole = useMemo(() => {
    if (!currentWallet) return "visitor";
    const wallet = currentWallet.toLowerCase();
    if (wallet === creatorWallet.toLowerCase()) return "creator";
    if (wallet === recipientWallet.toLowerCase()) return "recipient";
    return "supporter";
  }, [currentWallet, creatorWallet, recipientWallet]) as ProposalMessageAuthorRole;

  const canPin = currentAuthorRole === "creator" || currentAuthorRole === "moderator";

  const handleSend = async (body: string, parentId?: string | null) => {
    if (!currentWallet) return;

    const newMessage: ProposalMessage = {
      id: `temp-${Date.now()}`,
      proposalId: id,
      parentId: parentId || null,
      authorWallet: currentWallet,
      authorRole: currentAuthorRole,
      type: "comment",
      body,
      bodyHash: "",
      isDeleted: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    startTransition(async () => {
      addOptimisticMessage(newMessage);
      try {
        await createMutation.mutateAsync({
          authorWallet: currentWallet,
          authorRole: currentAuthorRole,
          type: "comment",
          body,
          parentId,
        });
        setReplyingTo(null);
      } catch (e) {
        console.error("Failed to send message", e);
      }
    });
  };

  const handleDelete = async (messageId: string) => {
    if (!currentWallet) return;
    await deleteMutation.mutateAsync({ messageId, authorWallet: currentWallet });
  };

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    await pinMutation.mutateAsync({ messageId, isPinned });
  };

  const { t } = useUi();

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <MessageSquare size={20} />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t.messages || "Messages"}</h2>
        </div>
        
        <div className="rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-500 border border-cyan-500/20">
          {optimisticMessages.length} {optimisticMessages.length === 1 ? t.messageLabel : t.messagesLabel}
        </div>
      </div>

      <div className="space-y-4">
        {optimisticMessages.length > 0 ? (
          optimisticMessages.map((msg) => {
            const parentMsg = msg.parentId ? optimisticMessages.find(m => m.id === msg.parentId) : null;
            return (
              <ProposalMessageItem
                key={msg.id}
                message={msg}
                parentMessage={parentMsg}
                isOwnMessage={!!currentWallet && msg.authorWallet.toLowerCase() === currentWallet.toLowerCase()}
                canPin={canPin}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onReply={currentWallet ? (m) => {
                  setReplyingTo(m);
                  document.getElementById('composer-section')?.scrollIntoView({ behavior: 'smooth' });
                } : undefined}
              />
            );
          })
        ) : !isLoading ? (
          <div className="premium-glass rounded-[2rem] p-12 text-center border-cyan-500/20 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.01]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-cyan-500/10 text-cyan-500 shadow-[0_8px_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{t.firstWord}</h3>
            <p className="mx-auto mt-3 max-w-[320px] text-sm font-medium text-muted-foreground/70 leading-relaxed">
              {t.pioneerDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-glass h-32 rounded-2xl animate-pulse bg-muted/30" />
            ))}
          </div>
        )}
      </div>

      {currentWallet ? (
        <ProposalMessageComposer
          onSend={handleSend}
          authorRole={currentAuthorRole}
          isSending={createMutation.isPending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      ) : (
        <div className="premium-glass rounded-[2rem] p-10 text-center border-dashed border-border shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
            <MessageSquareOff className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">{t.joinDiscussion}</h3>
          <p className="text-sm font-medium text-muted-foreground mt-3 max-w-[300px] mx-auto">{t.joinDiscussionDesc}</p>
        </div>
      )}
    </section>
  );
}
