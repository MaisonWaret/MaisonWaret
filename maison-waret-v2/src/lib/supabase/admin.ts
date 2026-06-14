import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getServerSupabaseEnv();

  if (!env.serverConfigured) {
    return null;
  }

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
