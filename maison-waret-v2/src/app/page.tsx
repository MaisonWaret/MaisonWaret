import Link from "next/link";

import { MaisonWaretLogo } from "@/components/maison-waret-logo";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { brandStory } from "@/lib/brand-content";
import { getPublicClientReviews } from "@/lib/customer-reviews";
import {
  getDeliveryCoverageLabel,
  getDeliveryCoverageShortLabel,
  getHomepageProductSections,
  getStorefrontData,
} from "@/lib/storefront";

export default async function Home() {
  const { products, deliveryZones } = await getStorefrontData();
  const { reviews } = await getPublicClientReviews();
  const { bestSellers, seasonal, signature } = getHomepageProductSections(products);
  const curatedSections = [
    {
      id: "signature",
      eyebrow: "Produits signature",
      title: "Des creations qui portent la patte Maison Waret",
      products: signature,
    },
    {
      id: "seasonal",
      eyebrow: "Produits de saison",
      title: "Les douceurs du moment qui donnent faim au premier regard",
      products: seasonal,
    },
  ].filter((section) => section.products.length > 0);
  const serviceCards = [
    {
      label: "Fabrication artisanale",
      title: "Des produits penses comme une belle attention",
      detail:
        "Boxes de viennoiseries, douceurs a partager et creations sur commande avec une presentation soignee.",
    },
    {
      label: "Commande simple",
      title: "Une demande claire, sans espace client",
      detail:
        "Le client choisit, indique son besoin, puis la validation se fait tranquillement avec Maison Waret.",
    },
    {
      label: "Service local",
      title: "Retrait ou livraison autour de Baron",
      detail: getDeliveryCoverageLabel(),
    },
  ];
  const heroHighlights = [
    "Boxes de viennoiseries et douceurs signature",
    "Retrait ou livraison locale sur validation",
    "Commande simple, claire et sans compte client",
  ];
  const trustPoints = [
    "Validation manuelle avant toute confirmation",
    "Presentation premium pour offrir ou partager",
    "Livraison locale pensee autour de vos moments importants",
  ];
  const occasionCards = [
    {
      title: "Petit-dejeuner gourmand",
      text: "Des boxes pretes a faire plaisir pour les matins d'exception, les week-ends ou les reunions d'equipe.",
    },
    {
      title: "Anniversaire ou celebration",
      text: "Gateaux et creations sur demande selon le nombre de parts, l'ambiance et les envies du moment.",
    },
    {
      title: "Cadeau attentionne",
      text: "Une selection elegante a offrir quand tu veux faire plaisir avec quelque chose de vraiment gourmand.",
    },
  ];
  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_top_left,_rgba(215,168,140,0.28),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(123,71,48,0.16),_transparent_34%),linear-gradient(180deg,#fffaf5_0%,#fff4ea_100%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-10">
            <section className="rounded-[38px] border border-[#ead8cc] bg-white/92 p-8 shadow-[0_22px_55px_rgba(92,50,28,0.12)] backdrop-blur">
              <MaisonWaretLogo className="mb-6 sm:mb-8" />
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9d5c3f]">
                Patisserie artisanale sur commande
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.02] text-[#33251d] sm:text-6xl">
                Une vitrine plus desirée, des creations gourmandes, et une commande simple a vivre.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6d5a50]">
                Maison Waret imagine des boxes de viennoiseries, des douceurs a partager et des
                creations sur demande avec une presentation elegante, un ton premium et un service
                local pense pour faire plaisir.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/catalogue"
                  className="rounded-full bg-[#9d5c3f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(125,68,43,0.22)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
                >
                  Explorer le catalogue
                </Link>
                <Link
                  href="/commande"
                  className="rounded-full border border-[#ead8cc] bg-white px-6 py-3.5 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Faire une demande
                </Link>
              </div>

              <ul className="mt-8 grid gap-3 text-sm text-[#6d5a50] sm:grid-cols-2">
                {heroHighlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-[22px] border border-[#f1e2d8] bg-[#fff7f0] px-4 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="grid gap-4">
              <article className="relative overflow-hidden rounded-[34px] border border-[#ead8cc] bg-[linear-gradient(135deg,#3d2a21,#7e4e38)] p-7 text-white shadow-[0_20px_55px_rgba(61,42,33,0.24)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_32%)]" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4cdb7]">
                    Livraison locale
                  </p>
                  <h2 className="mt-3 font-serif text-4xl leading-tight">
                    {getDeliveryCoverageShortLabel()}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/78">
                    {getDeliveryCoverageLabel()}. Le retrait reste disponible egalement pour garder
                    un service souple et clair.
                  </p>
                  <a
                    href="https://fr.mappy.com/plan/60300-baron"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Voir Baron sur la carte
                  </a>
                </div>
              </article>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  {
                    label: "Produits",
                    value: `${products.length}`,
                    detail: "references gourmandes deja visibles dans la vitrine",
                  },
                  {
                    label: "Livraison",
                    value: deliveryZones.length > 0 ? "Locale" : "Retrait",
                    detail: deliveryZones.length > 0 ? getDeliveryCoverageShortLabel() : "service a retirer",
                  },
                  {
                    label: "Validation",
                    value: "Manuelle",
                    detail: "chaque commande est relue avant confirmation",
                  },
                ].map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[28px] border border-[#ead8cc] bg-white p-5 shadow-[0_16px_38px_rgba(92,50,28,0.08)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                      {card.label}
                    </p>
                    <p className="mt-3 font-serif text-4xl text-[#33251d]">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6d5a50]">{card.detail}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
          <div className="grid gap-5 xl:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  {card.label}
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-[#33251d]">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#6d5a50]">{card.detail}</p>
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
                Les best sellers qui donnent envie des la premiere seconde
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#6d5a50]">
              Une selection courte, visuelle et gourmande pour faire naitre l&apos;envie avant
              meme d&apos;ouvrir le catalogue complet.
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

        <section className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {occasionCards.map((occasion) => (
              <article
                key={occasion.title}
                className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                  Moment gourmand
                </p>
                <h3 className="mt-4 font-serif text-3xl text-[#33251d]">{occasion.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#6d5a50]">{occasion.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="univers" className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[36px] border border-[#ead8cc] bg-white p-8 shadow-[0_16px_38px_rgba(92,50,28,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                {brandStory.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-tight text-[#33251d]">
                {brandStory.title}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#6d5a50]">{brandStory.intro}</p>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[#6d5a50]">
                {brandStory.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#8a5a3c]">
                {brandStory.signature}
              </p>
            </article>

            <article className="rounded-[36px] border border-[#ead8cc] bg-[#fff3e8] p-8 shadow-[0_16px_38px_rgba(92,50,28,0.08)]">
              <MaisonWaretLogo />
              <div className="mt-8 grid gap-4">
                {brandStory.values.map((value) => (
                  <div
                    key={value}
                    className="rounded-[22px] border border-[#efddd2] bg-white/80 px-5 py-4 text-sm leading-7 text-[#6d5a50]"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {reviews.length > 0 ? (
          <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  Avis clients
                </p>
                <h2 className="mt-3 font-serif text-4xl text-[#33251d]">
                  Ce que les clients retiennent de la maison
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[#6d5a50]">
                Des retours visibles sur la vitrine pour rassurer et donner encore plus envie.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                      {review.occasion || "Avis client"}
                    </span>
                    <span className="text-sm font-semibold text-[#8a5a3c]">{review.rating}/5</span>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-[#33251d]">
                    {review.title || "Un retour client"}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#6d5a50]">&quot;{review.message}&quot;</p>
                  <p className="mt-5 text-sm font-semibold text-[#2d1d17]">
                    {review.authorName}
                    {review.city ? ` · ${review.city}` : ""}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="livraison" className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[36px] border border-[#ead8cc] bg-[#fff3e8] px-8 py-10 shadow-[0_16px_38px_rgba(92,50,28,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                Livraison et retrait
              </p>
              <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#33251d]">
                Un service local pense autour de Baron, dans l&apos;Oise, pour garder quelque chose
                de simple et premium.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#6d5a50]">
                {getDeliveryCoverageLabel()}. L&apos;objectif est de proposer un service lisible,
                rassurant et adapte aux commandes gourmandes qui demandent de l&apos;attention.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/commande"
                  className="rounded-full bg-[#9d5c3f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,68,43,0.22)] transition hover:-translate-y-0.5 hover:bg-[#7d442b]"
                >
                  Verifier la livraison
                </Link>
                <a
                  href="https://fr.mappy.com/plan/60300-baron"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#ead8cc] bg-white px-6 py-3.5 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                >
                  Ouvrir la carte
                </a>
              </div>
            </article>

            <article className="rounded-[36px] border border-[#ead8cc] bg-white p-8 shadow-[0_16px_38px_rgba(92,50,28,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Ce que le client comprend
              </p>
              <div className="mt-6 space-y-4">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-[22px] border border-[#f1e2d8] bg-[#fffaf7] px-4 py-4 text-sm leading-7 text-[#6d5a50]"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section id="catalogue" className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">
          <div className="rounded-[36px] border border-[#ead8cc] bg-[#33251d] px-8 py-10 text-white shadow-[0_16px_38px_rgba(51,37,29,0.18)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                  Catalogue complet
                </p>
                <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-white">
                  Envie d&apos;aller plus loin ? Le catalogue complet met toute la selection en scene.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/catalogue"
                  className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#33251d] shadow-[0_12px_28px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5"
                >
                  Voir tout le catalogue
                </Link>
                <Link
                  href="/commande"
                  className="rounded-full border border-white/25 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
                >
                  Commander
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                "Une presentation plus riche pour rendre chaque produit plus desirable.",
                "Des categories claires pour guider rapidement les envies du client.",
                "Une page separee pour garder l'accueil elegante et inspirante.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-5 text-sm leading-7 text-white/78"
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
                title: "Le client se projette",
                text: "Il decouvre l'univers, regarde le catalogue et selectionne les produits qui lui donnent envie.",
              },
              {
                step: "2",
                title: "Il envoie sa demande",
                text: "La page commande reste simple, claire et concentree sur les informations essentielles.",
              },
              {
                step: "3",
                title: "Maison Waret confirme ensuite",
                text: "La faisabilite, les delais et le total final sont verifies avant toute suite de paiement.",
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
              Finaliser
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight">
              Une demande simple, premium et rassurante pour commander sans friction.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
              La vitrine raconte l&apos;univers et donne envie. La page commande prend ensuite le
              relais pour transformer l&apos;interet en vraie demande client.
            </p>
            <div className="mt-7">
              <Link
                href="/commande"
                className="inline-flex rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#33251d] transition hover:-translate-y-0.5"
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
