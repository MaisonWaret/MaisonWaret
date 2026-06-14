export type UserRole = "owner" | "manager" | "employee";
export type OrderStatus =
  | "pending"
  | "reviewing"
  | "accepted"
  | "refused"
  | "awaiting_payment";
export type ResponseChannel = "email" | "sms";

export type Product = {
  id: string;
  name: string;
  category: string;
  priceFrom: number;
  description: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: UserRole;
  specialty: string;
};

export type ComplementaryRequest = {
  id: string;
  askedBy: string;
  askedByRole: UserRole;
  askedAt: string;
  preferredChannel: ResponseChannel;
  subject: string;
  message: string;
  status: "waiting" | "answered";
};

export type ClientReply = {
  id: string;
  requestId: string;
  repliedAt: string;
  channel: ResponseChannel;
  summary: string;
  fullMessage: string;
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  requestedDate: string;
  deliveryMode: "livraison" | "retrait";
  status: OrderStatus;
  estimatedTotal: number;
  assignedTo: string;
  items: string[];
  complementaryRequests: ComplementaryRequest[];
  clientReplies: ClientReply[];
  notes: string;
};

export const siteContent = {
  brand: "Maison Waret",
  subtitle: "Patisserie artisanale",
  heroTitle: "La V2 pro pour gerer commandes, equipe et echanges clients.",
  heroText:
    "Cette nouvelle base est pensee pour un vrai flux de production : prise de commande, validation manuelle, suivi equipe et demande d'informations complementaires visibles selon le canal de reponse du client.",
  promiseItems: [
    "Validation manuelle de chaque commande",
    "Roles admin, manager et employe",
    "Demandes d'infos complementaires tracees",
    "Reponses client visibles par email ou SMS",
  ],
};

export const products: Product[] = [
  {
    id: "box-signature",
    name: "Box signature viennoiseries",
    category: "Box",
    priceFrom: 22,
    description:
      "Selection premium de croissants, pains au chocolat et creations maison pretes a cuire ou a finir.",
  },
  {
    id: "entremets-sur-mesure",
    name: "Entremets sur mesure",
    category: "Gateau",
    priceFrom: 34,
    description:
      "Commande personnalisable selon les parfums, le nombre de parts et le visuel souhaite.",
  },
  {
    id: "collection-saison",
    name: "Collection saisonniere",
    category: "Saisonnier",
    priceFrom: 16,
    description:
      "Produits du moment selon la saison, les fetes et les envies de la maison.",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "owner-1",
    name: "Toi - Maison Waret",
    role: "owner",
    specialty: "Validation finale et gestion de la production",
  },
  {
    id: "manager-1",
    name: "Camille",
    role: "manager",
    specialty: "Organisation commandes et relation client",
  },
  {
    id: "employee-1",
    name: "Noah",
    role: "employee",
    specialty: "Preparation et suivi des details de commande",
  },
];

export const orders: Order[] = [
  {
    id: "MW-2026-041",
    customerName: "Emma Robert",
    customerPhone: "06 00 00 00 01",
    customerEmail: "emma.robert@mail.fr",
    requestedDate: "18 juin 2026 - matin",
    deliveryMode: "livraison",
    status: "reviewing",
    estimatedTotal: 68,
    assignedTo: "Camille",
    items: ["1 x Number cake", "1 x Box signature viennoiseries"],
    notes: "Anniversaire enfant, couleurs beige et rose poudree.",
    complementaryRequests: [
      {
        id: "req-1",
        askedBy: "Camille",
        askedByRole: "manager",
        askedAt: "13/06/2026 09:10",
        preferredChannel: "email",
        subject: "Preciser le nombre de parts",
        message:
          "Peux-tu confirmer le nombre exact de parts souhaite et s'il y a une intolérance a prendre en compte ?",
        status: "answered",
      },
    ],
    clientReplies: [
      {
        id: "reply-1",
        requestId: "req-1",
        repliedAt: "13/06/2026 09:42",
        channel: "email",
        summary: "Le client a confirme 12 parts et aucune allergie.",
        fullMessage:
          "Bonjour, il faut 12 parts et il n'y a pas d'allergie. Merci.",
      },
    ],
  },
  {
    id: "MW-2026-042",
    customerName: "Lucas Bernard",
    customerPhone: "06 00 00 00 02",
    customerEmail: "lucas.bernard@mail.fr",
    requestedDate: "20 juin 2026 - apres-midi",
    deliveryMode: "retrait",
    status: "pending",
    estimatedTotal: 32,
    assignedTo: "Noah",
    items: ["1 x Box signature viennoiseries", "1 x Collection saisonniere"],
    notes: "Commande cadeau, il manque encore le format exact.",
    complementaryRequests: [
      {
        id: "req-2",
        askedBy: "Noah",
        askedByRole: "employee",
        askedAt: "13/06/2026 10:05",
        preferredChannel: "sms",
        subject: "Format de la box cadeau",
        message:
          "Souhaites-tu un format 4 personnes ou 6 personnes pour la box ?",
        status: "waiting",
      },
    ],
    clientReplies: [],
  },
  {
    id: "MW-2026-043",
    customerName: "Sarah Martin",
    customerPhone: "06 00 00 00 03",
    customerEmail: "sarah.martin@mail.fr",
    requestedDate: "22 juin 2026 - matin",
    deliveryMode: "livraison",
    status: "awaiting_payment",
    estimatedTotal: 96,
    assignedTo: "Toi - Maison Waret",
    items: ["1 x Entremets sur mesure", "2 x Collection saisonniere"],
    notes: "Commande acceptee, attente du mode de reglement final.",
    complementaryRequests: [
      {
        id: "req-3",
        askedBy: "Toi - Maison Waret",
        askedByRole: "owner",
        askedAt: "12/06/2026 16:00",
        preferredChannel: "sms",
        subject: "Confirmation adresse precise",
        message:
          "Peux-tu confirmer l'etage et le code d'acces pour la livraison ?",
        status: "answered",
      },
    ],
    clientReplies: [
      {
        id: "reply-3",
        requestId: "req-3",
        repliedAt: "12/06/2026 16:18",
        channel: "sms",
        summary: "Le client a renvoye le code et precise le 2e etage.",
        fullMessage: "Code 4821B, 2e etage a gauche. Merci beaucoup.",
      },
    ],
  },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export const getRoleLabel = (role: UserRole) => {
  if (role === "owner") return "Admin principal";
  if (role === "manager") return "Manager";
  return "Employe";
};

export const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "reviewing":
      return "En analyse";
    case "accepted":
      return "Acceptee";
    case "refused":
      return "Refusee";
    case "awaiting_payment":
      return "Paiement en attente";
    default:
      return "En attente";
  }
};

export const getChannelLabel = (channel: ResponseChannel) =>
  channel === "email" ? "Email" : "SMS";
