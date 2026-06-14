import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateUserSchema = z.object({
  active: z.boolean(),
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
    return { error: NextResponse.json({ message: "Acces reserve a l'admin principal." }, { status: 403 }) };
  }

  return { admin, currentUserId: user.id };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireOwner();
  if ("error" in guard) {
    return guard.error;
  }

  const { id } = await context.params;
  if (id === guard.currentUserId) {
    return NextResponse.json(
      { message: "Impossible de desactiver son propre compte." },
      { status: 400 },
    );
  }

  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Payload invalide." }, { status: 400 });
  }

  const { error } = await guard.admin
    .from("app_users")
    .update({ active: parsed.data.active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
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
  if (id === guard.currentUserId) {
    return NextResponse.json(
      { message: "Impossible de supprimer son propre compte." },
      { status: 400 },
    );
  }

  const { error: deleteAuthError } = await guard.admin.auth.admin.deleteUser(id);
  if (deleteAuthError) {
    return NextResponse.json({ message: deleteAuthError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
