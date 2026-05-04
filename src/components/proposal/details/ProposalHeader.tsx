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
  explorerUrl: string;
  t: any;
}

export function ProposalHeader({ 
  title, 
  creator, 
  status, 
  explorerUrl,
  t 
}: ProposalHeaderProps) {
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
              By{" "}
              <a 
                href={`${explorerUrl}/address/${creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-foreground transition-colors hover:text-cyan-500"
              >
                {creator.slice(0, 6)}...{creator.slice(-4)}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-foreground leading-none md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <button
              onClick={copyLink}
              className="group flex shrink-0 translate-y-[6px] items-center justify-center p-2 text-cyan-500 transition-all hover:scale-110 active:scale-95 md:translate-y-[8px]"
              title={t.share || "Share"}
            >
              {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} className="transition-transform group-hover:rotate-12" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
