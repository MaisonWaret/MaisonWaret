import { NextResponse } from "next/server";
import { z } from "zod";

import type { AppUserRecord } from "@/lib/app-users";
import { ADMIN_ORDER_STATUSES } from "@/lib/admin-dashboard";
import {
  buildOrderStatusNotifications,
  recordNotificationBatch,
  type OrderNotificationOrderLike,
} from "@/lib/order-notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateOrderSchema = z
  .object({
    status: z.enum(ADMIN_ORDER_STATUSES).optional(),
    assignedTo: z.union([z.string().uuid(), z.null()]).optional(),
    archived: z.boolean().optional(),
    finalTotal: z.union([z.coerce.number().min(0).max(100000), z.null()]).optional(),
    refusalReason: z.union([z.string().trim().max(2000), z.null()]).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune modification transmise.",
  });

async function requireActiveStaff() {
  const serverClient = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!serverClient || !admin) {
    return { error: NextResponse.json({ message: "Supabase non configure." }, { status: 503 }) };
  }

  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ message: "Session invalide." }, { status: 401 }) };
  }

  const { data: appUser, error: appUserError } = await admin
    .from("app_users")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();

  if (appUserError || !appUser || !appUser.active) {
    return { error: NextResponse.json({ message: "Acces refuse." }, { status: 403 }) };
  }

  return {
    admin,
    currentUser: appUser as Pick<AppUserRecord, "id" | "full_name" | "role" | "active">,
  };
}

function areNumbersEqual(a: number | null, b: number | null) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Number(a) === Number(b);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireActiveStaff();
  if ("error" in guard) {
    return guard.error;
  }

  const parsed = updateOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Payload invalide." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const { admin, currentUser } = guard;

  const { data: existingOrder, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, delivery_mode, delivery_address, pickup_notes, requested_date, requested_time_slot, status, estimated_total, archived, final_total, refusal_reason, accepted_by, refused_by, assigned_to, payment_link, payment_deadline",
    )
    .eq("id", id)
    .single();

  if (orderError || !existingOrder) {
    return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
  }

  if (parsed.data.assignedTo) {
    const { data: assignee, error: assigneeError } = await admin
      .from("app_users")
      .select("id, active")
      .eq("id", parsed.data.assignedTo)
      .single();

    if (assigneeError || !assignee || !assignee.active) {
      return NextResponse.json(
        { message: "Le membre d'equipe selectionne est introuvable ou inactif." },
        { status: 400 },
      );
    }
  }

  const updates: Record<string, unknown> = {};
  const changeNotes: string[] = [];
  const metadata: Record<string, unknown> = {};

  if (parsed.data.status && parsed.data.status !== existingOrder.status) {
    updates.status = parsed.data.status;
    metadata.status = {
      before: existingOrder.status,
      after: parsed.data.status,
    };
    changeNotes.push(`Statut : ${existingOrder.status} -> ${parsed.data.status}`);

    if (
      ["accepted", "awaiting_payment", "paid", "in_preparation", "ready", "completed"].includes(
        parsed.data.status,
      )
    ) {
      updates.accepted_by = currentUser.id;
    }

    if (parsed.data.status === "refused") {
      updates.refused_by = currentUser.id;
    }
  }

  if (
    parsed.data.assignedTo !== undefined &&
    parsed.data.assignedTo !== existingOrder.assigned_to
  ) {
    updates.assigned_to = parsed.data.assignedTo;
    metadata.assigned_to = {
      before: existingOrder.assigned_to,
      after: parsed.data.assignedTo,
    };
    changeNotes.push("Assignation mise a jour.");
  }

  if (
    parsed.data.archived !== undefined &&
    parsed.data.archived !== existingOrder.archived
  ) {
    updates.archived = parsed.data.archived;
    metadata.archived = {
      before: existingOrder.archived,
      after: parsed.data.archived,
    };
    changeNotes.push(parsed.data.archived ? "Commande archivee." : "Commande reactivee.");
  }

  if (parsed.data.finalTotal !== undefined) {
    const incomingFinalTotal = parsed.data.finalTotal;
    const currentFinalTotal =
      existingOrder.final_total === null ? null : Number(existingOrder.final_total);

    if (!areNumbersEqual(incomingFinalTotal, currentFinalTotal)) {
      updates.final_total = incomingFinalTotal;
      metadata.final_total = {
        before: currentFinalTotal,
        after: incomingFinalTotal,
      };
      changeNotes.push("Total final mis a jour.");
    }
  }

  if (parsed.data.refusalReason !== undefined) {
    const normalizedReason = parsed.data.refusalReason?.trim() || null;
    if (normalizedReason !== existingOrder.refusal_reason) {
      updates.refusal_reason = normalizedReason;
      metadata.refusal_reason = {
        before: existingOrder.refusal_reason,
        after: normalizedReason,
      };
      changeNotes.push(
        normalizedReason ? "Motif de refus renseigne." : "Motif de refus retire.",
      );
    }
  }

  const nextStatus =
    (updates.status as string | undefined) || (existingOrder.status as string);
  const nextRefusalReason =
    (updates.refusal_reason as string | null | undefined) ?? existingOrder.refusal_reason;

  if (nextStatus === "refused" && !nextRefusalReason) {
    return NextResponse.json(
      { message: "Merci de preciser un motif avant de refuser la commande." },
      { status: 400 },
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, noChange: true });
  }

  const { error: updateError } = await admin.from("orders").update(updates).eq("id", id);
  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  let notificationWarning: string | null = null;

  if (typeof updates.status === "string") {
    const notificationOrder: OrderNotificationOrderLike = {
      id: existingOrder.id,
      orderNumber: existingOrder.order_number,
      customerName: existingOrder.customer_name,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      deliveryMode: existingOrder.delivery_mode,
      deliveryAddress: existingOrder.delivery_address,
      pickupNotes: existingOrder.pickup_notes,
      requestedDate: existingOrder.requested_date,
      requestedTimeSlot: existingOrder.requested_time_slot,
      status: updates.status,
      estimatedTotal:
        existingOrder.estimated_total === null ? null : Number(existingOrder.estimated_total),
      finalTotal:
        updates.final_total === undefined
          ? existingOrder.final_total === null
            ? null
            : Number(existingOrder.final_total)
          : typeof updates.final_total === "number"
            ? updates.final_total
            : null,
      refusalReason:
        updates.refusal_reason === undefined
          ? existingOrder.refusal_reason
          : typeof updates.refusal_reason === "string"
            ? updates.refusal_reason
            : null,
      paymentLink: existingOrder.payment_link,
      paymentDeadline: existingOrder.payment_deadline,
    };

    const notificationBatch = await recordNotificationBatch({
      admin,
      orderId: id,
      actor: {
        userId: currentUser.id,
        name: currentUser.full_name,
      },
      trigger: "order_status_changed",
      notifications: buildOrderStatusNotifications(notificationOrder),
      metadata: {
        order_number: existingOrder.order_number,
        status: notificationOrder.status,
      },
    });

    notificationWarning = notificationBatch.warning;
  }

  await admin.from("order_events").insert({
    order_id: id,
    actor_user_id: currentUser.id,
    actor_name_snapshot: currentUser.full_name,
    event_type: "order_updated",
    notes: changeNotes.join(" "),
    metadata,
  });

  return NextResponse.json({
    success: true,
    message: notificationWarning
      ? `Commande ${existingOrder.order_number} mise a jour. Le journal des notifications n'a pas pu etre complete.`
      : `Commande ${existingOrder.order_number} mise a jour.`,
  });
}
