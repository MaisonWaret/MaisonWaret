import Link from "next/link";

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { siteContent } from "@/lib/mock-data";
import { getHomepageProductSections, getStorefrontData } from "@/lib/storefront";

export default async function Home() {
  const { products, deliveryZones } = await getStorefrontData();
  const { bestSellers, seasonal, signature } = getHomepageProductSections(products);
  const curatedSections = [
    {
      id: "signature",
      eyebrow: "Produits signature",
      title: "Les creations qui portent l'identite de la maison",
      products: signature,
    },
    {
      id: "seasonal",
      eyebrow: "Produits de saison",
      title: "Les douceurs du moment pour faire craquer",
      products: seasonal,
    },
  ].filter((section) => section.products.length > 0);
  const infoCards = [
    {
      label: "Produits visibles",
      value: `${products.length}`,
      detail: "Catalogue vitrine charge automatiquement",
    },
    {
      label: "Mode",
      value: deliveryZones.length > 0 ? "Retrait + livraison" : "Retrait",
      detail: "Livraison locale selon les zones actives",
    },
    {
      label: "Validation",
      value: "Manuelle",
      detail: "Chaque demande est confirmee avant paiement",
    },
  ];

  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(212,162,136,0.28),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(138,79,52,0.15),_transparent_32%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
            <section className="rounded-[34px] border border-[#ead8cc] bg-white p-8 shadow-[0_18px_45px_rgba(92,50,28,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Commandes sur demande
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.03] text-[#33251d] sm:text-6xl">
                Boxes de viennoiseries, gateaux et douceurs selon vos envies.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6d5a50]">
                {siteContent.brand} vous propose une demande de commande simple, elegante et sans
                compte client. Vous choisissez vos produits, vous envoyez votre besoin et la
                validation se fait ensuite manuellement.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/commande"
                  className="rounded-full bg-[#9d5c3f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(125,68,43,0.22)] hover:-translate-y-0.5 hover:bg-[#7d442b]"
                >
                  Faire une demande
                </Link>
                <a
                  href="#best-sellers"
                  className="rounded-full border border-[#ead8cc] bg-white px-6 py-3.5 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Voir les selections
                </a>
              </div>

              <ul className="mt-8 grid gap-3 text-sm text-[#6d5a50] sm:grid-cols-2">
                {[
                  "Aucune connexion client necessaire",
                  "Validation manuelle avant confirmation",
                  "Retrait disponible",
                  deliveryZones.length > 0
                    ? "Livraison locale selon les zones actives"
                    : "Livraison locale a venir",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-[20px] border border-[#f1e2d8] bg-[#fff7f0] px-4 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="grid gap-4">
              {infoCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-[28px] border border-[#ead8cc] bg-white p-6 shadow-[0_16px_38px_rgba(92,50,28,0.1)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                    {card.label}
                  </p>
                  <p className="mt-3 font-serif text-4xl text-[#33251d]">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5a50]">{card.detail}</p>
                </article>
              ))}
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Boxes de viennoiseries",
                text: "Formats prets a commander pour les brunchs, cadeaux et petits-dejeuners.",
              },
              {
                title: "Gateaux sur demande",
                text: "Precisez le nombre de parts, le parfum souhaite et vos consignes.",
              },
              {
                title: "Offres saisonnieres",
                text: "Ajoutez facilement les nouveautes selon les fetes et les envies du moment.",
              },
              {
                title: "Paiement apres validation",
                text: "La demande est etudiee avant toute confirmation finale de commande.",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-[28px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
              >
                <h2 className="font-serif text-2xl text-[#33251d]">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#6d5a50]">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="best-sellers"
          className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Nos incontournables
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#33251d]">
                Les best sellers qui donnent envie tout de suite
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#6d5a50]">
              Sur la home, on met en avant les produits qui attirent l&apos;oeil et donnent
              envie. Le reste du catalogue reste range dans une page separee.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {bestSellers.map((product) => (
              <StorefrontProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>

        {curatedSections.length > 0 ? (
          <section className="mx-auto w-full max-w-7xl px-6 py-4 lg:px-10">
            <div
              className={`grid gap-10 ${curatedSections.length > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
            >
              {curatedSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                        {section.eyebrow}
                      </p>
                      <h2 className="mt-3 font-serif text-4xl text-[#33251d]">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6">
                    {section.products.map((product) => (
                      <StorefrontProductCard key={product.id} product={product} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="catalogue" className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="rounded-[36px] border border-[#ead8cc] bg-[#fff3e8] px-8 py-10 shadow-[0_16px_38px_rgba(92,50,28,0.08)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                  Catalogue complet
                </p>
                <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#33251d]">
                  Envie de voir encore plus ? Une page externe regroupe tout ce que Maison Waret
                  propose.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/catalogue"
                  className="rounded-full bg-[#9d5c3f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,68,43,0.22)] hover:-translate-y-0.5 hover:bg-[#7d442b]"
                >
                  Voir tout le catalogue
                </Link>
                <Link
                  href="/commande"
                  className="rounded-full border border-[#ead8cc] bg-white px-6 py-3.5 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Commander
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                "Images d'ambiance sur chaque produit pour un rendu plus premium.",
                "Description plus complete pour aider le client a choisir.",
                "Page separee pour ranger le grand catalogue sans surcharger l'accueil.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-[#ead8cc] bg-white px-5 py-5 text-sm leading-7 text-[#6d5a50]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="processus" className="mx-auto w-full max-w-7xl px-6 py-4 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Le client envoie sa demande",
                text: "Il choisit ses produits, ajoute ses quantites et remplit le formulaire de commande.",
              },
              {
                step: "2",
                title: "Maison Waret verifie la faisabilite",
                text: "La demande est relue selon les delais, la production et la livraison locale.",
              },
              {
                step: "3",
                title: "Confirmation ensuite",
                text: "La commande est acceptee, ajustee ou refusee avant toute suite de paiement.",
              },
            ].map((step) => (
              <article
                key={step.step}
                className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#9d5c3f] text-lg font-semibold text-white">
                  {step.step}
                </span>
                <h3 className="mt-4 font-serif text-2xl text-[#33251d]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6d5a50]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="rounded-[36px] bg-[#33251d] px-8 py-10 text-white shadow-[0_20px_55px_rgba(51,37,29,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f4cdb7]">
              Commander
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight">
              Une page dediee pour faire sa demande, sans polluer la vitrine et sans espace
              client.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
              Le site vitrine reste propre et inspire confiance. Quand le client clique sur
              `Commander`, il arrive sur une page separee prevue uniquement pour sa demande.
            </p>
            <div className="mt-7">
              <Link
                href="/commande"
                className="inline-flex rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#33251d] hover:-translate-y-0.5"
              >
                Ouvrir la page commande
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </>
  );
}
