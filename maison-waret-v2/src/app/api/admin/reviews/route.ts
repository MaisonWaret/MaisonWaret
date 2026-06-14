import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createReviewSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),
  authorName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(3000),
  occasion: z.string().trim().max(120).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

async function requireOwner() {
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
    .select("id, role, active")
    .eq("id", user.id)
    .single();

  if (appUserError || !appUser || !appUser.active || appUser.role !== "owner") {
    return {
      error: NextResponse.json(
        { message: "Acces reserve a l'admin principal." },
        { status: 403 },
      ),
    };
  }

  return { admin };
}

export async function POST(request: Request) {
  const guard = await requireOwner();
  if ("error" in guard) {
    return guard.error;
  }

  const parsed = createReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Informations invalides pour creer l'avis." },
      { status: 400 },
    );
  }

  const { error } = await guard.admin.from("customer_reviews").insert({
    order_id: parsed.data.orderId || null,
    author_name: parsed.data.authorName,
    city: parsed.data.city || null,
    title: parsed.data.title || null,
    message: parsed.data.message,
    occasion: parsed.data.occasion || null,
    rating: parsed.data.rating,
    visible: parsed.data.visible,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "23505"
            ? "Un avis est deja lie a cette commande."
            : error.message || "Impossible de creer l'avis client.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, message: "Avis client ajoute." });
}
