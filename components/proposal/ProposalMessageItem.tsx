"use client";

import React from "react";
import type { ProposalMessage } from "../../core/domain/ProposalMessage";
import { Trash2, Pin, PinOff, Reply } from "lucide-react";
import { useUi } from "../../contexts/UiContext";

interface Props {
  message: ProposalMessage;
  isOwnMessage: boolean;
  canPin: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onReply?: (msg: ProposalMessage) => void;
  parentMessage?: ProposalMessage | null;
}

export function ProposalMessageItem({
  message,
  isOwnMessage,
  canPin,
  onDelete,
  onTogglePin,
  onReply,
  parentMessage,
}: Props) {
  const shortWallet = (w: string) => `${w.slice(0, 6)}...${w.slice(-4)}`;
  const { t } = useUi();

  const getDeterministicGradient = (address: string) => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = Math.abs((hash * 31) % 360);
    return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 40%))`;
  };

  const roleColors: Record<string, string> = {
    creator: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    recipient: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    moderator: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    supporter: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    visitor: "bg-zinc-500/5 text-zinc-500 dark:bg-zinc-800/30 dark:text-zinc-500 border-zinc-500/10 dark:border-zinc-700/30",
  };

  const roleLabels: Record<string, string> = {
    creator: t.creatorBadge,
    recipient: t.recipientBadge,
    moderator: t.moderatorBadge,
    supporter: t.supporterBadge,
    visitor: t.visitorBadge,
  };

  const typeLabels: Record<string, string> = {
    update: `📢 ${t.update}`,
    answer: `✅ ${t.answer}`,
    question: `❓ ${t.question}`,
    comment: `💬 ${t.comment}`,
  };

  if (message.isDeleted) {
    return (
      <div className="premium-glass rounded-2xl p-4 opacity-50 grayscale italic text-sm text-muted-foreground">
        {t.deletedMessage}
      </div>
    );
  }

  return (
    <div className={`premium-glass relative group rounded-2xl p-5 transition-all hover:border-cyan-500/30 ${message.isPinned ? 'border-cyan-500/40 bg-cyan-500/[0.03]' : ''}`}>
      {message.isPinned && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg z-10">
          <Pin className="h-3 w-3" />
        </div>
      )}

      {parentMessage && (
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground/70 bg-background/50 rounded-lg px-3 py-2 border border-border/50 w-fit">
          <Reply className="h-3 w-3" />
          Replying to {shortWallet(parentMessage.authorWallet)}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div 
            className="h-8 w-8 rounded-full border border-white/10 shadow-sm shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase"
            style={{ background: getDeterministicGradient(message.authorWallet) }}
          >
            {message.authorWallet.slice(2, 4)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {shortWallet(message.authorWallet)}
              </span>
              <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleColors[message.authorRole] || roleColors.visitor}`}>
                {roleLabels[message.authorRole] || roleLabels.visitor}
              </span>
            </div>
            {message.type !== 'comment' && (
              <span className="text-[10px] font-bold text-muted-foreground/70">
                {typeLabels[message.type]}
              </span>
            )}
          </div>
        </div>
        <time className="text-[10px] font-medium text-muted-foreground/40 uppercase whitespace-nowrap">
          {new Date(message.createdAt).toLocaleString()}
        </time>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {message.body}
      </p>

      <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600/70 dark:text-cyan-500/70 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        )}
        {isOwnMessage && (
          <button
            onClick={() => onDelete(message.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600/70 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.delete}
          </button>
        )}
        {canPin && (
          <button
            onClick={() => onTogglePin(message.id, !message.isPinned)}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600/70 dark:text-cyan-500/70 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {message.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {message.isPinned ? t.unpin : t.pin}
          </button>
        )}
      </div>
    </div>
  );
}
