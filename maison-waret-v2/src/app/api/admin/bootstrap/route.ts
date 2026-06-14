import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bootstrapSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { message: "Supabase serveur non configure." },
      { status: 503 },
    );
  }

  const parsed = bootstrapSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informations invalides pour creer le compte initial." },
      { status: 400 },
    );
  }

  const { count, error: countError } = await admin
    .from("app_users")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ message: countError.message }, { status: 500 });
  }

  if (Number(count || 0) > 0) {
    return NextResponse.json(
      { message: "Le compte admin principal existe deja." },
      { status: 409 },
    );
  }

  const { fullName, email, password } = parsed.data;
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
      { message: authError?.message || "Impossible de creer l'utilisateur auth." },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("app_users").insert({
    id: authData.user.id,
    full_name: fullName,
    role: "owner",
    active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ message: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
