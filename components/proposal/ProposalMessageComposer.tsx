"use client";

import React, { useState } from "react";
import type { ProposalMessageAuthorRole, ProposalMessageType } from "../../core/domain/ProposalMessage";
import { Send, Info, ChevronDown, Check } from "lucide-react";
import { useUi } from "../../contexts/UiContext";

interface Props {
  onSend: (body: string, type: ProposalMessageType) => Promise<void>;
  authorRole: ProposalMessageAuthorRole;
  isSending: boolean;
}

export function ProposalMessageComposer({ onSend, authorRole, isSending }: Props) {
  const [body, setBody] = useState("");
  const [type, setType] = useState<ProposalMessageType>("comment");

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const { t } = useUi();

  const canPostSpecial = authorRole === "creator" || authorRole === "moderator";

  const options: { value: ProposalMessageType; label: string; icon: string }[] = [
    { value: "comment", label: t.comment, icon: "💬" },
    { value: "question", label: t.question, icon: "❓" },
    ...(canPostSpecial
      ? [
          { value: "answer" as const, label: t.answer, icon: "✅" },
          { value: "update" as const, label: t.update, icon: "📢" },
        ]
      : []),
  ];

  const activeOption = options.find((o) => o.value === type) || options[0];

  const handleSend = async () => {
    if (!body.trim() || isSending) return;
    try {
      await onSend(body, type);
      setBody("");
      setType("comment");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="premium-glass space-y-4 rounded-[2rem] p-6 shadow-xl border-emerald-500/10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            {t.postAs}
          </label>
          
          <div className="relative">
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className="flex h-10 items-center gap-3 rounded-xl border border-border bg-background/50 px-4 text-xs font-bold text-foreground transition-all hover:bg-background active:scale-95 shadow-sm"
            >
              <span>{activeOption.icon}</span>
              {activeOption.label}
              <ChevronDown className={`h-3 w-3 text-emerald-500 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setIsTypeOpen(false)} />
                <div className="absolute left-0 top-full z-[100] mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setType(opt.value);
                        setIsTypeOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-bold transition-all ${
                        type === opt.value
                           ? "bg-emerald-500 text-white"
                          : "text-foreground/70 hover:bg-accent hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                      {type === opt.value && <Check className="ml-auto h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {type === 'update' && (
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
            <Info className="h-3.5 w-3.5" />
            {t.officialUpdate}
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={type === 'update' ? t.updatePlaceholder : t.commentPlaceholder}
          className="min-h-[140px] w-full rounded-2xl border border-border bg-background/50 p-5 text-sm text-foreground outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30 resize-none shadow-inner"
          maxLength={2000}
        />
        <div className="absolute bottom-4 right-4 text-[10px] font-black text-muted-foreground/40 tabular-nums">
          {body.length} / 2000
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={!body.trim() || isSending}
          className="premium-btn flex items-center gap-2 rounded-full px-8 py-3.5 font-black text-sm uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
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
