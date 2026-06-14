import { createBrowserClient } from "@supabase/ssr";

import { runtimeEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!runtimeEnv.supabaseConfigured) {
    return null;
  }

  return createBrowserClient(
    runtimeEnv.supabaseUrl,
    runtimeEnv.supabaseAnonKey,
  );
}
