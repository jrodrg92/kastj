"use client";

import { ArrowLeft, Share2, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { statusLabel } from "@/lib/proposalUtils";

interface ProposalHeaderProps {
  title: string;
  creator: string;
  status: string | number;
  t: any;
}

export function ProposalHeader({ title, creator, status, t }: ProposalHeaderProps) {
  const [copied, setCopied] = useState(false);

  const isActive = status === "active" || status === 0;
  const isSucceeded = status === "succeeded" || status === 1;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success(t.linkCopied || "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive ? "bg-cyan-500/10 text-cyan-500" : 
              isSucceeded ? "bg-green-500/10 text-green-500" : 
              "bg-red-500/10 text-red-500"
            }`}>
              {statusLabel(status, t)}
            </span>
            <span className="text-xs text-muted-foreground">
              By <span className="font-mono text-foreground">{creator.slice(0, 6)}...{creator.slice(-4)}</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <button
              onClick={copyLink}
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition-all hover:bg-cyan-500/10 hover:text-cyan-500 md:h-12 md:w-12"
              title={t.share || "Share"}
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="transition-transform group-hover:scale-110" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
