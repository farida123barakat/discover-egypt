import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { backendMode } from "@/lib/env";
import { supabaseForUser } from "@/lib/supabase/server";

export const ADMIN_COOKIE = "de_admin";
const SESSION_HOURS = 8;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Local demo mode only: compare the submitted password with LOCAL_ADMIN_PASSWORD. */
export function checkLocalAdminPassword(password: string) {
  const expected = process.env.LOCAL_ADMIN_PASSWORD ?? "";
  if (expected.length < 12) return false;
  return safeEqual(sign(password), sign(expected));
}

export function createLocalAdminToken(now = Date.now()) {
  const exp = String(now + SESSION_HOURS * 3600_000);
  return `${exp}.${sign(`admin:${exp}`)}`;
}

export function verifyLocalAdminToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return safeEqual(sig, sign(`admin:${exp}`));
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};

export type AdminIdentity = { id: string; email: string | null; mode: "supabase" | "local" };

/** Server-side admin check used by every admin page and admin API route. */
export async function getAdmin(): Promise<AdminIdentity | null> {
  const mode = backendMode();
  if (mode === "local") {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    return verifyLocalAdminToken(token) ? { id: "local-admin", email: null, mode } : null;
  }
  if (mode === "supabase") {
    const sb = await supabaseForUser();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await sb.from("user_profiles").select("role").eq("id", data.user.id).single();
    return profile?.role === "admin" ? { id: data.user.id, email: data.user.email ?? null, mode } : null;
  }
  return null;
}
