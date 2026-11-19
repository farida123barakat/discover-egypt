import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/components/Providers";
import { BackendNotice } from "@/components/BackendNotice";
import { backendMode } from "@/lib/env";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "Discover Egypt — A thousand stories. One destination.", template: "%s · Discover Egypt" },
  description:
    "Plan a trip to Egypt: find destinations that match you, build a day-by-day itinerary, estimate your budget, and travel with confidence.",
  openGraph: { type: "website", siteName: "Discover Egypt", locale: "en_GB" },
};

export const viewport: Viewport = { themeColor: "#0f1b2d", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = backendMode();
  // Reading the per-request CSP nonce makes every page render dynamically, so Next.js can stamp the
  // nonce on its scripts. Statically prerendered pages would otherwise be blocked by the strict CSP.
  await headers();
  // dir/lang are set here so Arabic (rtl) can be added later via a [locale] segment.
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Without JavaScript, scroll-reveal content would stay at opacity 0 — show it instead. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <SiteHeader accounts={mode === "supabase"} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter offline={mode === "none"} />
          <BackendNotice />
        </Providers>
      </body>
    </html>
  );
}
