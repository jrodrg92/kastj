import type { JsonRpcSigner } from "ethers";
import Link from "next/link";
import { NETWORK } from "../../lib/network";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUiPreferences } from "../../hooks/useUiPreferences";
import { WalletStatus } from "../wallet/WalletStatus";
import { UiToggles } from "../../components/settings/UiToggles";
import { KastjLogo } from "../../components/brand/KastjLogo";


type Props = {
  connected: boolean;
  address?: string;
  signer: JsonRpcSigner | null;
  connect: () => void | Promise<void>;
};

export function AppHeader({
  connected,
  address,
  signer,
  connect,
}: Props) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useUiPreferences();

  return (
    <header className="w-full rounded-3xl border border-zinc-800 bg-[#080a0f]/95 px-5 py-4 shadow-2xl">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <KastjLogo />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <UiToggles />

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