import Link from "next/link";

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { getStorefrontData } from "@/lib/storefront";

const seasonalFruits = [
  "Peche",
  "Abricot",
  "Nectarine",
  "Mure",
  "Framboise",
  "Cerise",
  "Fraise",
];

export default async function ProduitsDeSaisonPage() {
  const { products } = await getStorefrontData();
  const seasonalProducts = products.filter((product) => product.category === "Produits de saison");

  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(212,162,136,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(138,79,52,0.12),_transparent_30%),linear-gradient(180deg,#fff8f2_0%,#fffaf5_100%)]" />

          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_18px_45px_rgba(92,50,28,0.12)] sm:rounded-[36px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  Produits de saison
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-[#33251d] sm:text-5xl">
                  Les creations du moment que tu veux garder a part sur une page dediee.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#6d5a50]">
                  Cette page rassemble les produits de saison que tu choisis de mettre en avant
                  maintenant: Fraisier, Framboisier et box de tartelettes de saison autour des
                  fruits du moment.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/catalogue?categorie=Produits%20de%20saison"
                    className="rounded-full bg-[#9d5c3f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
                  >
                    Voir au catalogue
                  </Link>
                  <Link
                    href="/commande"
                    className="rounded-full border border-[#ead8cc] bg-white px-6 py-3.5 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                  >
                    Demander un devis
                  </Link>
                </div>
              </article>

              <article className="rounded-[30px] border border-[#ead8cc] bg-[#fff3e8] p-6 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[36px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  Fruits du moment
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#33251d] sm:text-4xl">
                  La base fruitee actuelle de la selection saisonniere
                </h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {seasonalFruits.map((fruit) => (
                    <div
                      key={fruit}
                      className="rounded-[22px] border border-[#efddd2] bg-white px-4 py-4 text-sm font-medium text-[#6d5a50]"
                    >
                      {fruit}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Selection actuelle
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#33251d] sm:text-4xl">
                Les douceurs de saison visibles en ce moment
              </h2>
            </div>

            <Link
              href="/"
              className="rounded-full border border-[#ead8cc] bg-white px-5 py-3 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
            >
              Retour a l&apos;accueil
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {seasonalProducts.map((product) => (
              <StorefrontProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </>
  );
}
