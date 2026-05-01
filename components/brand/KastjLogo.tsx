export function KastjLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10 shadow-lg shadow-green-500/10">
        <span className="text-2xl font-black text-green-400">KTJ</span>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="hidden rounded-full bg-green-500 px-2 py-0.5 text-xs font-black text-black md:inline">
            beta
          </span>
        </div>

        <p className="mt-1 text-sm font-medium text-zinc-400">
          Conditional crowdfunding on Kaspa
        </p>
      </div>
    </div>
  );
}