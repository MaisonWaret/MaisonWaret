import { AddToOrderButton } from "@/components/add-to-order-button";

import {
  formatCurrency,
  getProductTheme,
  type StorefrontProduct,
} from "@/lib/storefront";

type StorefrontProductCardProps = {
  product: StorefrontProduct;
  compact?: boolean;
};

export function StorefrontProductCard({
  product,
  compact = false,
}: StorefrontProductCardProps) {
  const theme = getProductTheme(product);

  return (
    <article className="group overflow-hidden rounded-[32px] border border-[#ead8cc] bg-white shadow-[0_18px_40px_rgba(92,50,28,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_52px_rgba(92,50,28,0.16)]">
      <div className={`relative h-52 p-5 text-white ${theme.visualClass}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.18))]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              {theme.eyebrow}
            </span>
            <span className="text-right text-xs uppercase tracking-[0.22em] text-white/80">
              {product.category}
            </span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">Maison Waret</p>
            <h3 className="mt-2 max-w-[16rem] font-serif text-3xl leading-tight">
              {product.name}
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${theme.chipClass}`}
          >
            {product.category}
          </span>
          {product.seasonal ? (
            <span className="rounded-full bg-[#fff1de] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9d5c3f]">
              Saison
            </span>
          ) : null}
        </div>

        <p className={`mt-4 text-[#6d5a50] ${compact ? "text-sm leading-6" : "text-sm leading-7"}`}>
          {product.description}
        </p>

        <div className="mt-5 h-px bg-[linear-gradient(90deg,rgba(157,92,63,0.18),rgba(157,92,63,0))]" />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#9d5c3f]">A partir de</p>
            <p className="mt-1 font-serif text-2xl text-[#33251d]">
              {formatCurrency(product.priceFrom)}
            </p>
          </div>

          <AddToOrderButton
            productId={product.id}
            className="rounded-full border border-[#ead8cc] bg-white px-4 py-2.5 text-sm font-semibold text-[#6d5a50] transition hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f] disabled:opacity-60"
          />
        </div>
      </div>
    </article>
  );
}
