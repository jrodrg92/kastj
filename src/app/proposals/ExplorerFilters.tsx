"use client";

import { Search, Coins, RefreshCw } from "lucide-react";
import { SortDropdown } from "@/components/ui/SortDropdown";
import { NETWORK } from "@/lib/network";

interface Props {
  filter: string;
  setFilter: (f: any) => void;
  search: string;
  setSearch: (s: string) => void;
  sort: string;
  setSort: (s: any) => void;
  fundAmount: string;
  setFundAmount: (a: string) => void;
  isFetching: boolean;
  onRefresh: () => void;
  t: any;
}

export function ExplorerFilters({
  filter,
  setFilter,
  search,
  setSearch,
  sort,
  setSort,
  fundAmount,
  setFundAmount,
  isFetching,
  onRefresh,
  t
}: Props) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {[
          { key: "all", label: t.all },
          { key: "active", label: t.active },
          { key: "mine", label: t.mine },
          { key: "supported", label: t.sup },
          { key: "succeeded", label: t.succeeded },
          { key: "failed", label: t.failed },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${filter === item.key
              ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="premium-glass flex flex-col gap-4 rounded-[2rem] p-4 md:flex-row md:items-center border-white/[0.04] bg-background/20 backdrop-blur-xl">
        <div className="group relative flex-1">
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 pl-12 text-sm text-foreground outline-none transition-all focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-cyan-500" size={20} />
        </div>

        <div className="flex flex-wrap gap-3">
          <SortDropdown
            value={sort}
            onChange={setSort}
            labels={{ newest: t.newest, raised: t.moreRe, ending: t.endSoon }}
          />

          <div className="group relative md:w-44">
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-cyan-500" size={18} />
            <input
              className="h-14 w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 pl-11 pr-12 text-sm font-bold text-foreground outline-none transition-all focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
              placeholder={t.minAmount}
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40">{NETWORK.currency}</div>
          </div>

          <button
            onClick={onRefresh}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] text-muted-foreground transition-all hover:bg-white/[0.05] hover:text-cyan-500 active:rotate-180 duration-500"
          >
            <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </section>
  );
}
