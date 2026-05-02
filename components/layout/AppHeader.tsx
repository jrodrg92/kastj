import type { JsonRpcSigner } from "ethers";
import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { useUi } from "../../contexts/UiContext";
import { WalletStatus } from "../wallet/WalletStatus";
import { UiToggles } from "../../components/settings/UiToggles";
import { KastjLogo } from "../../components/brand/KastjLogo";


import { useWalletContext } from "../../contexts/WalletContext";

export function AppHeader() {
  const { connected, address, signer, connect } = useWalletContext();
  const { t } = useUi();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 px-6 py-4 backdrop-blur-xl transition-all">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-4 transition-opacity hover:opacity-80">
          <KastjLogo />
        </Link>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <UiToggles />

          {connected && (
            <Link
              href="/profile"
              className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-4 text-sm font-bold text-foreground transition-all hover:bg-accent hover:shadow-sm active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] text-white">
                👤
              </div>
              {t.profile}
            </Link>
          )}

          <WalletStatus />
        </div>
      </div>
    </header>

  );
}