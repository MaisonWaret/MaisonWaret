import { NextResponse } from "next/server";

import type { AppUserRecord, AppUserRole } from "@/lib/app-users";
import type {
  AdminClientReview,
  AdminDashboardData,
  AdminNotificationLog,
  AdminOrderEvent,
  AdminOrderInformationReply,
  AdminOrderInformationRequest,
  AdminOrderItem,
  AdminOrderRecord,
} from "@/lib/admin-dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("*")
    .eq("id", user.id)
    .single();

  if (appUserError || !appUser || !appUser.active) {
    return { error: NextResponse.json({ message: "Acces refuse." }, { status: 403 }) };
  }

  return {
    admin,
    currentUser: appUser as AppUserRecord,
    sessionEmail: user.email || "",
  };
}

function toOptionalNumber(value: number | string | null) {
  if (value === null) return null;
  return Number(value);
}

function isMissingCustomerReviewsRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.toLowerCase().includes("customer_reviews") === true
  );
}

export async function GET() {
  const guard = await requireActiveStaff();
  if ("error" in guard) {
    return guard.error;
  }

  const { admin, currentUser, sessionEmail } = guard;

  const [
    { data: userRows, error: userError },
    { data: orderRows, error: orderError },
    { data: itemRows, error: itemError },
    { data: requestRows, error: requestError },
    { data: replyRows, error: replyError },
    { data: eventRows, error: eventError },
    { data: notificationRows, error: notificationError },
  ] = await Promise.all([
    admin.from("app_users").select("*").order("created_at", { ascending: true }),
    admin.from("orders").select("*").order("created_at", { ascending: false }),
    admin.from("order_items").select("*").order("created_at", { ascending: true }),
    admin
      .from("order_information_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("order_information_replies")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.from("order_events").select("*").order("created_at", { ascending: false }).limit(100),
    admin
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  if (
    userError ||
    orderError ||
    itemError ||
    requestError ||
    replyError ||
    eventError ||
    notificationError
  ) {
    return NextResponse.json(
      {
        message:
          userError?.message ||
          orderError?.message ||
          itemError?.message ||
          requestError?.message ||
          replyError?.message ||
          eventError?.message ||
          notificationError?.message ||
          "Impossible de charger le dashboard admin.",
      },
      { status: 500 },
    );
  }

  const { data: reviewRows, error: reviewError } = await admin
    .from("customer_reviews")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  if (reviewError && !isMissingCustomerReviewsRelation(reviewError)) {
    return NextResponse.json(
      {
        message: reviewError.message || "Impossible de charger les avis clients du dashboard.",
      },
      { status: 500 },
    );
  }

  const users = (userRows || []) as AppUserRecord[];
  const usersById = new Map(users.map((user) => [user.id, user]));

  const itemsByOrderId = new Map<string, AdminOrderItem[]>();
  for (const row of itemRows || []) {
    const item: AdminOrderItem = {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name_snapshot,
      category: row.category_snapshot,
      unitPrice: toOptionalNumber(row.unit_price_snapshot),
      quantity: row.quantity,
      notes: row.item_notes,
    };

    const currentItems = itemsByOrderId.get(row.order_id) || [];
    currentItems.push(item);
    itemsByOrderId.set(row.order_id, currentItems);
  }

  const repliesByRequestId = new Map<string, AdminOrderInformationReply[]>();
  for (const row of replyRows || []) {
    const reply: AdminOrderInformationReply = {
      id: row.id,
      requestId: row.information_request_id,
      orderId: row.order_id,
      channel: row.channel,
      summary: row.summary,
      fullMessage: row.full_message,
      repliedByCustomerName: row.replied_by_customer_name,
      createdAt: row.created_at,
    };

    const currentReplies = repliesByRequestId.get(row.information_request_id) || [];
    currentReplies.push(reply);
    repliesByRequestId.set(row.information_request_id, currentReplies);
  }

  const requestsByOrderId = new Map<string, AdminOrderInformationRequest[]>();
  for (const row of requestRows || []) {
    const createdByUser =
      row.created_by && typeof row.created_by === "string" ? usersById.get(row.created_by) : null;
    const replies = repliesByRequestId.get(row.id) || [];
    const request: AdminOrderInformationRequest = {
      id: row.id,
      orderId: row.order_id,
      createdByUserId: row.created_by,
      createdByName:
        row.created_by_name_snapshot ||
        createdByUser?.full_name ||
        "Equipe Maison Waret",
      createdByRole:
        ((row.created_by_role_snapshot as AppUserRole | null) || createdByUser?.role || null),
      preferredChannel: row.preferred_channel,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      replies: replies.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };

    const currentRequests = requestsByOrderId.get(row.order_id) || [];
    currentRequests.push(request);
    requestsByOrderId.set(row.order_id, currentRequests);
  }

  const orderNumberById = new Map<string, string>();
  const customerNameByOrderId = new Map<string, string>();
  for (const row of orderRows || []) {
    orderNumberById.set(row.id, row.order_number);
    customerNameByOrderId.set(row.id, row.customer_name);
  }

  const recentEvents: AdminOrderEvent[] = (eventRows || []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderNumber: orderNumberById.get(row.order_id) || "Commande",
    customerName: customerNameByOrderId.get(row.order_id) || "Client",
    actorUserId: row.actor_user_id,
    actorName:
      row.actor_name_snapshot ||
      (row.actor_user_id && typeof row.actor_user_id === "string"
        ? usersById.get(row.actor_user_id)?.full_name || null
        : null),
    eventType: row.event_type,
    notes: row.notes,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  }));

  const eventsByOrderId = new Map<string, AdminOrderEvent[]>();
  for (const event of recentEvents) {
    const currentEvents = eventsByOrderId.get(event.orderId) || [];
    currentEvents.push(event);
    eventsByOrderId.set(event.orderId, currentEvents);
  }

  const notificationsByOrderId = new Map<string, AdminNotificationLog[]>();
  for (const row of notificationRows || []) {
    if (!row.order_id || typeof row.order_id !== "string") continue;

    const notification: AdminNotificationLog = {
      id: row.id,
      orderId: row.order_id,
      channel: row.channel,
      recipient: row.recipient,
      templateCode: row.template_code,
      provider: row.provider,
      providerMessageId: row.provider_message_id,
      status: row.status,
      payload:
        row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {},
      createdAt: row.created_at,
    };

    const currentNotifications = notificationsByOrderId.get(row.order_id) || [];
    currentNotifications.push(notification);
    notificationsByOrderId.set(row.order_id, currentNotifications);
  }

  const reviews: AdminClientReview[] = (reviewRows || []).map(
    (row) => ({
      id: row.id,
      orderId: row.order_id ?? null,
      authorName: row.author_name,
      city: row.city,
      title: row.title,
      message: row.message,
      occasion: row.occasion,
      rating: Number(row.rating || 5),
      visible: Boolean(row.visible),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
    }),
  );

  const orders: AdminOrderRecord[] = (orderRows || []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    deliveryMode: row.delivery_mode,
    deliveryAddress: row.delivery_address,
    pickupNotes: row.pickup_notes,
    requestedDate: row.requested_date,
    requestedTimeSlot: row.requested_time_slot,
    status: row.status,
    estimatedTotal: toOptionalNumber(row.estimated_total),
    finalTotal: toOptionalNumber(row.final_total),
    refusalReason: row.refusal_reason,
    archived: row.archived,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    paymentLink: row.payment_link,
    paymentDeadline: row.payment_deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedToUserId: row.assigned_to,
    assignedToName:
      row.assigned_to && typeof row.assigned_to === "string"
        ? usersById.get(row.assigned_to)?.full_name || null
        : null,
    acceptedByUserId: row.accepted_by,
    acceptedByName:
      row.accepted_by && typeof row.accepted_by === "string"
        ? usersById.get(row.accepted_by)?.full_name || null
        : null,
    refusedByUserId: row.refused_by,
    refusedByName:
      row.refused_by && typeof row.refused_by === "string"
        ? usersById.get(row.refused_by)?.full_name || null
        : null,
    notes: row.notes,
    items: itemsByOrderId.get(row.id) || [],
    informationRequests: requestsByOrderId.get(row.id) || [],
    events: eventsByOrderId.get(row.id) || [],
    notifications: notificationsByOrderId.get(row.id) || [],
  }));

  const payload: AdminDashboardData = {
    currentUser,
    sessionEmail,
    users,
    orders,
    recentEvents: recentEvents.slice(0, 12),
    reviews,
    reviewsFeatureEnabled: !reviewError,
  };

  return NextResponse.json(payload);
}
