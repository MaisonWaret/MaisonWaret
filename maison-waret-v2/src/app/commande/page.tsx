import Link from "next/link";

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontOrderForm } from "@/components/storefront-order-form";
import { getDeliveryCoverageLabel, getStorefrontData } from "@/lib/storefront";

export default async function CommandePage() {
  const { products, deliveryZones } = await getStorefrontData();

  return (
    <>
      <PublicSiteHeader ctaHref="/catalogue" ctaLabel="Voir le catalogue" />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(212,162,136,0.26),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(138,79,52,0.12),_transparent_30%)]" />

          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-10">
            <section className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_18px_45px_rgba(92,50,28,0.12)] sm:rounded-[34px] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Commander
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-[#33251d] sm:text-5xl">
                Faire une demande de commande
              </h1>
              <p className="mt-5 text-base leading-7 text-[#6d5a50] sm:leading-8">
                Cette page est dediee a la commande client. La vitrine reste elegante, puis la
                demande se fait ici de maniere simple, rassurante et lisible.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  "Aucun compte client n'est requis.",
                  "La demande est validee manuellement avant confirmation.",
                  "Le prix final peut etre ajuste selon les precisions demandees.",
                  deliveryZones.length > 0
                    ? getDeliveryCoverageLabel()
                    : "Le retrait est disponible en priorite pour le moment.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-[#f1e2d8] bg-[#fff7f0] px-4 py-4 text-sm leading-7 text-[#6d5a50]"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-[#ead8cc] bg-[#fff3e8] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9d5c3f]">
                  Comment ca marche
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#6d5a50]">
                  <p>1. Choisis tes produits et quantites.</p>
                  <p>2. Ajoute la date, le retrait ou la livraison autour de Baron et tes precisions.</p>
                  <p>3. Envoie la demande, puis Maison Waret te recontacte ensuite.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/"
                  className="rounded-full border border-[#ead8cc] bg-white px-5 py-3 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Retour a la vitrine
                </Link>
                <Link
                  href="/catalogue"
                  className="rounded-full border border-[#ead8cc] bg-white px-5 py-3 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Voir le catalogue
                </Link>
              </div>
            </section>

            <StorefrontOrderForm products={products} deliveryZones={deliveryZones} />
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </>
  );
}
