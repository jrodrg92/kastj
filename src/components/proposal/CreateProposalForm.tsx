import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, ArrowRight, Check, Image as ImageIcon, Eye, Rocket, Info, Calendar, Target, Wallet, Upload } from "lucide-react";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";
import { ScrollReveal } from "../ui/ScrollReveal";
import ReactMarkdown from "react-markdown";
import { uploadProposalImage } from "../../lib/upload";

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
  onCreate: () => Promise<void>;
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
  onCreate,
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
    if (!recipient.trim() || !recipient.startsWith("0x")) return t.invalidRecipient;
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
    <div className="w-full">
      {/* ─── Stepper ─── */}
      <div className="flex items-center justify-center gap-8 py-8 border-b border-white/[0.05] bg-white/[0.02]">
        <button 
          onClick={() => setStep(1)}
          className={`flex items-center gap-3 transition-colors ${step === 1 ? "text-cyan-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-white/5 border border-white/10"}`}>
            1
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">{t.step1Edit}</span>
        </button>
        
        <div className="h-[1px] w-12 bg-white/10" />

        <button 
          onClick={handleNext}
          className={`flex items-center gap-3 transition-colors ${step === 2 ? "text-cyan-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-white/5 border border-white/10"}`}>
            2
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">{t.step2Preview}</span>
        </button>
      </div>

      {/* ─── Step 1: Edit ─── */}
      {step === 1 && (
        <div className="p-6 md:p-10 space-y-12 animate-in fade-in duration-500">
          {/* Basics Section (Now at the top, full width) */}
          <section className="space-y-6 pb-8 border-b border-white/5">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info size={20} className="text-cyan-500" />
              {t.basics}
            </h3>
            
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Rocket size={14} className="text-cyan-500/60" />
                  {t.title}
                </label>
                <input
                  className="h-14 w-full rounded-xl border border-white/10 bg-background/50 p-4 text-sm text-white font-bold outline-none transition-all focus:border-cyan-500/40"
                  placeholder={t.ej1}
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Wallet size={14} className="text-cyan-500/60" />
                  {t.walletreceiver}
                </label>
                <input
                  className="h-14 w-full rounded-xl border border-white/10 bg-background/50 p-4 font-mono text-xs text-white outline-none transition-all focus:border-cyan-500/40"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => onRecipientChange(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column: Media */}
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-cyan-500" />
                  {t.coverImage}
                </h3>
                <div 
                  className="relative group"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-video rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      coverImage ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    } ${isDragging ? "border-cyan-500 bg-cyan-500/10" : ""}`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                        <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{t.updating}</p>
                      </div>
                    ) : coverImage ? (
                      <>
                        <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Upload className="text-white" size={32} />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onCoverImageChange("");
                          }}
                          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-rose-500 transition-colors z-10"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`p-4 rounded-2xl transition-colors ${isDragging ? "bg-cyan-500/20 text-cyan-500" : "bg-white/5 text-muted-foreground group-hover:text-cyan-500"}`}>
                          <Upload size={32} />
                        </div>
                        <div className="text-center px-6">
                          <p className="text-sm font-bold text-foreground mb-1">Click or drag image here</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Supports JPG, PNG, WEBP (Max 5MB)
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

                  <input
                    className="mt-4 w-full rounded-xl border border-white/10 bg-background/50 p-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-cyan-500/40"
                    placeholder="...or paste an image URL here"
                    value={coverImage}
                    onChange={(e) => onCoverImageChange(e.target.value)}
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Funding */}
            <div className="space-y-8">
              <section className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target size={20} className="text-cyan-500" />
                  {t.funding}
                </h3>
                
                <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="mb-2 block min-h-[32px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.objetive} ({NETWORK.currency})
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        className="h-14 w-full rounded-xl border border-white/10 bg-background/50 p-4 text-sm text-white font-mono outline-none transition-all focus:border-cyan-500/40"
                        value={goal}
                        onChange={(e) => onGoalChange(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-500/50">KAS</div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 block min-h-[32px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.timer}
                    </label>
                    <div className="flex-1">
                      <select
                        className="h-14 w-full rounded-xl border border-white/10 bg-background/50 p-4 text-sm text-white outline-none transition-all focus:border-cyan-500/40 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat"
                        value={duration}
                        onChange={(e) => onDurationChange?.(e.target.value)}
                      >
                        {durationOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.minThreshold} ({NETWORK.currency})
                    </label>
                    <span className="text-[10px] text-cyan-500 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      Min: {autoThreshold}
                    </span>
                  </div>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-background/50 p-4 text-sm text-white font-mono outline-none transition-all focus:border-cyan-500/40"
                    value={minThreshold}
                    onChange={(e) => onMinThresholdChange(e.target.value)}
                  />
                  <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed italic">
                    If this amount is not reached by the deadline, contributors can claim a refund.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Full Width: Description */}
          <section className="pt-6 border-t border-white/5">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-cyan-500" />
              {t.description}
            </h3>
            <textarea
              className="min-h-[400px] w-full resize-y rounded-2xl border border-white/10 bg-background/50 p-6 text-sm text-foreground outline-none transition-all focus:border-cyan-500/40 leading-relaxed font-mono"
              placeholder={t.ej2}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </section>

          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-muted-foreground max-w-md italic">
              All information will be permanently recorded on the blockchain. Ensure accuracy before continuing.
            </p>
            <button
              onClick={handleNext}
              className="group flex items-center gap-3 rounded-2xl bg-cyan-500 px-10 py-4 text-sm font-black text-white transition-all hover:bg-cyan-600 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] shadow-lg"
            >
              {t.preview} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Preview ─── */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Status Bar */}
          <div className="bg-cyan-500/10 border-y border-cyan-500/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">{t.readyToPublish}</span>
            </div>
            <span className="text-[10px] text-cyan-500/60 font-mono">ID: DRAFT-{Date.now().toString().slice(-6)}</span>
          </div>

          <div className="p-8 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-12">
            {/* Header Preview */}
            <div className="space-y-6 text-center">
              {coverImage && (
                <div className="aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 mb-10">
                  <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">{title}</h1>
            </div>

            {/* Meta Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.objetive}</p>
                <p className="text-lg font-black text-white">{goal} KAS</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.minThreshold}</p>
                <p className="text-lg font-black text-cyan-400">{minThreshold} KAS</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.timer}</p>
                <p className="text-lg font-black text-white">
                  {durationOptions.find(o => o.value === duration)?.label || duration}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <p className="text-lg font-black text-cyan-500">{t.draft}</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.walletreceiver}</p>
                  <p className="text-xs font-mono text-white/80 mt-0.5 break-all">{recipient}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-cyan max-w-none border-t border-white/5 pt-12">
               <ReactMarkdown>{description}</ReactMarkdown>
            </div>

            {/* Actions */}
            <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex items-center gap-3 text-muted-foreground hover:text-white transition-colors font-bold text-sm"
              >
                <ArrowLeft size={18} /> {t.step1Edit}
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !connected}
                className="group relative flex items-center gap-4 rounded-full bg-cyan-500 px-12 py-5 text-lg font-black text-white transition-all hover:bg-cyan-600 hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Rocket size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    {t.publish}
                  </>
                )}
              </button>
            </div>

            {!connected && (
              <p className="text-center text-sm text-rose-400 font-medium">
                {t.connectWalletFirst}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}