import type { AppUserRecord, AppUserRole } from "@/lib/app-users";
import type {
  NotificationChannel,
  NotificationLogStatus,
  NotificationTemplateCode,
} from "@/lib/order-notifications";

export type AdminOrderStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "refused"
  | "awaiting_payment"
  | "paid"
  | "in_preparation"
  | "ready"
  | "completed"
  | "cancelled";

export type AdminResponseChannel = "email" | "sms";

export type AdminOrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  category: string | null;
  unitPrice: number | null;
  quantity: number;
  notes: string | null;
};

export type AdminOrderInformationReply = {
  id: string;
  requestId: string;
  orderId: string;
  channel: AdminResponseChannel;
  summary: string;
  fullMessage: string;
  repliedByCustomerName: string | null;
  createdAt: string;
};

export type AdminOrderInformationRequest = {
  id: string;
  orderId: string;
  createdByUserId: string | null;
  createdByName: string;
  createdByRole: AppUserRole | null;
  preferredChannel: AdminResponseChannel;
  subject: string;
  message: string;
  status: "waiting" | "answered" | "closed";
  createdAt: string;
  updatedAt: string;
  replies: AdminOrderInformationReply[];
};

export type AdminOrderEvent = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  actorUserId: string | null;
  actorName: string | null;
  eventType: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminNotificationLog = {
  id: string;
  orderId: string | null;
  channel: NotificationChannel;
  recipient: string;
  templateCode: NotificationTemplateCode;
  provider: string | null;
  providerMessageId: string | null;
  status: NotificationLogStatus;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AdminClientReview = {
  id: string;
  orderId: string | null;
  authorName: string;
  city: string | null;
  title: string | null;
  message: string;
  occasion: string | null;
  rating: number;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
};

export type AdminOrderRecord = {
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
  status: AdminOrderStatus;
  estimatedTotal: number | null;
  finalTotal: number | null;
  refusalReason: string | null;
  archived: boolean;
  paymentMode: string;
  paymentStatus: string;
  paymentLink: string | null;
  paymentDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  acceptedByUserId: string | null;
  acceptedByName: string | null;
  refusedByUserId: string | null;
  refusedByName: string | null;
  notes: string | null;
  items: AdminOrderItem[];
  informationRequests: AdminOrderInformationRequest[];
  events: AdminOrderEvent[];
  notifications: AdminNotificationLog[];
};

export type AdminDashboardData = {
  currentUser: AppUserRecord;
  sessionEmail: string;
  users: AppUserRecord[];
  orders: AdminOrderRecord[];
  recentEvents: AdminOrderEvent[];
  reviews: AdminClientReview[];
  reviewsFeatureEnabled: boolean;
};

export type AdminOrderUpdateInput = {
  status?: AdminOrderStatus;
  assignedTo?: string | null;
  archived?: boolean;
  finalTotal?: number | null;
  refusalReason?: string | null;
};

export type AdminCreateInformationRequestInput = {
  preferredChannel: AdminResponseChannel;
  subject: string;
  message: string;
};

export const ADMIN_ORDER_STATUSES: AdminOrderStatus[] = [
  "pending",
  "reviewing",
  "accepted",
  "awaiting_payment",
  "paid",
  "in_preparation",
  "ready",
  "completed",
  "refused",
  "cancelled",
];

export function formatAdminPrice(value: number | null) {
  if (value === null) return "Sur devis";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminOrderStatusLabel(status: AdminOrderStatus) {
  switch (status) {
    case "reviewing":
      return "En analyse";
    case "accepted":
      return "Acceptee";
    case "refused":
      return "Refusee";
    case "awaiting_payment":
      return "Paiement en attente";
    case "paid":
      return "Payee";
    case "in_preparation":
      return "En preparation";
    case "ready":
      return "Prete";
    case "completed":
      return "Terminee";
    case "cancelled":
      return "Annulee";
    default:
      return "En attente";
  }
}

export function getAdminResponseChannelLabel(channel: AdminResponseChannel) {
  return channel === "email" ? "Email" : "SMS";
}

export function getDeliveryModeLabel(mode: "delivery" | "pickup") {
  return mode === "delivery" ? "Livraison" : "Retrait";
}

export function getAdminEventLabel(eventType: string) {
  switch (eventType) {
    case "customer_submitted":
      return "Commande envoyee";
    case "order_updated":
      return "Commande mise a jour";
    case "information_requested":
      return "Complement demande";
    case "information_received":
      return "Reponse client recue";
    case "notification_queued":
      return "Notification preparee";
    default:
      return "Evenement";
  }
}
