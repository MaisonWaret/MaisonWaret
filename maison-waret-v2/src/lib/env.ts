const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const publicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

export const runtimeEnv = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Maison Waret",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  supabaseUrl: publicSupabaseUrl,
  supabaseAnonKey: publicSupabaseAnonKey,
  supabaseConfigured: Boolean(publicSupabaseUrl && publicSupabaseAnonKey),
};

export function getServerSupabaseEnv() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  return {
    ...runtimeEnv,
    serviceRoleKey,
    serviceRoleConfigured: Boolean(serviceRoleKey),
    serverConfigured: Boolean(
      runtimeEnv.supabaseConfigured && serviceRoleKey,
    ),
  };
}
