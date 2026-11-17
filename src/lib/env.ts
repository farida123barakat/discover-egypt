/** Central place for configuration checks. Never import service-role values into client code. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  // Supabase's publishable key (sb_publishable_…); the legacy anon key still works in its place.
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function supabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/**
 * Local demo mode: lets the app run end-to-end without a Supabase project
 * (submissions stored in a local JSON file, single demo admin login).
 * It is refused on Vercel production deployments.
 */
export function localModeEnabled() {
  if (supabaseConfigured()) return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.DEMO_LOCAL_MODE === "true";
}

export function backendMode(): "supabase" | "local" | "none" {
  if (supabaseConfigured()) return "supabase";
  if (localModeEnabled()) return "local";
  return "none";
}
