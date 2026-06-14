import Link from "next/link";

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import {
  getDeliveryCoverageLabel,
  getProductCategories,
  getStorefrontData,
} from "@/lib/storefront";

type CataloguePageProps = {
  searchParams?: Promise<{
    categorie?: string;
  }>;
};

export default async function CataloguePage({
  searchParams,
}: CataloguePageProps) {
  const params = (await searchParams) || {};
  const { products } = await getStorefrontData();
  const categories = getProductCategories(products);
  const activeCategory = params.categorie || "";
  const visibleProducts = activeCategory
    ? products.filter((product) => product.category === activeCategory)
    : products;
  const premiumNotes = [
    "Une selection pensee pour donner envie avant meme la commande.",
    "Des categories claires pour aller vite vers ce qui fait craquer.",
    getDeliveryCoverageLabel(),
  ];

  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(212,162,136,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(138,79,52,0.12),_transparent_30%),linear-gradient(180deg,#fff8f2_0%,#fffaf5_100%)]" />

          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_18px_45px_rgba(92,50,28,0.12)] sm:rounded-[36px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  Catalogue complet
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-[#33251d] sm:text-5xl">
                  Toutes les douceurs proposees par Maison Waret, dans une presentation plus elegante.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#6d5a50]">
                  Le catalogue sert a faire monter l&apos;envie: visuels premium, categories claires,
                  descriptions courtes mais gourmandes, puis un acces direct vers la commande.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/catalogue"
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      activeCategory
                        ? "border-[#ead8cc] bg-white text-[#6d5a50] hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                        : "border-[#9d5c3f] bg-[#9d5c3f] text-white"
                    }`}
                  >
                    Tout voir
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/catalogue?categorie=${encodeURIComponent(category)}`}
                      className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                        activeCategory === category
                          ? "border-[#9d5c3f] bg-[#9d5c3f] text-white"
                          : "border-[#ead8cc] bg-white text-[#6d5a50] hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                      }`}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {premiumNotes.map((note, index) => (
                  <article
                    key={note}
                    className={`rounded-[24px] border p-5 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[30px] sm:p-6 ${
                      index === 0
                        ? "border-[#ead8cc] bg-[#fff3e8]"
                        : "border-[#ead8cc] bg-white"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                      {index === 0 ? "Esprit" : index === 1 ? "Lecture" : "Service"}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#6d5a50]">{note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Produits
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#33251d] sm:text-4xl">
                {activeCategory ? activeCategory : "Toute la selection"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-[#ead8cc] bg-white px-5 py-3 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
              >
                Retour a l&apos;accueil
              </Link>
              <Link
                href="/commande"
                className="rounded-full bg-[#9d5c3f] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
              >
                Aller a la commande
              </Link>
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <StorefrontProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-[#ead8cc] bg-white p-8 text-sm leading-7 text-[#6d5a50] shadow-[0_14px_32px_rgba(92,50,28,0.08)]">
              Aucun produit ne correspond a cette categorie pour le moment.
            </div>
          )}

          <div className="mt-12 rounded-[28px] bg-[#33251d] px-6 py-8 text-white shadow-[0_18px_45px_rgba(51,37,29,0.18)] sm:rounded-[34px] sm:px-8 sm:py-9">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4cdb7]">
                  Commande sur mesure
                </p>
                <h3 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">
                  Tu as trouve l&apos;inspiration ? La page commande prend ensuite le relais.
                </h3>
              </div>
              <Link
                href="/commande"
                className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#33251d] transition hover:-translate-y-0.5"
              >
                Ouvrir la commande
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </>
  );
}
