"use client";

import Link from "next/link";
import { useState } from "react";

import { MaisonWaretLogo } from "@/components/maison-waret-logo";

type PublicSiteHeaderProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export function PublicSiteHeader({
  ctaHref = "/commande",
  ctaLabel = "Commander",
}: PublicSiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/catalogue", label: "Catalogue" },
    { href: "/#univers", label: "La maison" },
    { href: "/#livraison", label: "Livraison" },
    { href: "/#processus", label: "Fonctionnement" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-[#ead8cc]/70 bg-[#fffaf5]/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="transition hover:-translate-y-0.5">
          <MaisonWaretLogo compact />
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#6d5a50] lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:-translate-y-0.5 hover:text-[#9d5c3f]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ctaHref}
            className="rounded-full bg-[#9d5c3f] px-5 py-2.5 text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
          >
            {ctaLabel}
          </Link>
        </nav>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-full border border-[#ead8cc] bg-white px-4 py-2 text-sm font-semibold text-[#6d5a50] transition hover:border-[#9d5c3f] hover:text-[#9d5c3f] lg:hidden"
        >
          {menuOpen ? "Fermer" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#ead8cc]/70 px-4 py-4 sm:px-6 lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-sm font-semibold text-[#6d5a50]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl bg-white px-4 py-3 transition hover:text-[#9d5c3f]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={ctaHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-full bg-[#9d5c3f] px-5 py-3 text-center text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] transition hover:bg-[#7d442b]"
            >
              {ctaLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
