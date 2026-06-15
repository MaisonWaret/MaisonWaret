import Link from "next/link";

import { MaisonWaretLogo } from "@/components/maison-waret-logo";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { brandStory } from "@/lib/brand-content";
import { getPublicClientReviews } from "@/lib/customer-reviews";
import {
  getDeliveryCoverageLabel,
  getDeliveryCoverageShortLabel,
  getStorefrontData,
} from "@/lib/storefront";

export default async function Home() {
  const { products, deliveryZones } = await getStorefrontData();
  const { reviews } = await getPublicClientReviews();
  const homeFeaturedProducts = [
    {
      id: "signature-box",
      eyebrow: "Signature Maison",
      title: "Box viennoiserie signature",
      text: "La box signature Maison Waret avec croissants bicolores, croissants classiques et pains au chocolat.",
      href: "/catalogue?categorie=Signature%20Maison",
      cta: "Voir la box signature",
    },
    {
      id: "custom-cake",
      eyebrow: "Sur mesure",
      title: "Gateau personnalise",
      text: "Un gateau pense selon l'occasion, le nombre de parts, le style souhaite et les envies du client.",
      href: "/commande",
      cta: "Demander un devis",
    },
    {
      id: "seasonal-products",
      eyebrow: "Produits de saison",
      title: "Les creations du moment",
      text: "Une page dediee pour retrouver le Fraisier, le Framboisier et la box de tartelettes de saison.",
      href: "/produits-de-saison",
      cta: "Ouvrir la page saison",
    },
  ];
  const serviceCards = [
    {
      label: "Fabrication artisanale",
      title: "Une signature pensee pour faire envie des le premier regard",
      detail:
        "La box viennoiserie signature met en avant croissants bicolores, croissants et pains au chocolat dans un esprit maison et premium.",
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
    "Box viennoiserie signature avec croissants bicolores, croissants et pains au chocolat",
    "Produits de saison visibles sur une page dediee",
    "Demande de devis simple avant validation et paiement",
  ];
  const trustPoints = [
    "Validation manuelle avant toute confirmation",
    "Presentation premium pour offrir ou partager",
    "Livraison locale pensee autour de vos moments importants",
  ];
  const occasionCards = [
    {
      title: "Petit-dejeuner gourmand",
      text: "La box viennoiserie signature trouve naturellement sa place pour les matins d'exception, les week-ends ou les reunions d'equipe.",
    },
    {
      title: "Anniversaire ou celebration",
      text: "Gateaux et creations sur demande selon le nombre de parts, l'ambiance et les envies du moment.",
    },
    {
      title: "Cadeau attentionne",
      text: "Une selection elegante a offrir avec macarons, meringettes, boxes de voyage ou creations sur mesure.",
    },
  ];
  return (
    <>
      <PublicSiteHeader />

      <main className="overflow-hidden bg-[#fffaf5]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_top_left,_rgba(215,168,140,0.28),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(123,71,48,0.16),_transparent_34%),linear-gradient(180deg,#fffaf5_0%,#fff4ea_100%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:px-10">
            <section className="rounded-[30px] border border-[#ead8cc] bg-white/92 p-6 shadow-[0_22px_55px_rgba(92,50,28,0.12)] backdrop-blur sm:rounded-[38px] sm:p-8">
              <MaisonWaretLogo className="mb-6 sm:mb-8" />
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9d5c3f]">
                Patisserie artisanale sur commande
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.04] text-[#33251d] sm:text-5xl lg:text-6xl">
                Une vitrine plus desirée, des creations gourmandes, et une commande simple a vivre.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6d5a50] sm:text-lg sm:leading-8">
                Maison Waret imagine une box viennoiserie signature, des creations de saison et
                des desserts sur commande avec une presentation elegante, un ton premium et un
                service local pense pour faire plaisir.
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
                  Demander un devis
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
              <article className="relative overflow-hidden rounded-[28px] border border-[#ead8cc] bg-[linear-gradient(135deg,#3d2a21,#7e4e38)] p-6 text-white shadow-[0_20px_55px_rgba(61,42,33,0.24)] sm:rounded-[34px] sm:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_32%)]" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4cdb7]">
                    Livraison locale
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
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
                    className="flex min-h-[220px] flex-col justify-center rounded-[24px] border border-[#ead8cc] bg-white p-5 text-center shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[28px] lg:min-h-[250px] lg:px-7 lg:py-7"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                      {card.label}
                    </p>
                    <p className="mt-3 font-serif text-3xl text-[#33251d] sm:text-4xl">{card.value}</p>
                    <p className="mx-auto mt-2 max-w-[12rem] text-sm leading-6 text-[#6d5a50]">
                      {card.detail}
                    </p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid gap-5 xl:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  {card.label}
                </p>
                <h2 className="mt-4 font-serif text-2xl leading-tight text-[#33251d] sm:text-3xl">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#6d5a50]">{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="best-sellers"
          className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-10"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                Mise en avant
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#33251d] sm:text-4xl">
                Seulement les 3 univers a montrer tout de suite sur la home
              </h2>
            </div>
              <p className="max-w-xl text-sm leading-7 text-[#6d5a50]">
              La home reste plus claire avec uniquement la box signature, le gateau personnalise
              et les produits de saison.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {homeFeaturedProducts.map((item) => (
              <article
                key={item.id}
                className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_18px_40px_rgba(92,50,28,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_52px_rgba(92,50,28,0.14)] sm:rounded-[34px] sm:p-7"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-4 font-serif text-3xl leading-tight text-[#33251d]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#6d5a50]">{item.text}</p>
                <div className="mt-6">
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full border border-[#ead8cc] bg-white px-5 py-3 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                  >
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {occasionCards.map((occasion) => (
              <article
                key={occasion.title}
                className="rounded-[26px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)] sm:rounded-[30px]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                  Moment gourmand
                </p>
                <h3 className="mt-4 font-serif text-2xl text-[#33251d] sm:text-3xl">{occasion.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#6d5a50]">{occasion.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="univers" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[36px] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                {brandStory.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-[#33251d] sm:text-4xl">
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

            <article className="rounded-[30px] border border-[#ead8cc] bg-[#fff3e8] p-6 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[36px] sm:p-8">
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
          <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9d5c3f]">
                  Avis clients
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[#33251d] sm:text-4xl">
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
                  className="rounded-[26px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)] sm:rounded-[30px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
                      {review.occasion || "Avis client"}
                    </span>
                    <span className="text-sm font-semibold text-[#8a5a3c]">{review.rating}/5</span>
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-[#33251d] sm:text-2xl">
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

        <section id="livraison" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[30px] border border-[#ead8cc] bg-[#fff3e8] px-6 py-8 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[36px] sm:px-8 sm:py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                Livraison et retrait
              </p>
              <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-[#33251d] sm:text-4xl">
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

            <article className="rounded-[30px] border border-[#ead8cc] bg-white p-6 shadow-[0_16px_38px_rgba(92,50,28,0.08)] sm:rounded-[36px] sm:p-8">
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

        <section id="catalogue" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-[30px] border border-[#ead8cc] bg-[#33251d] px-6 py-8 text-white shadow-[0_16px_38px_rgba(51,37,29,0.18)] sm:rounded-[36px] sm:px-8 sm:py-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9d5c3f]">
                  Catalogue complet
                </p>
                <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-white sm:text-4xl">
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

        <section id="processus" className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
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
                className="rounded-[26px] border border-[#ead8cc] bg-white p-6 shadow-[0_14px_32px_rgba(92,50,28,0.08)] sm:rounded-[30px]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#9d5c3f] text-lg font-semibold text-white">
                  {step.step}
                </span>
                <h3 className="mt-4 font-serif text-xl text-[#33251d] sm:text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6d5a50]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
          <div className="rounded-[30px] bg-[#33251d] px-6 py-8 text-white shadow-[0_20px_55px_rgba(51,37,29,0.22)] sm:rounded-[36px] sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f4cdb7]">
              Finaliser
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">
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
