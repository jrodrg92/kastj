export function KastjLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-[0_0_20px_rgba(34,197,94,0.08)]">        <img
          src="/kastj-logo.svg"
          alt="KASTJ Logo"
          className="h-8 w-8 opacity-80"
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            KASTJ
          </span>

          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">
            beta
          </span>
        </div>

        <p className="mt-1 text-sm text-zinc-400">
          Conditional crowdfunding on Kaspa
        </p>
      </div>
    </div>
  );
}