import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationChannel = "email" | "sms";
export type NotificationLogStatus = "queued" | "sent" | "delivered" | "failed";
export type NotificationTemplateCode =
  | "order_confirmation"
  | "order_reviewing"
  | "order_accepted"
  | "order_awaiting_payment"
  | "order_paid"
  | "order_in_preparation"
  | "order_ready"
  | "order_completed"
  | "order_refused"
  | "order_cancelled"
  | "information_requested";

export type NotificationActor = {
  userId: string | null;
  name: string | null;
};

export type OrderNotificationOrderLike = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryMode: "delivery" | "pickup";
  deliveryAddress: string | null;
  pickupNotes: string | null;
  requestedDate: string;
  requestedTimeSlot: string | null;
  status: string;
  estimatedTotal: number | null;
  finalTotal: number | null;
  refusalReason: string | null;
  paymentLink: string | null;
  paymentDeadline: string | null;
};

export type InformationRequestNotificationLike = {
  id: string;
  preferredChannel: NotificationChannel;
  subject: string;
  message: string;
};

export type NotificationDraft = {
  channel: NotificationChannel;
  recipient: string;
  templateCode: NotificationTemplateCode;
  subject: string;
  body: string;
  payload: Record<string, unknown>;
};

type NotificationBatchInput = {
  admin: SupabaseClient;
  orderId: string;
  actor: NotificationActor;
  trigger: "order_created" | "order_status_changed" | "information_requested";
  notifications: NotificationDraft[];
  metadata?: Record<string, unknown>;
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
});

function formatPrice(value: number | null) {
  if (value === null) return "sur devis";
  return currencyFormatter.format(value);
}

function formatRequestedMoment(order: OrderNotificationOrderLike) {
  const formattedDate = dateFormatter.format(new Date(order.requestedDate));
  return order.requestedTimeSlot
    ? `${formattedDate} (${order.requestedTimeSlot})`
    : formattedDate;
}

function formatDeliveryLabel(order: OrderNotificationOrderLike) {
  if (order.deliveryMode === "delivery") {
    return order.deliveryAddress
      ? `en livraison a l'adresse ${order.deliveryAddress}`
      : "en livraison";
  }

  return order.pickupNotes
    ? `en retrait (${order.pickupNotes})`
    : "en retrait a l'atelier";
}

function getDisplayedTotal(order: OrderNotificationOrderLike) {
  return order.finalTotal ?? order.estimatedTotal;
}

function cleanPhoneNumber(value: string) {
  return value.trim();
}

function buildNotificationPayload(
  order: OrderNotificationOrderLike,
  subject: string,
  body: string,
  extraPayload: Record<string, unknown> = {},
) {
  return {
    order_number: order.orderNumber,
    customer_name: order.customerName,
    order_status: order.status,
    requested_date: order.requestedDate,
    requested_time_slot: order.requestedTimeSlot,
    delivery_mode: order.deliveryMode,
    delivery_address: order.deliveryAddress,
    pickup_notes: order.pickupNotes,
    total_amount: getDisplayedTotal(order),
    subject,
    body,
    ...extraPayload,
  };
}

function createEmailDraft(
  order: OrderNotificationOrderLike,
  templateCode: NotificationTemplateCode,
  subject: string,
  body: string,
  extraPayload: Record<string, unknown> = {},
) {
  if (!order.customerEmail) return null;

  return {
    channel: "email" as const,
    recipient: order.customerEmail,
    templateCode,
    subject,
    body,
    payload: buildNotificationPayload(order, subject, body, extraPayload),
  };
}

function createSmsDraft(
  order: OrderNotificationOrderLike,
  templateCode: NotificationTemplateCode,
  body: string,
  extraPayload: Record<string, unknown> = {},
) {
  const recipient = cleanPhoneNumber(order.customerPhone);
  if (!recipient) return null;

  return {
    channel: "sms" as const,
    recipient,
    templateCode,
    subject: "",
    body,
    payload: buildNotificationPayload(order, "", body, extraPayload),
  };
}

function compact<T>(values: Array<T | null>) {
  return values.filter((value): value is T => value !== null);
}

export function getNotificationTemplateLabel(templateCode: NotificationTemplateCode) {
  switch (templateCode) {
    case "order_confirmation":
      return "Confirmation client";
    case "order_reviewing":
      return "Commande en analyse";
    case "order_accepted":
      return "Commande acceptee";
    case "order_awaiting_payment":
      return "Paiement demande";
    case "order_paid":
      return "Paiement confirme";
    case "order_in_preparation":
      return "Commande en preparation";
    case "order_ready":
      return "Commande prete";
    case "order_completed":
      return "Commande terminee";
    case "order_refused":
      return "Commande refusee";
    case "order_cancelled":
      return "Commande annulee";
    case "information_requested":
      return "Complement demande";
    default:
      return "Notification client";
  }
}

export function getNotificationStatusLabel(status: NotificationLogStatus) {
  switch (status) {
    case "sent":
      return "Envoyee";
    case "delivered":
      return "Distribuee";
    case "failed":
      return "En echec";
    default:
      return "En attente";
  }
}

export function buildOrderSubmittedNotifications(order: OrderNotificationOrderLike) {
  const requestedMoment = formatRequestedMoment(order);
  const deliveryLabel = formatDeliveryLabel(order);
  const totalLabel = formatPrice(getDisplayedTotal(order));

  const emailBody = [
    `Bonjour ${order.customerName},`,
    "",
    `Nous avons bien recu votre demande de devis ${order.orderNumber} pour le ${requestedMoment}, ${deliveryLabel}.`,
    `Montant actuel indicatif : ${totalLabel}.`,
    "",
    "Notre equipe va maintenant verifier les details de votre demande avant de vous envoyer la suite.",
    "Aucun paiement n'est demande a cette etape.",
    "",
    "Maison Waret",
  ].join("\n");

  const smsBody = [
    `Maison Waret : demande de devis ${order.orderNumber} bien recue.`,
    `Date demandee : ${requestedMoment}.`,
    "Nous revenons vers vous rapidement avant tout paiement.",
  ].join(" ");

  return compact([
    createEmailDraft(
      order,
      "order_confirmation",
      `Maison Waret - Confirmation de votre demande ${order.orderNumber}`,
      emailBody,
    ),
    createSmsDraft(order, "order_confirmation", smsBody),
  ]);
}

export function buildOrderStatusNotifications(order: OrderNotificationOrderLike) {
  const requestedMoment = formatRequestedMoment(order);
  const deliveryLabel = formatDeliveryLabel(order);
  const totalLabel = formatPrice(getDisplayedTotal(order));
  const paymentLinkLabel = order.paymentLink || "Le lien de paiement vous sera communique par l'equipe.";
  const paymentDeadlineLabel = order.paymentDeadline
    ? `Echeance : ${new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.paymentDeadline))}.`
    : "";

  switch (order.status) {
    case "reviewing": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre commande ${order.orderNumber} est maintenant en cours d'analyse chez Maison Waret.`,
        `Date souhaitee : ${requestedMoment}.`,
        "",
        "Si nous avons besoin d'une precision, nous reviendrons vers vous rapidement.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : votre commande ${order.orderNumber} est en cours d'analyse. Nous revenons vers vous rapidement si besoin.`;

      return compact([
        createEmailDraft(
          order,
          "order_reviewing",
          `Maison Waret - Votre commande ${order.orderNumber} est en analyse`,
          emailBody,
        ),
        createSmsDraft(order, "order_reviewing", smsBody),
      ]);
    }
    case "accepted": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Bonne nouvelle : votre demande ${order.orderNumber} a ete acceptee.`,
        `Date retenue : ${requestedMoment}, ${deliveryLabel}.`,
        `Montant retenu : ${totalLabel}.`,
        "",
        "Nous vous enverrons la suite des etapes tres bientot pour finaliser votre accord.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : bonne nouvelle, votre demande ${order.orderNumber} est acceptee. Montant retenu : ${totalLabel}.`;

      return compact([
        createEmailDraft(
          order,
          "order_accepted",
          `Maison Waret - Commande acceptee ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_accepted", smsBody),
      ]);
    }
    case "awaiting_payment": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre devis ${order.orderNumber} est valide et attend maintenant votre accord par paiement.`,
        `Montant a regler si cela vous convient : ${totalLabel}.`,
        paymentDeadlineLabel,
        "",
        `Paiement : ${paymentLinkLabel}`,
        "",
        "Dites-nous si vous avez besoin d'aide avant de finaliser le reglement.",
        "",
        "Maison Waret",
      ]
        .filter(Boolean)
        .join("\n");

      const smsBody = [
        `Maison Waret : votre devis ${order.orderNumber} est pret.`,
        `Montant a regler si accord : ${totalLabel}.`,
        order.paymentLink ? `Lien : ${order.paymentLink}` : "Le lien arrive via l'equipe.",
      ].join(" ");

      return compact([
        createEmailDraft(
          order,
          "order_awaiting_payment",
          `Maison Waret - Paiement attendu pour ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_awaiting_payment", smsBody),
      ]);
    }
    case "paid": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Nous confirmons la bonne reception du paiement pour votre commande ${order.orderNumber}.`,
        `Montant regle : ${totalLabel}.`,
        "",
        "Notre equipe passe maintenant a la preparation.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : paiement bien recu pour la commande ${order.orderNumber}. Merci, nous passons a la preparation.`;

      return compact([
        createEmailDraft(
          order,
          "order_paid",
          `Maison Waret - Paiement confirme pour ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_paid", smsBody),
      ]);
    }
    case "in_preparation": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre commande ${order.orderNumber} est en preparation chez Maison Waret.`,
        `Date prevue : ${requestedMoment}.`,
        "",
        "Nous vous prevenons des qu'elle est prete.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : votre commande ${order.orderNumber} est en preparation. Nous vous prevenons des qu'elle est prete.`;

      return compact([
        createEmailDraft(
          order,
          "order_in_preparation",
          `Maison Waret - Commande en preparation ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_in_preparation", smsBody),
      ]);
    }
    case "ready": {
      const readyLabel =
        order.deliveryMode === "delivery"
          ? "Elle est prete a partir en livraison."
          : "Elle est prete pour votre retrait.";

      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre commande ${order.orderNumber} est prete.`,
        readyLabel,
        `Rappel : ${requestedMoment}, ${deliveryLabel}.`,
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : votre commande ${order.orderNumber} est prete. ${readyLabel}`;

      return compact([
        createEmailDraft(
          order,
          "order_ready",
          `Maison Waret - Votre commande ${order.orderNumber} est prete`,
          emailBody,
        ),
        createSmsDraft(order, "order_ready", smsBody),
      ]);
    }
    case "completed": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre commande ${order.orderNumber} est maintenant terminee.`,
        "Merci d'avoir fait confiance a Maison Waret.",
        "",
        "Au plaisir de vous regaler a nouveau,",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : votre commande ${order.orderNumber} est terminee. Merci pour votre confiance.`;

      return compact([
        createEmailDraft(
          order,
          "order_completed",
          `Maison Waret - Merci pour votre commande ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_completed", smsBody),
      ]);
    }
    case "refused": {
      const refusalReason = order.refusalReason || "Merci de nous recontacter si vous souhaitez une autre proposition.";
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Nous sommes desoles, mais votre commande ${order.orderNumber} ne peut pas etre validee dans sa forme actuelle.`,
        `Motif : ${refusalReason}`,
        "",
        "Nous restons disponibles pour etudier une autre solution avec vous.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : commande ${order.orderNumber} non retenue. Motif : ${refusalReason}`;

      return compact([
        createEmailDraft(
          order,
          "order_refused",
          `Maison Waret - Commande non retenue ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_refused", smsBody),
      ]);
    }
    case "cancelled": {
      const emailBody = [
        `Bonjour ${order.customerName},`,
        "",
        `Votre commande ${order.orderNumber} a ete annulee.`,
        "Si besoin, nous pouvons vous accompagner pour repartir sur une nouvelle demande.",
        "",
        "Maison Waret",
      ].join("\n");

      const smsBody = `Maison Waret : votre commande ${order.orderNumber} a ete annulee. Nous restons disponibles si besoin.`;

      return compact([
        createEmailDraft(
          order,
          "order_cancelled",
          `Maison Waret - Commande annulee ${order.orderNumber}`,
          emailBody,
        ),
        createSmsDraft(order, "order_cancelled", smsBody),
      ]);
    }
    default:
      return [];
  }
}

export function buildInformationRequestNotification(
  order: OrderNotificationOrderLike,
  request: InformationRequestNotificationLike,
) {
  const body = [
    `Bonjour ${order.customerName},`,
    "",
    `Nous avons besoin d'une precision pour finaliser votre commande ${order.orderNumber}.`,
    "",
    request.message,
    "",
    "Merci pour votre retour,",
    "Maison Waret",
  ].join("\n");

  const smsBody = `Maison Waret : nous avons besoin d'une precision pour la commande ${order.orderNumber}. ${request.message}`;

  if (request.preferredChannel === "sms") {
    return compact([
      createSmsDraft(order, "information_requested", smsBody, {
        request_id: request.id,
        request_subject: request.subject,
      }),
    ]);
  }

  return compact([
    createEmailDraft(
      order,
      "information_requested",
      `Maison Waret - Complement demande pour ${order.orderNumber} : ${request.subject}`,
      body,
      {
        request_id: request.id,
        request_subject: request.subject,
      },
    ),
  ]);
}

export async function recordNotificationBatch({
  admin,
  orderId,
  actor,
  trigger,
  notifications,
  metadata = {},
}: NotificationBatchInput) {
  if (notifications.length === 0) {
    return {
      queuedCount: 0,
      warning: null as string | null,
    };
  }

  const { error: logError } = await admin.from("notification_logs").insert(
    notifications.map((notification) => ({
      order_id: orderId,
      channel: notification.channel,
      recipient: notification.recipient,
      template_code: notification.templateCode,
      provider: null,
      provider_message_id: null,
      status: "queued",
      payload: notification.payload,
    })),
  );

  if (logError) {
    return {
      queuedCount: 0,
      warning: logError.message,
    };
  }

  const channelsLabel = Array.from(new Set(notifications.map((notification) => notification.channel)))
    .map((channel) => (channel === "email" ? "email" : "SMS"))
    .join(" et ");

  const { error: eventError } = await admin.from("order_events").insert({
    order_id: orderId,
    actor_user_id: actor.userId,
    actor_name_snapshot: actor.name,
    event_type: "notification_queued",
    notes: `${notifications.length} notification(s) preparee(s) pour le client via ${channelsLabel}.`,
    metadata: {
      trigger,
      notifications: notifications.map((notification) => ({
        channel: notification.channel,
        recipient: notification.recipient,
        template_code: notification.templateCode,
      })),
      ...metadata,
    },
  });

  return {
    queuedCount: notifications.length,
    warning: eventError ? eventError.message : null,
  };
}
