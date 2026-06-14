import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ClientReview = {
  id: string;
  orderId: string | null;
  authorName: string;
  city: string | null;
  title: string | null;
  message: string;
  occasion: string | null;
  rating: number;
  visible: boolean;
  createdAt: string;
};

export type PublicClientReviewsResult = {
  reviews: ClientReview[];
  featureEnabled: boolean;
  source: "database" | "fallback";
};

export const FALLBACK_CLIENT_REVIEWS: ClientReview[] = [
  {
    id: "fallback-review-1",
    orderId: null,
    authorName: "Claire",
    city: "Senlis",
    title: "Une box tres soignee",
    message:
      "Presentation magnifique, produits tres bons et commande fluide du debut a la fin. On sent le cote artisanal et soigne.",
    occasion: "Petit-dejeuner gourmand",
    rating: 5,
    visible: true,
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "fallback-review-2",
    orderId: null,
    authorName: "Mathieu",
    city: "Chantilly",
    title: "Parfait pour faire plaisir",
    message:
      "J'ai commande pour offrir et le rendu etait vraiment premium. Tres bon contact et vraie impression de qualite.",
    occasion: "Cadeau gourmand",
    rating: 5,
    visible: true,
    createdAt: "2026-02-07T10:00:00.000Z",
  },
  {
    id: "fallback-review-3",
    orderId: null,
    authorName: "Elodie",
    city: "Baron",
    title: "Commande tres rassurante",
    message:
      "Le fait que la demande soit relue avant confirmation met en confiance. Les douceurs etaient delicieuses et tres bien presentees.",
    occasion: "Anniversaire",
    rating: 5,
    visible: true,
    createdAt: "2026-03-18T10:00:00.000Z",
  },
];

function isMissingCustomerReviewsRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.toLowerCase().includes("customer_reviews") === true
  );
}

function mapReviewRow(row: {
  id: string;
  order_id?: string | null;
  author_name: string;
  city: string | null;
  title: string | null;
  message: string;
  occasion: string | null;
  rating: number;
  visible: boolean;
  created_at: string;
}): ClientReview {
  return {
    id: row.id,
    orderId: row.order_id ?? null,
    authorName: row.author_name,
    city: row.city,
    title: row.title,
    message: row.message,
    occasion: row.occasion,
    rating: Number(row.rating || 5),
    visible: Boolean(row.visible),
    createdAt: row.created_at,
  };
}

export async function getPublicClientReviews(): Promise<PublicClientReviewsResult> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      reviews: FALLBACK_CLIENT_REVIEWS,
      featureEnabled: false,
      source: "fallback",
    };
  }

  const { data, error } = await admin
    .from("customer_reviews")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    if (isMissingCustomerReviewsRelation(error)) {
      return {
        reviews: FALLBACK_CLIENT_REVIEWS,
        featureEnabled: false,
        source: "fallback",
      };
    }

    return {
      reviews: FALLBACK_CLIENT_REVIEWS,
      featureEnabled: false,
      source: "fallback",
    };
  }

  return {
    reviews: (data || []).map(mapReviewRow),
    featureEnabled: true,
    source: "database",
  };
}
