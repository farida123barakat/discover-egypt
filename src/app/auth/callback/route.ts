import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { supabaseForUser } from "@/lib/supabase/server";

/** Finishes the email sign-in link. `next` must be a local path, so this can't be used as an open redirect. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = /^\/(?!\/)[\w\-/]*$/.test(nextParam) ? nextParam : "/account";
  if (code && supabaseConfigured()) {
    const sb = await supabaseForUser();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/account?error=link", url.origin));
}
