import Link from "next/link";

type PublicSiteHeaderProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export function PublicSiteHeader({
  ctaHref = "/commande",
  ctaLabel = "Commander",
}: PublicSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#ead8cc]/80 bg-[#fffaf5]/92 backdrop-blur">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center justify-between gap-5 px-6 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-3 transition hover:-translate-y-0.5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#c98f6c,#8f4b2f)] text-sm font-bold tracking-[0.2em] text-white">
            MW
          </span>
          <span>
            <strong className="block font-serif text-xl text-[#2d1d17]">Maison Waret</strong>
            <small className="block text-sm text-[#6d5a50]">Patisserie artisanale</small>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold text-[#6d5a50]">
          <Link href="/" className="hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Accueil
          </Link>
          <Link href="/catalogue" className="hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Catalogue
          </Link>
          <Link href="/#processus" className="hover:-translate-y-0.5 hover:text-[#9d5c3f]">
            Comment ca marche
          </Link>
          <Link
            href={ctaHref}
            className="rounded-full bg-[#9d5c3f] px-5 py-2.5 text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] hover:-translate-y-0.5 hover:bg-[#7d442b]"
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
