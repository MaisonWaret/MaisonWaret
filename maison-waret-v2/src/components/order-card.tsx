import { useState } from "react";

import { getAppUserRoleLabel, type AppUserRecord } from "@/lib/app-users";
import {
  ADMIN_ORDER_STATUSES,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminPrice,
  getAdminEventLabel,
  getAdminOrderStatusLabel,
  getAdminResponseChannelLabel,
  getDeliveryModeLabel,
  type AdminCreateInformationRequestInput,
  type AdminOrderRecord,
  type AdminOrderStatus,
  type AdminOrderUpdateInput,
} from "@/lib/admin-dashboard";
import {
  buildOrderStatusNotifications,
  getNotificationStatusLabel,
  getNotificationTemplateLabel,
} from "@/lib/order-notifications";

type OrderCardProps = {
  order: AdminOrderRecord;
  teamMembers: AppUserRecord[];
  onSave: (orderId: string, payload: AdminOrderUpdateInput) => Promise<void>;
  onCreateInformationRequest: (
    orderId: string,
    payload: AdminCreateInformationRequestInput,
  ) => Promise<void>;
  saving: boolean;
  requestSaving: boolean;
  isUnread?: boolean;
  isHighlighted?: boolean;
  canPrepareReview?: boolean;
  hasPreparedReview?: boolean;
  onPrepareReview?: (order: AdminOrderRecord) => void;
};

function buildQuickActions(status: AdminOrderStatus) {
  const actions: Array<{ label: string; status: AdminOrderStatus }> = [];

  if (status !== "reviewing") actions.push({ label: "Passer en analyse", status: "reviewing" });
  if (status !== "accepted") actions.push({ label: "Accepter", status: "accepted" });
  if (status !== "awaiting_payment") {
    actions.push({ label: "Paiement", status: "awaiting_payment" });
  }
  if (status !== "in_preparation") {
    actions.push({ label: "Preparation", status: "in_preparation" });
  }
  if (status !== "ready") actions.push({ label: "Prete", status: "ready" });
  if (status !== "completed") actions.push({ label: "Terminer", status: "completed" });
  if (status !== "refused") actions.push({ label: "Refuser", status: "refused" });

  return actions.slice(0, 6);
}

function readNotificationText(payload: Record<string, unknown>, key: "subject" | "body") {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string) {
  if (!value.trim()) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export function OrderCard({
  order,
  teamMembers,
  onSave,
  onCreateInformationRequest,
  saving,
  requestSaving,
  isUnread = false,
  isHighlighted = false,
  canPrepareReview = false,
  hasPreparedReview = false,
  onPrepareReview,
}: OrderCardProps) {
  const [status, setStatus] = useState<AdminOrderStatus>(order.status);
  const [assignedTo, setAssignedTo] = useState(order.assignedToUserId || "");
  const [finalTotal, setFinalTotal] = useState(
    order.finalTotal === null ? "" : String(order.finalTotal),
  );
  const [paymentLink, setPaymentLink] = useState(order.paymentLink || "");
  const [paymentDeadline, setPaymentDeadline] = useState(toDateTimeLocalValue(order.paymentDeadline));
  const [refusalReason, setRefusalReason] = useState(order.refusalReason || "");
  const [archived, setArchived] = useState(order.archived);
  const [preferredChannel, setPreferredChannel] = useState<"email" | "sms">("email");
  const [requestSubject, setRequestSubject] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const latestReply =
    order.informationRequests
      .flatMap((request) => request.replies)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;

  const quickActions = buildQuickActions(status);
  const statusNotificationPreview = buildOrderStatusNotifications({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryMode: order.deliveryMode,
    deliveryAddress: order.deliveryAddress,
    pickupNotes: order.pickupNotes,
    requestedDate: order.requestedDate,
    requestedTimeSlot: order.requestedTimeSlot,
    status,
    estimatedTotal: order.estimatedTotal,
    finalTotal: finalTotal.trim() ? Number(finalTotal) : order.finalTotal,
    refusalReason: refusalReason.trim() || order.refusalReason,
    paymentLink: paymentLink.trim() || null,
    paymentDeadline: fromDateTimeLocalValue(paymentDeadline),
  });

  function getCurrentPayload(nextStatus?: AdminOrderStatus): AdminOrderUpdateInput {
    const resolvedStatus = nextStatus || status;

    return {
      status: resolvedStatus,
      assignedTo: assignedTo || null,
      archived,
      finalTotal: finalTotal.trim() ? Number(finalTotal) : null,
      paymentLink: paymentLink.trim() || null,
      paymentDeadline: fromDateTimeLocalValue(paymentDeadline),
      refusalReason: resolvedStatus === "refused" ? refusalReason.trim() || null : null,
    };
  }

  async function handleSave() {
    await onSave(order.id, getCurrentPayload());
  }

  async function handleQuickAction(nextStatus: AdminOrderStatus) {
    setStatus(nextStatus);
    await onSave(order.id, getCurrentPayload(nextStatus));
  }

  async function handleSendPaymentRequest() {
    setStatus("awaiting_payment");
    await onSave(order.id, getCurrentPayload("awaiting_payment"));
  }

  async function handleCreateRequest() {
    await onCreateInformationRequest(order.id, {
      preferredChannel,
      subject: requestSubject,
      message: requestMessage,
    });

    setRequestSubject("");
    setRequestMessage("");
    setPreferredChannel("email");
  }

  return (
    <article
      id={`order-card-${order.id}`}
      className={`rounded-[28px] border p-6 shadow-[0_18px_45px_rgba(91,54,35,0.12)] ${
        isHighlighted
          ? "border-[#d7a98d] bg-[#fff8f4] ring-4 ring-[#f4e2d8] transition-all duration-500"
          : isUnread
            ? "border-[#d5e8dc] bg-[#f8fdf9] ring-2 ring-[#d5e8dc]"
            : "border-white/60 bg-white/90"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#f4e2d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              {order.orderNumber}
            </span>
            <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-sm font-medium text-[#6f5b50]">
              {getAdminOrderStatusLabel(order.status)}
            </span>
            {order.archived ? (
              <span className="rounded-full border border-[#ead6c9] bg-[#fff8f4] px-3 py-1 text-sm font-medium text-[#8a4f34]">
                Archivee
              </span>
            ) : null}
            {isUnread ? (
              <span className="rounded-full border border-[#b8dac7] bg-[#eef8f1] px-3 py-1 text-sm font-medium text-[#2f7d55]">
                Nouvelle
              </span>
            ) : null}
            {hasPreparedReview ? (
              <span className="rounded-full border border-[#d7d7ef] bg-[#f5f4ff] px-3 py-1 text-sm font-medium text-[#5a4bb3]">
                Avis prepare
              </span>
            ) : null}
          </div>
          <h3 className="font-serif text-2xl text-[#31231d]">{order.customerName}</h3>
          <p className="text-sm leading-6 text-[#6f5b50]">
            {order.customerEmail} · {order.customerPhone}
          </p>
          <p className="text-sm leading-6 text-[#6f5b50]">
            {getDeliveryModeLabel(order.deliveryMode)} · {formatAdminDate(order.requestedDate)}
            {order.requestedTimeSlot ? ` · ${order.requestedTimeSlot}` : ""}
          </p>
          <p className="text-sm leading-6 text-[#8f786c]">
            Recue le {formatAdminDateTime(order.createdAt)}
          </p>
        </div>
        <div className="rounded-[22px] bg-[#fff7f2] px-5 py-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
            Somme due
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#31231d]">
            {formatAdminPrice(order.finalTotal ?? order.estimatedTotal)}
          </p>
          <p className="mt-2 text-sm text-[#6f5b50]">
            {order.finalTotal !== null ? "Valide" : "Estime"} ·{" "}
            {order.assignedToName ? `Assignee a ${order.assignedToName}` : "Non assignee"}
          </p>
          {order.paymentLink ? (
            <a
              className="mt-3 inline-flex rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#8a4f34] transition hover:-translate-y-0.5"
              href={order.paymentLink}
              rel="noreferrer"
              target="_blank"
            >
              Ouvrir le lien de paiement
            </a>
          ) : null}
          {canPrepareReview && onPrepareReview ? (
            <button
              className="mt-4 rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50] transition hover:-translate-y-0.5 hover:text-[#8a4f34]"
              onClick={() => onPrepareReview(order)}
              type="button"
            >
              {hasPreparedReview ? "Modifier l'avis" : "Ajouter un avis"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="mt-6 rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Actions rapides
            </p>
            <h4 className="mt-2 font-serif text-xl text-[#31231d]">
              Reagir vite selon le statut de la commande
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.status}
                className="rounded-full border border-[#ead6c9] bg-white px-4 py-2 text-sm font-semibold text-[#6f5b50] transition hover:-translate-y-0.5 hover:text-[#8a4f34] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                onClick={() => void handleQuickAction(action.status)}
                type="button"
              >
                {action.label}
              </button>
            ))}
            <button
              className="rounded-full bg-[#8a4f34] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !paymentLink.trim() || !finalTotal.trim()}
              onClick={() => void handleSendPaymentRequest()}
              type="button"
            >
              Envoyer le lien de paiement
            </button>
          </div>
        </div>
        {!paymentLink.trim() || !finalTotal.trim() ? (
          <p className="mt-4 text-sm text-[#8f786c]">
            Renseigne la somme due et le lien de paiement pour envoyer la demande de reglement au
            client.
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
            Commande
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#4a3830]">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-[#f4e4da] bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#31231d]">
                      {item.quantity} x {item.productName}
                    </p>
                    <p className="mt-1 text-sm text-[#8f786c]">
                      {item.category || "Produit"}{" "}
                      {item.unitPrice !== null ? `· ${formatAdminPrice(item.unitPrice)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[#8a4f34]">
                    {item.unitPrice !== null
                      ? formatAdminPrice(item.unitPrice * item.quantity)
                      : "Sur devis"}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#6f5b50]">
              <strong className="text-[#31231d]">Adresse / retrait :</strong>{" "}
              {order.deliveryMode === "delivery"
                ? order.deliveryAddress || "Adresse non renseignee"
                : order.pickupNotes || "Aucune precision de retrait"}
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#6f5b50]">
              <strong className="text-[#31231d]">Note client :</strong> {order.notes || "Aucune"}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
                Infos complementaires
              </p>
              <h4 className="mt-2 font-serif text-xl text-[#31231d]">
                Demandes et reponses client
              </h4>
            </div>
            {latestReply ? (
              <span className="rounded-full bg-[#f4e2d8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                Derniere reponse {getAdminResponseChannelLabel(latestReply.channel)}
              </span>
            ) : null}
          </div>

          <div className="mt-5 rounded-[22px] border border-[#efded3] bg-white p-4">
            <p className="text-sm font-semibold text-[#31231d]">Demander un complement</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#5f4a40]">
                <span className="font-medium text-[#31231d]">Canal privilegie</span>
                <select
                  className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                  onChange={(event) => setPreferredChannel(event.target.value as "email" | "sms")}
                  value={preferredChannel}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[#5f4a40]">
                <span className="font-medium text-[#31231d]">Sujet</span>
                <input
                  className="rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                  onChange={(event) => setRequestSubject(event.target.value)}
                  placeholder="Ex : confirmation du nombre de parts"
                  type="text"
                  value={requestSubject}
                />
              </label>
            </div>
            <label className="mt-3 grid gap-2 text-sm text-[#5f4a40]">
              <span className="font-medium text-[#31231d]">Message</span>
              <textarea
                className="min-h-[110px] rounded-2xl border border-[#ead6c9] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#8a4f34]"
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder="Demande ici l'information precise que le client doit te confirmer."
                value={requestMessage}
              />
            </label>
            <button
              className="mt-4 rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={requestSaving}
              onClick={() => void handleCreateRequest()}
              type="button"
            >
              {requestSaving ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {order.informationRequests.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                Aucun complement n&apos;a encore ete demande pour cette commande.
              </div>
            ) : null}
            {order.informationRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[22px] border border-[#efded3] bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f4e2d8] px-3 py-1 text-xs font-semibold text-[#8a4f34]">
                    {request.createdByRole ? getAppUserRoleLabel(request.createdByRole) : "Equipe"}
                  </span>
                  <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-xs font-medium text-[#6f5b50]">
                    Reponse attendue par {getAdminResponseChannelLabel(request.preferredChannel)}
                  </span>
                  <span className="text-xs text-[#8f786c]">
                    {formatAdminDateTime(request.createdAt)}
                  </span>
                </div>

                <h5 className="mt-3 text-lg font-semibold text-[#31231d]">{request.subject}</h5>
                <p className="mt-2 text-sm leading-6 text-[#5f4a40]">{request.message}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[#8f786c]">
                  Demande faite par {request.createdByName}
                </p>

                {request.replies.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {request.replies.map((reply) => (
                      <div key={reply.id} className="rounded-2xl bg-[#f8efe9] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                          Reponse client recue par {getAdminResponseChannelLabel(reply.channel)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#31231d]">{reply.summary}</p>
                        <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                          {reply.fullMessage}
                        </p>
                        <p className="mt-3 text-xs text-[#8f786c]">
                          {formatAdminDateTime(reply.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                    En attente d&apos;une reponse client sur le canal choisi.
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Notifications client
            </p>
            <h4 className="mt-2 font-serif text-xl text-[#31231d]">
              Messages prevus et journal d&apos;envoi
            </h4>
            <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
              Cette base prepare les emails et SMS selon le statut choisi avant le branchement
              de l&apos;envoi reel.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[22px] border border-[#efded3] bg-white p-4">
            <p className="text-sm font-semibold text-[#31231d]">
              Apercu pour le statut actuel
            </p>
            <div className="mt-4 space-y-3">
              {statusNotificationPreview.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                  Aucun message automatique prevu pour ce statut.
                </div>
              ) : null}
              {statusNotificationPreview.map((notification) => (
                <div key={`${notification.channel}-${notification.templateCode}`} className="rounded-2xl bg-[#fff8f4] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4f34]">
                      {notification.channel === "email" ? "Email" : "SMS"}
                    </span>
                    <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-xs font-medium text-[#6f5b50]">
                      {getNotificationTemplateLabel(notification.templateCode)}
                    </span>
                  </div>
                  {notification.subject ? (
                    <p className="mt-3 text-sm font-semibold text-[#31231d]">{notification.subject}</p>
                  ) : null}
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5f4a40]">
                    {notification.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#efded3] bg-white p-4">
            <p className="text-sm font-semibold text-[#31231d]">Journal des notifications</p>
            <div className="mt-4 space-y-3">
              {order.notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                  Aucune notification journalisee pour cette commande pour le moment.
                </div>
              ) : null}
              {order.notifications.map((notification) => {
                const subject = readNotificationText(notification.payload, "subject");
                const body = readNotificationText(notification.payload, "body");

                return (
                  <div key={notification.id} className="rounded-2xl bg-[#fff8f4] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4f34]">
                        {notification.channel === "email" ? "Email" : "SMS"}
                      </span>
                      <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-xs font-medium text-[#6f5b50]">
                        {getNotificationTemplateLabel(notification.templateCode)}
                      </span>
                      <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-xs font-medium text-[#6f5b50]">
                        {getNotificationStatusLabel(notification.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#31231d]">
                      {notification.recipient}
                    </p>
                    {subject ? <p className="mt-2 text-sm text-[#31231d]">{subject}</p> : null}
                    {body ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#5f4a40]">
                        {body}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-[#8f786c]">
                      {formatAdminDateTime(notification.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              Gestion detaillee
            </p>
            <h4 className="mt-2 font-serif text-xl text-[#31231d]">
              Mettre a jour le suivi de cette commande
            </h4>
            <p className="mt-2 text-sm leading-6 text-[#6f5b50]">
              Statut, assignation, archivage et total final sont relies au vrai tableau admin.
            </p>
          </div>
          <button
            className="rounded-full bg-[#8a4f34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#73422b] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving ? "Enregistrement..." : "Enregistrer les changements"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm text-[#5f4a40]">
            <span className="font-medium text-[#31231d]">Statut</span>
            <select
              className="rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              onChange={(event) => setStatus(event.target.value as AdminOrderStatus)}
              value={status}
            >
              {ADMIN_ORDER_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {getAdminOrderStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[#5f4a40]">
            <span className="font-medium text-[#31231d]">Assigner a</span>
            <select
              className="rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              onChange={(event) => setAssignedTo(event.target.value)}
              value={assignedTo}
            >
              <option value="">Aucune assignation</option>
              {teamMembers
                .filter((member) => member.active)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} · {getAppUserRoleLabel(member.role)}
                  </option>
                ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[#5f4a40]">
            <span className="font-medium text-[#31231d]">Somme due</span>
            <input
              className="rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              inputMode="decimal"
              onChange={(event) => setFinalTotal(event.target.value)}
              placeholder="Laisser vide si non defini"
              type="number"
              value={finalTotal}
            />
          </label>

          <label className="grid gap-2 text-sm text-[#5f4a40] md:col-span-2 xl:col-span-4">
            <span className="font-medium text-[#31231d]">Lien de paiement</span>
            <input
              className="rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              onChange={(event) => setPaymentLink(event.target.value)}
              placeholder="https://..."
              type="url"
              value={paymentLink}
            />
          </label>

          <label className="grid gap-2 text-sm text-[#5f4a40] md:col-span-2 xl:col-span-2">
            <span className="font-medium text-[#31231d]">Date limite de paiement</span>
            <input
              className="rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              onChange={(event) => setPaymentDeadline(event.target.value)}
              type="datetime-local"
              value={paymentDeadline}
            />
          </label>

          <label className="grid gap-2 text-sm text-[#5f4a40]">
            <span className="font-medium text-[#31231d]">Archivage</span>
            <button
              className={`rounded-2xl border px-4 py-3 text-left font-medium ${
                archived
                  ? "border-[#d6b3a1] bg-[#f8ece6] text-[#8a4f34]"
                  : "border-[#ead6c9] bg-white text-[#5f4a40]"
              }`}
              onClick={() => setArchived((value) => !value)}
              type="button"
            >
              {archived ? "Commande archivee" : "Commande visible"}
            </button>
          </label>
        </div>

        {status === "refused" ? (
          <label className="mt-4 grid gap-2 text-sm text-[#5f4a40]">
            <span className="font-medium text-[#31231d]">Motif du refus</span>
            <textarea
              className="min-h-[110px] rounded-2xl border border-[#ead6c9] bg-white px-4 py-3 outline-none focus:border-[#8a4f34]"
              onChange={(event) => setRefusalReason(event.target.value)}
              placeholder="Explique pourquoi cette commande ne peut pas etre acceptee."
              value={refusalReason}
            />
          </label>
        ) : null}
      </section>

      <section className="mt-6 rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
          Journal de commande
        </p>
        <h4 className="mt-2 font-serif text-xl text-[#31231d]">
          Historique des actions sur ce dossier
        </h4>
        <div className="mt-5 space-y-3">
          {order.events.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
              Aucun historique detaille pour le moment.
            </div>
          ) : null}
          {order.events.map((event) => (
            <div key={event.id} className="rounded-[22px] border border-[#efded3] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f4e2d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4f34]">
                  {getAdminEventLabel(event.eventType)}
                </span>
                <span className="text-xs text-[#8f786c]">
                  {formatAdminDateTime(event.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                {event.notes || "Mise a jour enregistree sur cette commande."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8f786c]">
                {event.actorName || "Systeme"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
