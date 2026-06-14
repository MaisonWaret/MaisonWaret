"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { addProductToOrderSelection } from "@/lib/order-selection";

type AddToOrderButtonProps = {
  productId: string;
  className?: string;
  label?: string;
  navigateTo?: string;
};

export function AddToOrderButton({
  productId,
  className = "",
  label = "Ajouter a la commande",
  navigateTo = "/commande",
}: AddToOrderButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        addProductToOrderSelection(productId);
        router.push(navigateTo);
      }}
    >
      {busy ? "Ouverture..." : label}
    </button>
  );
}
