import Link from "next/link";

import { MaisonWaretLogo } from "@/components/maison-waret-logo";
import { getDeliveryCoverageLabel } from "@/lib/storefront";

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-[#ead8cc]/80 bg-[#fff4ea]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-10 text-sm text-[#6d5a50] lg:grid-cols-4 lg:px-10">
        <div>
          <MaisonWaretLogo compact />
          <p className="mt-3 leading-7">
            Patisserie artisanale sur commande, boxes gourmandes, creations signature et douceurs
            pensees pour les moments qui comptent.
          </p>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
            Navigation
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/" className="hover:text-[#9d5c3f]">
              Accueil
            </Link>
            <Link href="/catalogue" className="hover:text-[#9d5c3f]">
              Catalogue
            </Link>
            <Link href="/commande" className="hover:text-[#9d5c3f]">
              Faire une demande
            </Link>
            <Link href="/#livraison" className="hover:text-[#9d5c3f]">
              Livraison
            </Link>
          </div>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
            Fonctionnement
          </p>
          <p className="mt-3 leading-7">
            Aucune connexion client n&apos;est necessaire. Chaque demande est relue et validee
            manuellement avant confirmation.
          </p>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
            Livraison
          </p>
          <p className="mt-3 leading-7">
            {getDeliveryCoverageLabel()}. Retrait possible egalement selon le creneau choisi.
          </p>
        </div>
      </div>
    </footer>
  );
}
