import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontData, type StorefrontProduct } from "@/lib/storefront";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.email().trim().toLowerCase(),
  customerPhone: z.string().trim().min(6).max(40),
  deliveryMode: z.enum(["delivery", "pickup"]),
  deliveryZoneId: z.string().trim().max(120).optional(),
  deliveryAddress: z.string().trim().max(600).optional(),
  pickupNotes: z.string().trim().max(600).optional(),
  requestedDate: z.string().regex(isoDatePattern),
  requestedTimeSlot: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(120),
        quantity: z.coerce.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(20),
});

function buildOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  return `MW-${year}${month}${day}-${random}`;
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

type ResolvedOrderItem = {
  productId: string;
  quantity: number;
  product: StorefrontProduct;
};

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { message: "Supabase serveur non configure." },
      { status: 503 },
    );
  }

  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informations invalides pour creer la commande." },
      { status: 400 },
    );
  }

  const storefront = await getStorefrontData();
  const productMap = new Map(storefront.products.map((product) => [product.id, product]));
  const zoneMap = new Map(storefront.deliveryZones.map((zone) => [zone.id, zone]));

  const duplicateProductIds = new Set<string>();
  const seenProductIds = new Set<string>();

  for (const item of parsed.data.items) {
    if (seenProductIds.has(item.productId)) {
      duplicateProductIds.add(item.productId);
    }
    seenProductIds.add(item.productId);
  }

  if (duplicateProductIds.size > 0) {
    return NextResponse.json(
      { message: "Chaque produit doit apparaitre une seule fois dans la demande." },
      { status: 400 },
    );
  }

  const selectedItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      ...item,
      product,
    };
  });

  if (selectedItems.some((item) => !item.product)) {
    return NextResponse.json(
      { message: "Un des produits selectionnes n'est plus disponible." },
      { status: 400 },
    );
  }

  const resolvedItems = selectedItems as ResolvedOrderItem[];

  const deliveryZone =
    parsed.data.deliveryMode === "delivery"
      ? zoneMap.get(parsed.data.deliveryZoneId || "")
      : null;

  if (parsed.data.deliveryMode === "delivery" && !deliveryZone) {
    return NextResponse.json(
      { message: "Zone de livraison invalide ou indisponible." },
      { status: 400 },
    );
  }

  if (
    parsed.data.deliveryMode === "delivery" &&
    !normalizeOptionalText(parsed.data.deliveryAddress)
  ) {
    return NextResponse.json(
      { message: "L'adresse de livraison est obligatoire." },
      { status: 400 },
    );
  }

  const itemsSubtotal = resolvedItems.some((item) => item.product.priceFrom === null)
    ? null
    : resolvedItems.reduce(
        (sum, item) => sum + Number(item.product.priceFrom || 0) * item.quantity,
        0,
      );

  if (
    deliveryZone?.minimumOrderAmount !== null &&
    deliveryZone?.minimumOrderAmount !== undefined &&
    itemsSubtotal !== null &&
    itemsSubtotal < deliveryZone.minimumOrderAmount
  ) {
    return NextResponse.json(
      {
        message: `Le minimum de commande pour cette zone est de ${deliveryZone.minimumOrderAmount} EUR hors frais de livraison.`,
      },
      { status: 400 },
    );
  }

  const estimatedTotal =
    itemsSubtotal === null
      ? null
      : Number((itemsSubtotal + Number(deliveryZone?.deliveryFee || 0)).toFixed(2));

  const orderNumber = buildOrderNumber();

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: parsed.data.customerName,
      customer_email: parsed.data.customerEmail,
      customer_phone: parsed.data.customerPhone,
      delivery_mode: parsed.data.deliveryMode,
      delivery_zone_id: deliveryZone?.id || null,
      delivery_address:
        parsed.data.deliveryMode === "delivery"
          ? normalizeOptionalText(parsed.data.deliveryAddress)
          : null,
      pickup_notes:
        parsed.data.deliveryMode === "pickup"
          ? normalizeOptionalText(parsed.data.pickupNotes)
          : null,
      requested_date: parsed.data.requestedDate,
      requested_time_slot: normalizeOptionalText(parsed.data.requestedTimeSlot),
      notes: normalizeOptionalText(parsed.data.notes),
      status: "pending",
      estimated_total: estimatedTotal,
      payment_mode: "manual",
      payment_status: "not_requested",
    })
    .select("id, order_number")
    .single();

  if (orderError || !orderRow) {
    return NextResponse.json(
      { message: orderError?.message || "Impossible de creer la commande." },
      { status: 500 },
    );
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    resolvedItems.map((item) => ({
      order_id: orderRow.id,
      product_id: uuidPattern.test(item.product.id) ? item.product.id : null,
      product_name_snapshot: item.product.name,
      category_snapshot: item.product.category,
      unit_price_snapshot: item.product.priceFrom,
      quantity: item.quantity,
      item_notes: null,
    })),
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", orderRow.id);

    return NextResponse.json(
      { message: itemsError.message || "Impossible d'enregistrer les produits." },
      { status: 500 },
    );
  }

  await admin.from("order_events").insert({
    order_id: orderRow.id,
    actor_user_id: null,
    actor_name_snapshot: parsed.data.customerName,
    event_type: "customer_submitted",
    notes: "Commande envoyee depuis le formulaire client.",
    metadata: {
      delivery_mode: parsed.data.deliveryMode,
      items_count: resolvedItems.length,
      requested_date: parsed.data.requestedDate,
    },
  });

  return NextResponse.json({
    success: true,
    orderNumber: orderRow.order_number,
  });
}
