import { products as fallbackProducts } from "@/lib/mock-data";
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

function mapFallbackProducts(): StorefrontProduct[] {
  return fallbackProducts.map((product) => ({
    id: product.id,
    slug: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    priceFrom: product.priceFrom,
    seasonal: product.category.toLowerCase().includes("saisonn"),
  }));
}

export async function getStorefrontData(): Promise<StorefrontData> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      products: mapFallbackProducts(),
      deliveryZones: [],
    };
  }

  const [{ data: productRows }, { data: zoneRows }] = await Promise.all([
    admin
      .from("products")
      .select("id, slug, name, category, description, price_from, seasonal")
      .eq("visible", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("delivery_zones")
      .select("id, label, city, postal_code, delivery_fee, minimum_order_amount")
      .eq("active", true)
      .order("label", { ascending: true }),
  ]);

  return {
    products:
      productRows && productRows.length > 0
        ? productRows.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            description: product.description || "",
            priceFrom: product.price_from,
            seasonal: Boolean(product.seasonal),
          }))
        : mapFallbackProducts(),
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

function pickHomepageSectionProducts(
  products: StorefrontProduct[],
  usedIds: Set<string>,
  preferredFilter: (product: StorefrontProduct) => boolean,
  limit = 3,
) {
  const picked: StorefrontProduct[] = [];

  const preferred = products.filter(
    (product) => !usedIds.has(product.id) && preferredFilter(product),
  );
  const fallback = products.filter(
    (product) => !usedIds.has(product.id) && !preferredFilter(product),
  );

  [...preferred, ...fallback].some((product) => {
    if (picked.length >= limit) {
      return true;
    }

    picked.push(product);
    usedIds.add(product.id);
    return false;
  });

  return picked;
}

export function getHomepageProductSections(products: StorefrontProduct[]) {
  const bestSellers = products.slice(0, 3);
  const usedIds = new Set(bestSellers.map((product) => product.id));

  const signature = pickHomepageSectionProducts(
    products,
    usedIds,
    (product) => !product.seasonal,
  );
  const seasonal = pickHomepageSectionProducts(
    products,
    usedIds,
    (product) => product.seasonal,
  );

  return {
    bestSellers,
    signature,
    seasonal,
  };
}

export function getProductCategories(products: StorefrontProduct[]) {
  return Array.from(new Set(products.map((product) => product.category))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}
