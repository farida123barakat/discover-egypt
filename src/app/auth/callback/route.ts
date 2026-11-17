import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { supabaseForUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-rules";

/** Finishes the email sign-in link. `next` must be a local path, so this can't be used as an open redirect. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code && supabaseConfigured()) {
    const sb = await supabaseForUser();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  // Expired, already used, or opened in another browser (the sign-in code is tied to the browser that asked).
  return NextResponse.redirect(new URL(next === "/account/new-password" ? "/account?error=reset" : "/account?error=link", url.origin));
}
