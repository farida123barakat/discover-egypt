import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/**
 * The site works with no database at all (front-end only): everything visitors save stays in their browser.
 * Supabase is optional. What is never fine is a half-finished setup, which would quietly run without
 * accounts, so stop the build if some Supabase settings are present and others are missing.
 */
{
  const has = (...names: string[]) => names.some((n) => !!process.env[n]);
  const parts = {
    NEXT_PUBLIC_SUPABASE_URL: has("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: has("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SECRET_KEY: has("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  };
  const set = Object.values(parts).filter(Boolean).length;
  if (set > 0 && set < 3) {
    const missing = Object.entries(parts).filter(([, ok]) => !ok).map(([n]) => n);
    throw new Error(`Build stopped: Supabase is only partly configured. Set ${missing.join(", ")} too, or remove the Supabase settings to run front-end only (see docs/DEPLOYMENT.md).`);
  }
}

/**
 * GitHub Pages build (scripts/build-pages.sh): plain HTML files with no server, served under
 * https://<user>.github.io/<repo>/, so every address gets the repo name as a prefix.
 */
const STATIC_EXPORT = process.env.STATIC_EXPORT === "true";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(STATIC_EXPORT ? { output: "export" as const, trailingSlash: true, basePath: BASE_PATH } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Commons serves pre-sized thumbnails, so we skip the optimiser (no server-side fetching of remote URLs).
    unoptimized: true,
  },
  // Plain-file hosts can't send headers; on GitHub Pages the platform's own headers apply.
  ...(STATIC_EXPORT
    ? {}
    : {
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
