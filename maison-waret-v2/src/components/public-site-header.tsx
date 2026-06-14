import Link from "next/link";

import { MaisonWaretLogo } from "@/components/maison-waret-logo";

type PublicSiteHeaderProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export function PublicSiteHeader({
  ctaHref = "/commande",
  ctaLabel = "Commander",
}: PublicSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#ead8cc]/70 bg-[#fffaf5]/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center justify-between gap-5 px-6 lg:px-10">
        <Link href="/" className="transition hover:-translate-y-0.5">
          <MaisonWaretLogo compact />
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold text-[#6d5a50]">
          <Link href="/" className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Accueil
          </Link>
          <Link href="/catalogue" className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Catalogue
          </Link>
          <Link href="/#univers" className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            La maison
          </Link>
          <Link href="/#livraison" className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Livraison
          </Link>
          <Link href="/#processus" className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Fonctionnement
          </Link>
          <Link
            href={ctaHref}
            className="rounded-full bg-[#9d5c3f] px-5 py-2.5 text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
