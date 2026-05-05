"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Image as ImageIcon, 
  Rocket, 
  Info, 
  Calendar, 
  Target, 
  Wallet, 
  Upload,
  Type,
  Coins,
  Clock,
  Layout,
  Sparkles,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import { uploadProposalImage } from "../../lib/upload";
import { cn } from "../../lib/utils";
import { SettlementMode } from "@/core/proposal/proposal.types";
import { getProposalEngine } from "@/engines/ProposalEngineFactory";

type Props = {
  title: string;
  coverImage: string;
  description: string;
  recipient: string;
  goal: string;
  minThreshold: string;
  autoThreshold: string;
  duration: string;
  loading: boolean;
  connected: boolean;
  onTitleChange: (value: string) => void;
  onCoverImageChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onMinThresholdChange: (value: string) => void;
  onDurationChange?: (value: string) => void;
  settlementMode?: SettlementMode;
  onSettlementModeChange?: (value: SettlementMode) => void;
  onCreate: () => Promise<void>;
  descriptionPlaceholder?: string;
};

export function CreateProposalForm({
  title,
  coverImage,
  description,
  recipient,
  goal,
  minThreshold,
  autoThreshold,
  duration,
  loading,
  connected,
  onTitleChange,
  onCoverImageChange,
  onDescriptionChange,
  onRecipientChange,
  onGoalChange,
  onMinThresholdChange,
  onDurationChange,
  settlementMode = "DeadlineOnly",
  onSettlementModeChange,
  onCreate,
  descriptionPlaceholder,
}: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: Edit, 2: Preview
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    setIsUploading(true);
    try {
      const url = await uploadProposalImage(file);
      onCoverImageChange(url);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const durationOptions = [
    { label: t.hour1, value: "3600" },
    { label: t.day1, value: "86400" },
    { label: t.days7, value: "604800" },
    { label: t.days30, value: "2592000" },
    { label: t.days90, value: "7776000" },
  ];

  const validate = () => {
    if (!title.trim()) return t.titleRequired;
    if (!description.trim()) return t.descriptionRequired;
    
    const engine = getProposalEngine();
    const addressValidation = engine.validateAddress(recipient);
    if (!recipient.trim() || !addressValidation.valid) {
      return addressValidation.error || t.invalidRecipient;
    }
    
    if (!goal || Number(goal) <= 0) return t.invalidGoal;
    if (!minThreshold || Number(minThreshold) <= 0) return t.invalidThreshold;
    return null;
  };

  const handleNext = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleSubmit() {
    if (!connected) {
      toast.error(t.connectWalletFirst);
      return;
    }
    await onCreate();
  }

  return (
    <div className="w-full bg-background transition-colors duration-500">
      {/* ─── Premium Stepper ─── */}
      <div className="sticky top-0 z-30 w-full backdrop-blur-2xl border-b border-border/50 bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
          <button 
            onClick={() => setStep(1)}
            className="group flex flex-col items-center gap-2 outline-none"
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500",
              step === 1 
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                : "border-border bg-muted/30 text-muted-foreground group-hover:border-border-foreground"
            )}>
              {step === 1 ? <Layout size={20} className="animate-pulse" /> : <Check size={20} />}
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              step === 1 ? "text-cyan-500" : "text-muted-foreground"
            )}>{t.step1Edit}</span>
          </button>
          
          <div className="flex-1 px-8">
            <div className="h-[2px] w-full rounded-full bg-border overflow-hidden">
               <motion.div 
                 className="h-full bg-cyan-500"
                 animate={{ width: step === 2 ? "100%" : "0%" }}
                 transition={{ duration: 0.8, ease: "circOut" }}
               />
            </div>
          </div>

          <button 
            onClick={handleNext}
            className="group flex flex-col items-center gap-2 outline-none"
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500",
              step === 2 
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                : "border-border bg-muted/30 text-muted-foreground group-hover:border-border-foreground"
            )}>
              <Sparkles size={20} className={cn(step === 2 && "animate-pulse")} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              step === 2 ? "text-cyan-500" : "text-muted-foreground"
            )}>{t.step2Preview}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Edit ─── */}
        {step === 1 && (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 md:p-12 space-y-16"
          >
            {/* Header */}
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 border border-cyan-500/20">
                 <Rocket size={14} className="text-cyan-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Proposal Builder</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Define your <span className="text-gradient-cyan">Impact</span>
              </h2>
              <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
                Kastj proposals are smart-contracts. Fill in the details below to initialize your on-chain campaign.
              </p>
            </div>

            {/* ─── Basics Card ─── */}
            <div className="premium-glass rounded-[2rem] p-1 shadow-2xl">
              <div className="rounded-[1.9rem] p-8 md:p-10 space-y-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                    <Info size={20} />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{t.basics}</h3>
                </div>

                <div className="grid gap-10 lg:grid-cols-2">
                  <div className="space-y-3 group">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-cyan-500">
                      <Type size={14} />
                      {t.title}
                    </label>
                    <div className="relative">
                      <input
                        className="h-16 w-full rounded-2xl border border-border bg-muted/20 px-6 text-sm text-foreground font-bold outline-none transition-all focus:border-cyan-500/50 focus:bg-muted/30 focus:ring-4 focus:ring-cyan-500/10"
                        placeholder={t.ej1}
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-cyan-500">
                      <Wallet size={14} />
                      {t.walletreceiver}
                    </label>
                    <div className="relative">
                      <input
                        className="h-16 w-full rounded-2xl border border-border bg-muted/20 px-6 font-mono text-xs text-foreground outline-none transition-all focus:border-cyan-500/50 focus:bg-muted/30 focus:ring-4 focus:ring-cyan-500/10"
                        placeholder="0x..."
                        value={recipient}
                        onChange={(e) => onRecipientChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Media & Funding Grid ─── */}
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Media Section */}
              <div className="premium-glass rounded-[2rem] p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                    <ImageIcon size={20} />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{t.coverImage}</h3>
                </div>

                <div 
                  className="relative group"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "aspect-video rounded-[2rem] border-2 border-dashed transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-4 cursor-pointer",
                      coverImage ? "border-cyan-500/30 bg-muted/20" : "border-border bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/30",
                      isDragging && "border-cyan-500 bg-cyan-500/10 scale-[0.98]"
                    )}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{t.updating}</p>
                      </div>
                    ) : coverImage ? (
                      <div className="relative h-full w-full group/img">
                        <img src={coverImage} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                           <Upload className="text-white animate-bounce" size={32} />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onCoverImageChange("");
                          }}
                          className="absolute top-6 right-6 bg-rose-500 p-2.5 rounded-xl text-white hover:bg-rose-600 transition-all z-10 shadow-lg shadow-rose-500/20 active:scale-90"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "p-5 rounded-2xl transition-all duration-500",
                          isDragging ? "bg-cyan-500 text-white scale-110 shadow-2xl shadow-cyan-500/30" : "bg-muted text-muted-foreground group-hover:text-cyan-500 group-hover:scale-110"
                        )}>
                          <Upload size={32} />
                        </div>
                        <div className="text-center px-10 space-y-2">
                          <p className="text-sm font-black text-foreground">Click or drag image here</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                            JPG, PNG, WEBP — MAX 5MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  <div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted/20 p-2 border border-border group-focus-within:border-cyan-500/30 transition-all">
                    <div className="px-4 text-muted-foreground"><Layout size={16} /></div>
                    <input
                      className="h-10 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                      placeholder="...or paste an image URL here"
                      value={coverImage}
                      onChange={(e) => onCoverImageChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Funding Section */}
              <div className="premium-glass rounded-[2rem] p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                    <Coins size={20} />
                  </div>
                  <h3 className="text-xl font-black text-foreground">{t.funding}</h3>
                </div>

                <div className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-3 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground group-focus-within:text-cyan-500 transition-colors whitespace-nowrap">
                        {t.objetive} (KAS)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 text-sm text-foreground font-mono outline-none transition-all focus:border-cyan-500/50 focus:bg-muted/30"
                          value={goal}
                          onChange={(e) => onGoalChange(e.target.value)}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-cyan-500/40 tracking-widest">KAS</div>
                      </div>
                    </div>

                    <div className="space-y-3 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground group-focus-within:text-cyan-500 transition-colors whitespace-nowrap">
                        {t.timer}
                      </label>
                      <div className="relative">
                        <select
                          className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 pr-10 text-xs font-bold text-foreground outline-none transition-all focus:border-cyan-500/50 focus:bg-muted/30 appearance-none"
                          value={duration}
                          onChange={(e) => onDurationChange?.(e.target.value)}
                        >
                          {durationOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-background text-foreground">{opt.label}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Clock size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {t.minThreshold} (KAS)
                      </label>
                      <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 border border-cyan-500/20">
                         <Target size={10} className="text-cyan-500" />
                         <span className="text-[9px] font-black text-cyan-500 uppercase tracking-tighter">Safety Min: {autoThreshold}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 text-sm text-foreground font-mono outline-none transition-all focus:border-cyan-500/50 focus:bg-muted/30"
                        value={minThreshold}
                        onChange={(e) => onMinThresholdChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Settlement Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => onSettlementModeChange?.("DeadlineOnly")}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left",
                          settlementMode === "DeadlineOnly" 
                            ? "bg-cyan-500/10 border-cyan-500/50 text-foreground shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          settlementMode === "DeadlineOnly" ? "bg-cyan-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Deadline Only</p>
                          <p className="text-[9px] opacity-60">Wait until deadline ends</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSettlementModeChange?.("EarlyIfGoalReached")}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left",
                          settlementMode === "EarlyIfGoalReached" 
                            ? "bg-emerald-500/10 border-emerald-500/50 text-foreground shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          settlementMode === "EarlyIfGoalReached" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Early Settlement</p>
                          <p className="text-[9px] opacity-60">Release once goal is met</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Description Card ─── */}
            <div className="premium-glass rounded-[2.5rem] p-1 shadow-2xl">
              <div className="rounded-[2.4rem] p-8 md:p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                      <Calendar size={20} />
                    </div>
                    <h3 className="text-xl font-black text-foreground">{t.description}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Markdown Supported <Check size={12} className="text-cyan-500" />
                  </div>
                </div>
                
                <textarea
                  className="min-h-[400px] w-full resize-y rounded-2xl border border-border bg-muted/10 p-8 text-sm text-foreground outline-none transition-all focus:border-cyan-500/30 focus:bg-muted/20 leading-relaxed font-mono"
                  placeholder={descriptionPlaceholder || t.ej2}
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                />
              </div>
            </div>

            {/* Final Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-border">
              <div className="flex items-start gap-4 max-w-lg">
                <div className="mt-1 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  By clicking preview, you will verify the proposal's deterministic address. 
                  Final deployment requires a one-time transaction to the Kastj Registry.
                </p>
              </div>

              <button
                onClick={handleNext}
                className="group relative flex h-16 items-center gap-4 rounded-2xl bg-cyan-500 px-12 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-cyan-600 hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 shadow-xl"
              >
                {t.preview} 
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 2 && (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-16 lg:p-24 space-y-20 max-w-6xl mx-auto"
          >
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-4">
               <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/30" />
               <div className="flex items-center gap-3 rounded-full bg-cyan-500/10 px-6 py-2 border border-cyan-500/20">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Final Verification</span>
               </div>
               <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/30" />
            </div>

            {/* Main Preview Container */}
            <div className="space-y-16">
              {/* Visual Header */}
              <div className="space-y-10 text-center">
                {coverImage && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto aspect-[21/9] max-w-5xl overflow-hidden rounded-[3rem] border border-border shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                  >
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                  </motion.div>
                )}
                <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1]">
                  {title}
                </h1>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: t.objetive, value: `${goal} KAS`, icon: Target },
                  { label: t.minThreshold, value: `${minThreshold} KAS`, icon: Check, highlight: true },
                  { label: t.timer, value: durationOptions.find(o => o.value === duration)?.label || duration, icon: Clock },
                  { label: "Network", value: "Kaspa zkEVM", icon: Layout }
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "premium-glass rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-transform hover:scale-105",
                    item.highlight && "border-cyan-500/40 bg-cyan-500/5"
                  )}>
                    <item.icon size={20} className={cn("mb-2", item.highlight ? "text-cyan-500" : "text-muted-foreground")} />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                    <p className={cn("text-xl font-black", item.highlight ? "text-cyan-400" : "text-foreground")}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Recipient */}
              <div className="premium-glass rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.2rem] bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-inner">
                    <Wallet size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{t.walletreceiver}</p>
                    <p className="text-sm font-mono text-foreground/80 tracking-tight break-all">{recipient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 border border-border">
                   <ShieldCheck className="text-emerald-500" size={16} />
                   <span className="text-[10px] font-bold text-muted-foreground">Recipient Verified</span>
                </div>
              </div>

              {/* Rich Description */}
              <div className="prose prose-invert prose-cyan dark:prose-invert max-w-none border-t border-border pt-16">
                 <div className="flex items-center gap-4 mb-10 text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                    <div className="h-[2px] w-8 bg-cyan-500" />
                    <span>Project Narrative</span>
                 </div>
                 <div className="text-foreground/80 leading-relaxed text-lg">
                    <ReactMarkdown>{description}</ReactMarkdown>
                 </div>
              </div>

              {/* CTA Section */}
              <div className="pt-16 border-t border-border">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 premium-glass rounded-[3rem] p-12 shadow-2xl overflow-hidden relative">
                  {/* Decorative Glow */}
                  <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px]" />
                  
                  <div className="space-y-4 text-center lg:text-left z-10">
                    <h3 className="text-3xl font-black text-foreground leading-tight">Ready to launch <br/> on <span className="text-cyan-500">Kaspa?</span></h3>
                    <p className="text-muted-foreground text-sm max-w-md italic font-medium">
                      Deployment will create a unique Escrow Vault. This action is irreversible once finalized.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-8 z-10">
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !connected}
                      className="group relative flex h-20 items-center gap-6 rounded-[1.5rem] bg-cyan-500 px-16 text-xl font-black text-white transition-all hover:bg-cyan-600 hover:scale-[1.05] active:scale-95 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.4)] disabled:opacity-30 disabled:scale-100 disabled:grayscale"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Initializing...</span>
                        </>
                      ) : (
                        <>
                          <Rocket size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          <span>{t.publish}</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-black text-[11px] uppercase tracking-widest outline-none group"
                    >
                      <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> 
                      Go back to editing
                    </button>
                  </div>
                </div>
                
                {!connected && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-rose-500/10 px-6 py-3 border border-rose-500/20 text-rose-500">
                      <Wallet size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">{t.connectWalletFirst}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}