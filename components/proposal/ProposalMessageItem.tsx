"use client";

import React from "react";
import type { ProposalMessage } from "../../core/domain/ProposalMessage";
import { Trash2, Pin, PinOff } from "lucide-react";

interface Props {
  message: ProposalMessage;
  isOwnMessage: boolean;
  canPin: boolean;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export function ProposalMessageItem({
  message,
  isOwnMessage,
  canPin,
  onDelete,
  onTogglePin,
}: Props) {
  const shortWallet = (w: string) => `${w.slice(0, 6)}...${w.slice(-4)}`;

  const roleColors: Record<string, string> = {
    creator: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    recipient: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    moderator: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    supporter: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    visitor: "bg-zinc-500/5 text-zinc-500 dark:bg-zinc-800/30 dark:text-zinc-500 border-zinc-500/10 dark:border-zinc-700/30",
  };

  const typeLabels: Record<string, string> = {
    update: "📢 Update",
    answer: "✅ Answer",
    question: "❓ Question",
    comment: "💬 Comment",
  };

  if (message.isDeleted) {
    return (
      <div className="premium-glass rounded-2xl p-4 opacity-50 grayscale italic text-sm text-muted-foreground">
        This message was deleted by the author.
      </div>
    );
  }

  return (
    <div className={`premium-glass relative group rounded-2xl p-5 transition-all hover:border-emerald-500/30 ${message.isPinned ? 'border-emerald-500/40 bg-emerald-500/[0.03]' : ''}`}>
      {message.isPinned && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Pin className="h-3 w-3" />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-foreground">
            {shortWallet(message.authorWallet)}
          </span>
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${roleColors[message.authorRole] || roleColors.visitor}`}>
            {message.authorRole}
          </span>
          {message.type !== 'comment' && (
            <span className="text-[11px] font-bold text-muted-foreground">
              {typeLabels[message.type]}
            </span>
          )}
        </div>
        <time className="text-[10px] font-medium text-muted-foreground/60 uppercase">
          {new Date(message.createdAt).toLocaleString()}
        </time>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {message.body}
      </p>

      <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {isOwnMessage && (
          <button
            onClick={() => onDelete(message.id)}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600/70 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
        {canPin && (
          <button
            onClick={() => onTogglePin(message.id, !message.isPinned)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {message.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {message.isPinned ? 'Unpin' : 'Pin'}
          </button>
        )}
      </div>
    </div>
  );
}
