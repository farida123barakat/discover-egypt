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
 * Fail safely: a production deployment on Vercel without the Supabase settings would quietly run with
 * no database (and local demo mode is refused there). Stop the build with instructions instead.
 * Set ALLOW_NO_BACKEND=true to deploy the browser-only features on purpose (e.g. a static showcase).
 */
if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_NO_BACKEND !== "true") {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Production build stopped: set ${missing.join(", ")} in Vercel → Settings → Environment Variables (see docs/DEPLOYMENT.md), or set ALLOW_NO_BACKEND=true to deploy without a database on purpose.`);
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Commons serves pre-sized thumbnails, so we skip the optimiser (no server-side fetching of remote URLs).
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
