import {
  formatPrice,
  getChannelLabel,
  getRoleLabel,
  getStatusLabel,
  type Order,
} from "@/lib/mock-data";

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_18px_45px_rgba(91,54,35,0.12)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#f4e2d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
              {order.id}
            </span>
            <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-sm font-medium text-[#6f5b50]">
              {getStatusLabel(order.status)}
            </span>
          </div>
          <h3 className="font-serif text-2xl text-[#31231d]">{order.customerName}</h3>
          <p className="text-sm leading-6 text-[#6f5b50]">
            {order.customerEmail} · {order.customerPhone}
          </p>
          <p className="text-sm leading-6 text-[#6f5b50]">
            {order.deliveryMode === "livraison" ? "Livraison" : "Retrait"} · {order.requestedDate}
          </p>
        </div>
        <div className="rounded-[22px] bg-[#fff7f2] px-5 py-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
            Total estime
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#31231d]">
            {formatPrice(order.estimatedTotal)}
          </p>
          <p className="mt-2 text-sm text-[#6f5b50]">Assigne a {order.assignedTo}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[24px] border border-[#f1dfd3] bg-[#fffaf7] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4f34]">
            Commande
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#4a3830]">
            {order.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[#f4e4da] bg-white px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#6f5b50]">
            <strong className="text-[#31231d]">Note interne :</strong> {order.notes}
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
            <button className="rounded-full bg-[#8a4f34] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#73422b]">
              Demander un complement
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {order.complementaryRequests.map((request) => {
              const reply = order.clientReplies.find(
                (currentReply) => currentReply.requestId === request.id,
              );

              return (
                <div
                  key={request.id}
                  className="rounded-[22px] border border-[#efded3] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f4e2d8] px-3 py-1 text-xs font-semibold text-[#8a4f34]">
                      {getRoleLabel(request.askedByRole)}
                    </span>
                    <span className="rounded-full border border-[#ead6c9] px-3 py-1 text-xs font-medium text-[#6f5b50]">
                      Reponse attendue par {getChannelLabel(request.preferredChannel)}
                    </span>
                    <span className="text-xs text-[#8f786c]">{request.askedAt}</span>
                  </div>

                  <h5 className="mt-3 text-lg font-semibold text-[#31231d]">
                    {request.subject}
                  </h5>
                  <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                    {request.message}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[#8f786c]">
                    Demande faite par {request.askedBy}
                  </p>

                  {reply ? (
                    <div className="mt-4 rounded-2xl bg-[#f8efe9] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f34]">
                        Reponse client recue par {getChannelLabel(reply.channel)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#31231d]">
                        {reply.summary}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#5f4a40]">
                        {reply.fullMessage}
                      </p>
                      <p className="mt-3 text-xs text-[#8f786c]">{reply.repliedAt}</p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#dcc3b5] px-4 py-4 text-sm text-[#8f786c]">
                      En attente d&apos;une reponse client. Le futur backend affichera ici le retour
                      exact selon le canal recu, SMS ou email.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </article>
  );
}
