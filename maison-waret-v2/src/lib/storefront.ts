import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceFrom: number | null;
  seasonal: boolean;
};

export type DeliveryZoneOption = {
  id: string;
  label: string;
  city: string | null;
  postalCode: string | null;
  deliveryFee: number;
  minimumOrderAmount: number | null;
};

export type StorefrontData = {
  products: StorefrontProduct[];
  deliveryZones: DeliveryZoneOption[];
};

export const LOCAL_DELIVERY_AREA = {
  town: "Baron",
  postalCode: "60300",
  county: "Oise",
  radiusKm: 15,
};

const DEFAULT_LOCAL_DELIVERY_ZONE: DeliveryZoneOption = {
  id: "local-baron-radius",
  label: `Rayon ${LOCAL_DELIVERY_AREA.radiusKm} km autour de ${LOCAL_DELIVERY_AREA.town} (${LOCAL_DELIVERY_AREA.postalCode})`,
  city: LOCAL_DELIVERY_AREA.town,
  postalCode: LOCAL_DELIVERY_AREA.postalCode,
  deliveryFee: 0,
  minimumOrderAmount: null,
};

const OUT_OF_SEASON_NOTE =
  "Disponible sur demande, avec information claire si le fruit n'est pas de saison au moment choisi.";

const CURATED_STOREFRONT_PRODUCTS: StorefrontProduct[] = [
  {
    id: "box-viennoiserie-signature",
    slug: "box-viennoiserie-signature",
    name: "Box viennoiserie signature",
    category: "Signature Maison",
    description:
      "La box signature Maison Waret avec croissants bicolores, croissants classiques et pains au chocolat.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "saison-fraisier",
    slug: "fraisier-de-saison",
    name: "Fraisier",
    category: "Produits de saison",
    description:
      "Le fraisier du moment, pense pour la belle saison et les envies fruitees.",
    priceFrom: null,
    seasonal: true,
  },
  {
    id: "saison-framboisier",
    slug: "framboisier-de-saison",
    name: "Framboisier",
    category: "Produits de saison",
    description:
      "Le framboisier de saison, frais et gourmand, pour les commandes du moment.",
    priceFrom: null,
    seasonal: true,
  },
  {
    id: "saison-box-tartelettes",
    slug: "box-tartelettes-de-saison",
    name: "Box de tartelettes de saison",
    category: "Produits de saison",
    description:
      "Une box de tartelettes de saison autour de peche, abricot, nectarine, mure, framboise, cerise et fraise selon la selection Maison Waret.",
    priceFrom: null,
    seasonal: true,
  },
  {
    id: "delice-box-voyage",
    slug: "box-voyage-cookies",
    name: "Box voyage",
    category: "Delices de voyage",
    description:
      "Une box de voyage composee de cookies de plusieurs sortes pour partager ou offrir.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "delice-meringettes",
    slug: "meringettes",
    name: "Meringettes",
    category: "Delices de voyage",
    description:
      "Des meringettes legeres et gourmandes, parfaites pour une pause sucree elegante.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "delice-box-macarons",
    slug: "box-macarons",
    name: "Box de macarons",
    category: "Delices de voyage",
    description:
      "Une box de plusieurs sortes de macarons, pensee pour les cadeaux et les tables gourmandes.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-fraisier",
    slug: "fraisier",
    name: "Fraisier",
    category: "Gateaux au choix",
    description: `Fraisier disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-framboisier",
    slug: "framboisier",
    name: "Framboisier",
    category: "Gateaux au choix",
    description: `Framboisier disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-paris-brest",
    slug: "paris-brest",
    name: "Paris-Brest",
    category: "Gateaux au choix",
    description:
      "Le grand classique Paris-Brest, travaille en version Maison Waret sur commande.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-charlotte-fraise",
    slug: "charlotte-fraise",
    name: "Charlotte fraise",
    category: "Gateaux au choix",
    description: `Charlotte a la fraise disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-charlotte-poire-caramel",
    slug: "charlotte-poire-caramel",
    name: "Charlotte poire caramel",
    category: "Gateaux au choix",
    description:
      "Une charlotte poire caramel genereuse et elegante pour les grandes occasions.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-saint-honore",
    slug: "saint-honore",
    name: "Saint-honore",
    category: "Gateaux au choix",
    description: "Le Saint-honore, dans un esprit maison et sur commande.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-tropezienne",
    slug: "tropezienne",
    name: "Tropezienne",
    category: "Gateaux au choix",
    description:
      "La tropezienne Maison Waret, ideale pour une table conviviale et gourmande.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-wedding-cake",
    slug: "wedding-cake",
    name: "Wedding Cake",
    category: "Gateaux au choix",
    description:
      "Wedding Cake sur devis, pense selon le style, les parts et l'evenement souhaite.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-opera",
    slug: "opera",
    name: "Opera",
    category: "Gateaux au choix",
    description:
      "L'opera, intense et raffine, realise sur commande pour les amateurs de chocolat et cafe.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-baba-rhum",
    slug: "baba-au-rhum",
    name: "Baba au rhum",
    category: "Gateaux au choix",
    description: "Le baba au rhum en version Maison Waret, gourmand et genereux.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-trois-chocolats",
    slug: "trois-chocolats",
    name: "3 chocolats",
    category: "Gateaux au choix",
    description:
      "L'entremets 3 chocolats pour les amateurs de textures fondantes et de cacao.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-dame-blanche",
    slug: "dame-blanche",
    name: "Dame Blanche",
    category: "Gateaux au choix",
    description:
      "La Dame Blanche, douce et elegante, preparee sur commande selon le format voulu.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-poirier",
    slug: "poirier",
    name: "Poirier",
    category: "Gateaux au choix",
    description: `Poirier disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-royal",
    slug: "royal",
    name: "Royal",
    category: "Gateaux au choix",
    description:
      "Le Royal, intense et croustillant, pour les clients qui veulent un classique premium.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-macaron",
    slug: "gateau-macaron",
    name: "Macaron",
    category: "Gateaux au choix",
    description:
      "Version grand format autour de l'esprit macaron, sur commande et selon les envies.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-crumble-pomme-caramel",
    slug: "crumble-pomme-caramel",
    name: "Crumble pomme caramel",
    category: "Gateaux au choix",
    description:
      "Un gateau crumble pomme caramel gourmand, reconfortant et genereux.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "gateau-crumble-poire-chocolat",
    slug: "crumble-poire-chocolat",
    name: "Crumble poire chocolat",
    category: "Gateaux au choix",
    description:
      "Une creation poire chocolat facon crumble, pour les envies plus profondes et gourmandes.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-fraise",
    slug: "tarte-fraise",
    name: "Tarte fraise",
    category: "Nos tartes",
    description: `Tarte a la fraise disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-framboise",
    slug: "tarte-framboise",
    name: "Tarte framboise",
    category: "Nos tartes",
    description: `Tarte a la framboise disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-pomme",
    slug: "tarte-pomme",
    name: "Tarte pomme",
    category: "Nos tartes",
    description:
      "La tarte pomme dans une version simple, elegante et efficace.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-fine",
    slug: "tarte-fine",
    name: "Tarte fine",
    category: "Nos tartes",
    description:
      "Une tarte fine croustillante et legere, selon l'inspiration Maison Waret.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-amandine",
    slug: "tarte-amandine",
    name: "Tarte amandine",
    category: "Nos tartes",
    description:
      "La tarte amandine, genereuse et parfumee, preparee sur commande.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-amandine-poire",
    slug: "tarte-amandine-poire",
    name: "Tarte amandine poire",
    category: "Nos tartes",
    description: `Tarte amandine poire disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-amandine-abricot-pistache",
    slug: "tarte-amandine-abricot-pistache",
    name: "Tarte amandine abricot pistache",
    category: "Nos tartes",
    description:
      `Tarte amandine abricot pistache disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-citron",
    slug: "tarte-citron",
    name: "Tarte citron",
    category: "Nos tartes",
    description:
      "La tarte citron, equilibree entre peps et gourmandise, sur commande.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tarte-chocolat",
    slug: "tarte-chocolat",
    name: "Tarte chocolat",
    category: "Nos tartes",
    description:
      "Une tarte chocolat intense et elegante pour les clients qui veulent un dessert plus profond.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-fraise",
    slug: "tartelette-fraise",
    name: "Tartelette fraise",
    category: "Nos box de tartelettes",
    description: `Tartelette fraise disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-framboise",
    slug: "tartelette-framboise",
    name: "Tartelette framboise",
    category: "Nos box de tartelettes",
    description: `Tartelette framboise disponible sur demande. ${OUT_OF_SEASON_NOTE}`,
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-pomme",
    slug: "tartelette-pomme",
    name: "Tartelette pomme",
    category: "Nos box de tartelettes",
    description:
      "Une tartelette pomme genereuse et facile a partager en box.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-fine",
    slug: "tartelette-fine",
    name: "Tartelette fine",
    category: "Nos box de tartelettes",
    description:
      "La tartelette fine en version box, legere et croustillante.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-citron",
    slug: "tartelette-citron",
    name: "Tartelette citron",
    category: "Nos box de tartelettes",
    description:
      "Une tartelette citron vive et elegante, a integrer dans une box assortiment.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-nok",
    slug: "tartelette-nok",
    name: "Tartelette NOK",
    category: "Nos box de tartelettes",
    description:
      "La tartelette NOK telle que souhaitee dans la selection actuelle Maison Waret.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-crumble-pomme-caramel",
    slug: "tartelette-crumble-pomme-caramel",
    name: "Tartelette crumble pomme caramel",
    category: "Nos box de tartelettes",
    description:
      "Une tartelette crumble pomme caramel pour une box reconfortante et genereuse.",
    priceFrom: null,
    seasonal: false,
  },
  {
    id: "tartelette-crumble-poire-chocolat",
    slug: "tartelette-crumble-poire-chocolat",
    name: "Tartelette crumble poire chocolat",
    category: "Nos box de tartelettes",
    description:
      "Une tartelette poire chocolat facon crumble pour les envies plus gourmandes.",
    priceFrom: null,
    seasonal: false,
  },
];

export async function getStorefrontData(): Promise<StorefrontData> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      products: CURATED_STOREFRONT_PRODUCTS,
      deliveryZones: [],
    };
  }

  const { data: zoneRows } = await admin
      .from("delivery_zones")
      .select("id, label, city, postal_code, delivery_fee, minimum_order_amount")
      .eq("active", true)
      .order("label", { ascending: true });

  return {
    products: CURATED_STOREFRONT_PRODUCTS,
    deliveryZones:
      zoneRows && zoneRows.length > 0
        ? zoneRows.map((zone) => ({
            id: zone.id,
            label: zone.label,
            city: zone.city,
            postalCode: zone.postal_code,
            deliveryFee: Number(zone.delivery_fee || 0),
            minimumOrderAmount: zone.minimum_order_amount,
          }))
        : [DEFAULT_LOCAL_DELIVERY_ZONE],
  };
}

export function formatCurrency(value: number | null) {
  if (value === null) return "Sur devis";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function getProductTheme(product: StorefrontProduct) {
  const category = product.category.toLowerCase();

  if (product.seasonal || category.includes("saisonn")) {
    return {
      eyebrow: "De saison",
      visualClass:
        "bg-[linear-gradient(135deg,rgba(220,173,120,0.95),rgba(171,93,54,0.92))]",
      chipClass: "bg-[#fff1de] text-[#9d5c3f]",
    };
  }

  if (category.includes("box")) {
    return {
      eyebrow: "Best seller",
      visualClass:
        "bg-[linear-gradient(135deg,rgba(197,143,108,0.95),rgba(143,75,47,0.95))]",
      chipClass: "bg-[#f5e4d7] text-[#9d5c3f]",
    };
  }

  if (category.includes("signature")) {
    return {
      eyebrow: "Signature",
      visualClass:
        "bg-[linear-gradient(135deg,rgba(155,92,63,0.95),rgba(81,44,30,0.95))]",
      chipClass: "bg-[#f5e4d7] text-[#9d5c3f]",
    };
  }

  if (category.includes("voyage")) {
    return {
      eyebrow: "Voyage",
      visualClass:
        "bg-[linear-gradient(135deg,rgba(183,141,92,0.95),rgba(121,87,49,0.95))]",
      chipClass: "bg-[#efe7d7] text-[#7d5a2f]",
    };
  }

  if (category.includes("gateau") || category.includes("entremets")) {
    return {
      eyebrow: "Signature",
      visualClass:
        "bg-[linear-gradient(135deg,rgba(171,121,139,0.95),rgba(105,63,82,0.95))]",
      chipClass: "bg-[#f3e3ea] text-[#8b5165]",
    };
  }

  return {
    eyebrow: "Maison",
    visualClass:
      "bg-[linear-gradient(135deg,rgba(203,176,130,0.95),rgba(126,103,72,0.95))]",
    chipClass: "bg-[#efe7d7] text-[#7d5a2f]",
  };
}

export function getDeliveryCoverageLabel() {
  return `Livraison dans un rayon de ${LOCAL_DELIVERY_AREA.radiusKm} km autour de ${LOCAL_DELIVERY_AREA.town} (${LOCAL_DELIVERY_AREA.county})`;
}

export function getDeliveryCoverageShortLabel() {
  return `${LOCAL_DELIVERY_AREA.radiusKm} km autour de ${LOCAL_DELIVERY_AREA.town}`;
}

export function getHomepageProductSections(products: StorefrontProduct[]) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const bestSellers = [
    bySlug.get("box-viennoiserie-signature"),
    bySlug.get("fraisier-de-saison"),
    bySlug.get("framboisier-de-saison"),
  ].filter((product): product is StorefrontProduct => Boolean(product));

  const signature = [bySlug.get("box-viennoiserie-signature")].filter(
    (product): product is StorefrontProduct => Boolean(product),
  );

  const seasonal = [
    bySlug.get("fraisier-de-saison"),
    bySlug.get("framboisier-de-saison"),
    bySlug.get("box-tartelettes-de-saison"),
  ].filter((product): product is StorefrontProduct => Boolean(product));

  return {
    bestSellers,
    signature,
    seasonal,
  };
}

export function getProductCategories(products: StorefrontProduct[]) {
  const orderedCategories = [
    "Signature Maison",
    "Produits de saison",
    "Delices de voyage",
    "Gateaux au choix",
    "Nos tartes",
    "Nos box de tartelettes",
  ];

  const categories = Array.from(new Set(products.map((product) => product.category)));

  return categories.sort((a, b) => {
    const indexA = orderedCategories.indexOf(a);
    const indexB = orderedCategories.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b, "fr");
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}
