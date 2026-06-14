import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { configured: false, hasOwner: false, message: "Supabase serveur non configure." },
      { status: 503 },
    );
  }

  const { count, error } = await admin
    .from("app_users")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { configured: true, hasOwner: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    configured: true,
    hasOwner: Number(count || 0) > 0,
  });
}
