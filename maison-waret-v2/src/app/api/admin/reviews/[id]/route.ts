import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateReviewSchema = z
  .object({
    orderId: z.union([z.string().uuid(), z.null()]).optional(),
    authorName: z.string().trim().min(2).max(120).optional(),
    city: z.union([z.string().trim().max(120), z.literal(""), z.null()]).optional(),
    title: z.union([z.string().trim().max(160), z.literal(""), z.null()]).optional(),
    message: z.string().trim().min(10).max(3000).optional(),
    occasion: z.union([z.string().trim().max(120), z.literal(""), z.null()]).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    visible: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune modification transmise.",
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireOwner();
  if ("error" in guard) {
    return guard.error;
  }

  const parsed = updateReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Payload invalide." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const updates: Record<string, unknown> = {};

  if (parsed.data.authorName !== undefined) updates.author_name = parsed.data.authorName;
  if (parsed.data.orderId !== undefined) updates.order_id = parsed.data.orderId;
  if (parsed.data.city !== undefined) updates.city = parsed.data.city || null;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title || null;
  if (parsed.data.message !== undefined) updates.message = parsed.data.message;
  if (parsed.data.occasion !== undefined) updates.occasion = parsed.data.occasion || null;
  if (parsed.data.rating !== undefined) updates.rating = parsed.data.rating;
  if (parsed.data.visible !== undefined) updates.visible = parsed.data.visible;
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder;

  const { error } = await guard.admin.from("customer_reviews").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "23505"
            ? "Un autre avis est deja lie a cette commande."
            : error.message || "Impossible de mettre a jour l'avis client.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, message: "Avis client mis a jour." });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireOwner();
  if ("error" in guard) {
    return guard.error;
  }

  const { id } = await context.params;

  const { error } = await guard.admin.from("customer_reviews").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: error.message || "Impossible de supprimer l'avis client." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, message: "Avis client supprime." });
}
