import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function buildCsp(nonce: string, dev: boolean) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Leaflet and the animation library set inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://thumb.wikimedia.org https://upload.wikimedia.org https://tile.openstreetmap.org ${supabase}`.trim(),
    `connect-src 'self' ${supabase}${dev ? " ws:" : ""}`.trim(),
    "font-src 'self'",
    "media-src 'self' blob:",
    // Embedded videos load from YouTube's privacy-enhanced domain only, and only after a click.
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let res = NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh the Supabase session cookie when Supabase is configured.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: requestHeaders } });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|sounds/|media/).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
