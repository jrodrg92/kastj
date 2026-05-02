import type { JsonRpcSigner } from "ethers";
import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUiPreferences } from "../../hooks/useUiPreferences";
import { WalletStatus } from "../wallet/WalletStatus";
import { UiToggles } from "../../components/settings/UiToggles";
import { KastjLogo } from "../../components/brand/KastjLogo";


import { useWalletContext } from "../../contexts/WalletContext";

export function AppHeader() {
  const { connected, address, signer, connect } = useWalletContext();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useUiPreferences();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 px-6 py-4 backdrop-blur-xl transition-all">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <KastjLogo />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <UiToggles />

            {connected && (
              <Link
                href="/profile"
                className="flex h-9 items-center gap-2 rounded-full border border-border bg-card/50 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] text-black">
                  👤
                </div>
                Profile
              </Link>
            )}

            <WalletStatus
              connected={connected}
              address={address ?? ""}
              signer={signer}
              connect={connect}
            />
        </div>
      </div>
    </header>
    
  );
}