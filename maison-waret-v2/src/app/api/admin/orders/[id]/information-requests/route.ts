import { NextResponse } from "next/server";
import { z } from "zod";

import type { AppUserRecord, AppUserRole } from "@/lib/app-users";
import {
  buildInformationRequestNotification,
  recordNotificationBatch,
  type OrderNotificationOrderLike,
} from "@/lib/order-notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createInformationRequestSchema = z.object({
  preferredChannel: z.enum(["email", "sms"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(3000),
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireActiveStaff();
  if ("error" in guard) {
    return guard.error;
  }

  const parsed = createInformationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message ||
          "Informations invalides pour envoyer une demande de complement.",
      },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const { admin, currentUser } = guard;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, delivery_mode, delivery_address, pickup_notes, requested_date, requested_time_slot, status, estimated_total, final_total, refusal_reason, payment_link, payment_deadline",
    )
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
  }

  const { data: informationRequest, error: requestError } = await admin
    .from("order_information_requests")
    .insert({
      order_id: id,
      created_by: currentUser.id,
      created_by_name_snapshot: currentUser.full_name,
      created_by_role_snapshot: currentUser.role as AppUserRole,
      preferred_channel: parsed.data.preferredChannel,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "waiting",
    })
    .select("id")
    .single();

  if (requestError || !informationRequest) {
    return NextResponse.json(
      { message: requestError?.message || "Impossible de creer la demande." },
      { status: 400 },
    );
  }

  const orderUpdates: Record<string, unknown> = {};
  if (order.status === "pending") {
    orderUpdates.status = "reviewing";
  }

  if (Object.keys(orderUpdates).length > 0) {
    await admin.from("orders").update(orderUpdates).eq("id", id);
  }

  await admin.from("order_events").insert({
    order_id: id,
    actor_user_id: currentUser.id,
    actor_name_snapshot: currentUser.full_name,
    event_type: "information_requested",
    notes: `Complement demande au client par ${parsed.data.preferredChannel}.`,
    metadata: {
      preferred_channel: parsed.data.preferredChannel,
      subject: parsed.data.subject,
      request_id: informationRequest.id,
    },
  });

  const notificationOrder: OrderNotificationOrderLike = {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    deliveryMode: order.delivery_mode,
    deliveryAddress: order.delivery_address,
    pickupNotes: order.pickup_notes,
    requestedDate: order.requested_date,
    requestedTimeSlot: order.requested_time_slot,
    status:
      Object.keys(orderUpdates).length > 0 && typeof orderUpdates.status === "string"
        ? orderUpdates.status
        : order.status,
    estimatedTotal: order.estimated_total === null ? null : Number(order.estimated_total),
    finalTotal: order.final_total === null ? null : Number(order.final_total),
    refusalReason: order.refusal_reason,
    paymentLink: order.payment_link,
    paymentDeadline: order.payment_deadline,
  };

  const notificationBatch = await recordNotificationBatch({
    admin,
    orderId: id,
    actor: {
      userId: currentUser.id,
      name: currentUser.full_name,
    },
    trigger: "information_requested",
    notifications: buildInformationRequestNotification(notificationOrder, {
      id: informationRequest.id,
      preferredChannel: parsed.data.preferredChannel,
      subject: parsed.data.subject,
      message: parsed.data.message,
    }),
    metadata: {
      order_number: order.order_number,
      request_id: informationRequest.id,
      preferred_channel: parsed.data.preferredChannel,
    },
  });

  return NextResponse.json({
    success: true,
    message: notificationBatch.warning
      ? `Demande de complement creee pour ${order.order_number}, mais le journal de notification n'a pas pu etre complete.`
      : `Demande de complement creee pour ${order.order_number}.`,
  });
}
