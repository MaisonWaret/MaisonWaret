import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6).max(128),
  role: z.enum(["manager", "employee"]),
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

export async function POST(request: Request) {
  const guard = await requireOwner();
  if ("error" in guard) {
    return guard.error;
  }

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informations invalides pour creer le compte." },
      { status: 400 },
    );
  }

  const { admin } = guard;
  const { fullName, email, password, role } = parsed.data;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { message: authError?.message || "Impossible de creer le compte auth." },
      { status: 400 },
    );
  }

  const { error: insertError } = await admin.from("app_users").insert({
    id: authData.user.id,
    full_name: fullName,
    role,
    active: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
