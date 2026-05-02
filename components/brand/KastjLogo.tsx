export function KastjLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center">
        <img
          src="/kastj_logo_vector.svg"
          alt="KASTJ Logo"
          className="h-12 w-12"
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground">
            KASTJ
          </span>

          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            beta
          </span>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Conditional crowdfunding on Kaspa
        </p>
      </div>
    </div>
  );
}