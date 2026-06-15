"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  getProductTheme,
  formatCurrency,
  getDeliveryCoverageLabel,
  type DeliveryZoneOption,
  type StorefrontProduct,
} from "@/lib/storefront";
import {
  clearOrderSelection,
  readOrderSelection,
  removeProductFromOrderSelection,
  writeOrderSelection,
} from "@/lib/order-selection";

type StorefrontOrderFormProps = {
  products: StorefrontProduct[];
  deliveryZones: DeliveryZoneOption[];
};

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMode: "delivery" | "pickup";
  deliveryZoneId: string;
  deliveryAddress: string;
  pickupNotes: string;
  requestedDate: string;
  requestedTimeSlot: string;
  notes: string;
  quantities: Record<string, string>;
};

function createSelectedQuantities(productIds: string[], currentQuantities: Record<string, string>) {
  return Object.fromEntries(
    productIds.map((productId) => {
      const currentValue = currentQuantities[productId];
      const quantity = Number.parseInt(currentValue || "1", 10);

      return [productId, Number.isFinite(quantity) && quantity > 0 ? String(quantity) : "1"];
    }),
  );
}

function createInitialState(selectedProductIds: string[]): FormState {
  return {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryMode: "pickup",
    deliveryZoneId: "",
    deliveryAddress: "",
    pickupNotes: "",
    requestedDate: "",
    requestedTimeSlot: "",
    notes: "",
    quantities: Object.fromEntries(selectedProductIds.map((productId) => [productId, "1"])),
  };
}

export function StorefrontOrderForm({
  products,
  deliveryZones,
}: StorefrontOrderFormProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() =>
    readOrderSelection(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formState, setFormState] = useState<FormState>(() =>
    createInitialState(readOrderSelection()),
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((productId) => productMap.get(productId))
        .filter((product): product is StorefrontProduct => Boolean(product)),
    [productMap, selectedProductIds],
  );

  const suggestionProducts = useMemo(
    () =>
      products.filter((product) => !selectedProductIds.includes(product.id)).slice(0, 5),
    [products, selectedProductIds],
  );

  const selectedZone = useMemo(
    () =>
      deliveryZones.find((zone) => zone.id === formState.deliveryZoneId) || null,
    [deliveryZones, formState.deliveryZoneId],
  );

  const selectedItems = useMemo(
    () =>
      selectedProducts
        .map((product) => {
          const rawQuantity = formState.quantities[product.id] || "1";
          const quantity = Number.parseInt(rawQuantity, 10);

          return {
            product,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          };
        })
        .filter((item) => item.quantity > 0),
    [formState.quantities, selectedProducts],
  );

  const pricingSummary = useMemo(() => {
    const hasCustomPrice = selectedItems.some((item) => item.product.priceFrom === null);
    const itemsSubtotal = hasCustomPrice
      ? null
      : selectedItems.reduce(
          (sum, item) => sum + (item.product.priceFrom || 0) * item.quantity,
          0,
        );

    const deliveryFee =
      formState.deliveryMode === "delivery" ? Number(selectedZone?.deliveryFee || 0) : 0;

    return {
      hasCustomPrice,
      itemsSubtotal,
      deliveryFee,
      estimatedTotal:
        itemsSubtotal === null ? null : Number((itemsSubtotal + deliveryFee).toFixed(2)),
      minimumOrderAmount:
        formState.deliveryMode === "delivery"
          ? selectedZone?.minimumOrderAmount ?? null
          : null,
    };
  }, [formState.deliveryMode, selectedItems, selectedZone]);

  const minimumOrderNotReached =
    pricingSummary.itemsSubtotal !== null &&
    pricingSummary.minimumOrderAmount !== null &&
    pricingSummary.itemsSubtotal < pricingSummary.minimumOrderAmount;

  const minRequestedDate = new Date().toISOString().split("T")[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (selectedProductIds.length === 0) {
      setErrorMessage("Ajoute au moins un produit avant d'envoyer la demande.");
      return;
    }

    if (formState.deliveryMode === "delivery" && !formState.deliveryZoneId) {
      setErrorMessage("Choisis une zone de livraison.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formState.customerName,
          customerEmail: formState.customerEmail,
          customerPhone: formState.customerPhone,
          deliveryMode: formState.deliveryMode,
          deliveryZoneId:
            formState.deliveryMode === "delivery" ? formState.deliveryZoneId : undefined,
          deliveryAddress:
            formState.deliveryMode === "delivery" ? formState.deliveryAddress : undefined,
          pickupNotes:
            formState.deliveryMode === "pickup" ? formState.pickupNotes : undefined,
          requestedDate: formState.requestedDate,
          requestedTimeSlot: formState.requestedTimeSlot,
          notes: formState.notes,
          items: selectedItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; orderNumber?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.message || "Impossible d'envoyer la demande pour le moment.",
        );
      }

      setSuccessMessage(
        payload?.orderNumber
          ? `Demande de devis envoyee avec succes. Numero: ${payload.orderNumber}. Maison Waret revient vers toi avant paiement.`
          : "Demande de devis envoyee avec succes. Maison Waret revient vers toi avant paiement.",
      );
      clearOrderSelection();
      setSelectedProductIds([]);
      setFormState(createInitialState([]));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'envoi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function syncSelection(nextIds: string[]) {
    const filteredIds = nextIds.filter((productId) => productMap.has(productId));
    writeOrderSelection(filteredIds);
    setSelectedProductIds(filteredIds);
    setFormState((current) => ({
      ...current,
      quantities: createSelectedQuantities(filteredIds, current.quantities),
    }));
  }

  function handleAddSuggestion(productId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    syncSelection([...selectedProductIds, productId]);
  }

  function handleRemoveSelected(productId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    const nextIds = removeProductFromOrderSelection(productId).filter((id) => productMap.has(id));
    setSelectedProductIds(nextIds);
    setFormState((current) => ({
      ...current,
      quantities: createSelectedQuantities(nextIds, current.quantities),
    }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-[#efddd2] bg-[#fffaf7] p-4 shadow-[0_18px_40px_rgba(91,54,35,0.08)] sm:rounded-[32px] sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a4f34]">
          Devis
        </p>
        <h3 className="font-serif text-2xl text-[#2d1d17] sm:text-3xl">
          Envoyer une demande de devis
        </h3>
        <p className="text-sm leading-6 text-[#6f5b50]">
          Remplis les informations utiles, choisis tes produits et envoie ta demande. Maison
          Waret te recontacte ensuite avec un devis ou un montant final avant paiement.
        </p>
      </div>

      <div className="mt-6 rounded-[24px] border border-[#ead8cd] bg-white p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
          Paiement apres validation
        </p>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-[#6f5b50]">
          <p>1. Tu envoies ta demande de devis personnalise.</p>
          <p>2. Maison Waret confirme les details et le montant final.</p>
          <p>3. Tu paies uniquement si le devis te convient.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Nom complet
          <input
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            value={formState.customerName}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                customerName: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Email
          <input
            type="email"
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            value={formState.customerEmail}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                customerEmail: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Telephone
          <input
            type="tel"
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            value={formState.customerPhone}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                customerPhone: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Date souhaitee
          <input
            type="date"
            min={minRequestedDate}
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            value={formState.requestedDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                requestedDate: event.target.value,
              }))
            }
            required
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Creneau prefere
          <input
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            placeholder="Ex: matin, 14h-16h, retrait a 17h"
            value={formState.requestedTimeSlot}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                requestedTimeSlot: event.target.value,
              }))
            }
          />
        </label>

        <div className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Mode
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                formState.deliveryMode === "pickup"
                  ? "border-[#8a4f34] bg-[#8a4f34] text-white"
                  : "border-[#e6d3c7] bg-white text-[#6f5b50]"
              }`}
              onClick={() =>
                setFormState((current) => ({
                  ...current,
                  deliveryMode: "pickup",
                  deliveryZoneId: "",
                  deliveryAddress: "",
                }))
              }
            >
              Retrait
            </button>
            <button
              type="button"
              disabled={deliveryZones.length === 0}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                formState.deliveryMode === "delivery"
                  ? "border-[#8a4f34] bg-[#8a4f34] text-white"
                  : "border-[#e6d3c7] bg-white text-[#6f5b50]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() =>
                setFormState((current) => ({
                  ...current,
                  deliveryMode: "delivery",
                  pickupNotes: "",
                }))
              }
            >
              Livraison
            </button>
          </div>
          {deliveryZones.length === 0 ? (
            <p className="text-xs text-[#8a4f34]">
              La livraison n&apos;est pas disponible pour le moment.
            </p>
          ) : (
            <p className="text-xs text-[#8a4f34]">{getDeliveryCoverageLabel()}.</p>
          )}
        </div>
      </div>

      {formState.deliveryMode === "delivery" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
            Zone de livraison
            <select
              className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
              value={formState.deliveryZoneId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  deliveryZoneId: event.target.value,
                }))
              }
              required
            >
              <option value="">Choisir une zone</option>
              {deliveryZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#8a4f34]">
              La livraison reste locale pour garder un service clair et qualitatif.
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-[#5f4b40] md:col-span-2">
            Adresse de livraison
            <textarea
              rows={3}
              className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
              placeholder="Rue, numero, complement, code d'acces..."
              value={formState.deliveryAddress}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  deliveryAddress: event.target.value,
                }))
              }
              required
            />
          </label>
        </div>
      ) : (
        <div className="mt-6">
          <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
            Precisions pour le retrait
            <textarea
              rows={3}
              className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
              placeholder="Heure precise, nom pour le retrait, consignes..."
              value={formState.pickupNotes}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  pickupNotes: event.target.value,
                }))
              }
            />
          </label>
        </div>
      )}

      <div className="mt-8 rounded-[24px] border border-[#ead8cd] bg-white p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
          Que la Maison Waret peut vous proposer
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-serif text-xl text-[#2d1d17] sm:text-2xl">Un petit truc en plus ?</h4>
          <p className="text-sm text-[#6f5b50]">
            Ajoute en un clic quelques douceurs qui font envie.
          </p>
        </div>

        {suggestionProducts.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {suggestionProducts.map((product) => {
              const theme = getProductTheme(product);

              return (
                <div
                  key={product.id}
                  className="rounded-[22px] border border-[#ead8cd] bg-[#fffaf7] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
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
                  <h5 className="mt-3 font-serif text-xl text-[#2d1d17]">{product.name}</h5>
                  <p className="mt-2 text-sm leading-6 text-[#6f5b50]">{product.description}</p>
                  <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[#2d1d17]">
                      A partir de {formatCurrency(product.priceFrom)}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-[#ead8cc] bg-white px-4 py-2 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                      onClick={() => handleAddSuggestion(product.id)}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#6f5b50]">
            Toute la selection disponible est deja dans ta commande.
          </p>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-serif text-xl text-[#2d1d17] sm:text-2xl">Ta selection</h4>
          <p className="text-sm text-[#6f5b50]">
            La liste affiche seulement les produits que tu as choisis.
          </p>
        </div>

        {selectedProducts.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="grid gap-4 rounded-[24px] border border-[#ead8cd] bg-white px-4 py-4 md:grid-cols-[1fr_160px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#f3e2d7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                      {product.category}
                    </span>
                    <p className="text-sm font-semibold text-[#2d1d17]">
                      A partir de {formatCurrency(product.priceFrom)}
                    </p>
                  </div>
                  <h5 className="mt-3 font-serif text-lg text-[#2d1d17] sm:text-xl">{product.name}</h5>
                  <p className="mt-2 text-sm leading-6 text-[#6f5b50]">{product.description}</p>
                  <button
                    type="button"
                    className="mt-4 rounded-full border border-[#ead8cc] bg-white px-4 py-2 text-sm font-semibold text-[#6d5a50] hover:-translate-y-0.5 hover:border-[#9d5c3f] hover:text-[#9d5c3f]"
                    onClick={() => handleRemoveSelected(product.id)}
                  >
                    Retirer de la commande
                  </button>
                </div>

                <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
                  Quantite
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
                    value={formState.quantities[product.id] || "1"}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        quantities: {
                          ...current.quantities,
                          [product.id]: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-[#ead8cd] bg-white px-5 py-5 text-sm leading-7 text-[#6f5b50]">
            Aucun produit n&apos;est encore dans ta commande. Clique sur `Ajouter a la commande`
            depuis la vitrine ou ajoute une proposition juste au-dessus.
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="flex flex-col gap-2 text-sm text-[#5f4b40]">
          Notes complementaires
          <textarea
            rows={4}
            className="rounded-2xl border border-[#e6d3c7] bg-white px-4 py-3 outline-none transition focus:border-[#8a4f34]"
            placeholder="Parfums, allergies, theme, nombre de parts, contraintes horaires..."
            value={formState.notes}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="mt-8 rounded-[24px] border border-[#ead8cd] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h4 className="font-serif text-xl text-[#2d1d17] sm:text-2xl">Resume</h4>
          <p className="text-sm text-[#6f5b50]">
            {selectedItems.length > 0
              ? `${selectedItems.length} produit(s) selectionne(s)`
              : "Aucun produit selectionne"}
          </p>
        </div>

        <div className="mt-4 space-y-2 text-sm leading-6 text-[#6f5b50]">
          <p>
            Sous-total indicatif:{" "}
            <span className="font-semibold text-[#2d1d17]">
              {pricingSummary.itemsSubtotal === null
                ? "Sur devis"
                : formatCurrency(pricingSummary.itemsSubtotal)}
            </span>
          </p>
          <p>
            Frais de livraison:{" "}
            <span className="font-semibold text-[#2d1d17]">
              {formatCurrency(pricingSummary.deliveryFee)}
            </span>
          </p>
          <p>
            Estimation avant devis:{" "}
            <span className="font-semibold text-[#2d1d17]">
              {pricingSummary.estimatedTotal === null
                ? "Sur devis"
                : formatCurrency(pricingSummary.estimatedTotal)}
            </span>
          </p>
          {pricingSummary.hasCustomPrice ? (
            <p className="text-xs text-[#8a4f34]">
              Certains produits sont sur devis, donc le montant final sera confirme avant
              paiement.
            </p>
          ) : null}
          <p className="text-xs text-[#8a4f34]">
            Aucun reglement n&apos;est demande a cette etape. Le paiement vient seulement apres
            validation du devis par Maison Waret.
          </p>
          {minimumOrderNotReached ? (
            <p className="text-xs text-[#8a4f34]">
              Le minimum pour cette zone est de{" "}
              {formatCurrency(pricingSummary.minimumOrderAmount)} hors frais de livraison.
            </p>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-5 rounded-2xl border border-[#e7b8a2] bg-[#fff1ea] px-4 py-3 text-sm text-[#8c4d33]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-5 rounded-2xl border border-[#cfe6d4] bg-[#edf8f0] px-4 py-3 text-sm text-[#29543a]">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || minimumOrderNotReached}
        className="mt-6 inline-flex rounded-full bg-[#8a4f34] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Envoi en cours..." : "Envoyer ma demande de devis"}
      </button>
    </form>
  );
}
