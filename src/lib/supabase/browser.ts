"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, supabaseConfigured } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (!supabaseConfigured()) return null;
  client ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return client;
}
