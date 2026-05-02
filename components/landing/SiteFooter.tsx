import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center md:flex-row md:justify-between md:text-left">
        {/* Brand */}
        <div>
          <p className="text-sm font-bold text-foreground">KASTJ</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.appTagline}
          </p>
        </div>

        {/* Links */}
        <nav className="flex gap-6 text-xs text-muted-foreground">
          <Link href="/proposals" className="transition-colors hover:text-foreground">
            {t.proposals}
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
            {t.howItWorks}
          </Link>
          <a
            href="https://kaspa.org"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {t.community}
          </a>
        </nav>

        {/* Closing line */}
        <p className="text-[11px] text-muted-foreground/50">
          {t.builtFor}
        </p>
      </div>
    </footer>
  );
}
