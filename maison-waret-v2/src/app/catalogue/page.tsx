import Link from "next/link";

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import {
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

  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(212,162,136,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(138,79,52,0.12),_transparent_30%)]" />

          <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
            <div className="rounded-[34px] border border-[#ead8cc] bg-white p-8 shadow-[0_18px_45px_rgba(92,50,28,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Catalogue complet
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-[#33251d]">
                Toutes les douceurs proposees par Maison Waret
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#6d5a50]">
                Ici, tu affiches l&apos;ensemble des produits proposes avec une vraie presentation
                plus riche : visuel, description, prix a partir de et categories. Le client peut
                prendre son temps avant d&apos;ouvrir la page commande.
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
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Produits
              </p>
              <h2 className="mt-2 font-serif text-4xl text-[#33251d]">
                {activeCategory ? activeCategory : "Toute la selection"}
              </h2>
            </div>

            <Link
              href="/commande"
              className="rounded-full bg-[#9d5c3f] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,68,43,0.2)] hover:-translate-y-0.5 hover:bg-[#7d442b]"
            >
              Aller a la commande
            </Link>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <StorefrontProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-[#ead8cc] bg-white p-8 text-sm leading-7 text-[#6d5a50] shadow-[0_14px_32px_rgba(92,50,28,0.08)]">
              Aucun produit ne correspond a cette categorie pour le moment.
            </div>
          )}
        </section>
      </main>

      <PublicSiteFooter />
    </>
  );
}
