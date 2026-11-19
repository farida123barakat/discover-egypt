import type { Metadata } from "next";
import Link from "next/link";
import { MyEgyptDashboard } from "@/components/MyEgypt";
import { PhotoHero } from "@/components/design";
import { backendMode } from "@/lib/env";

export const metadata: Metadata = { title: "My Egypt", description: "Your saved places, passport stamps, itinerary and packing list." };

export default function MyEgyptPage() {
  return (
    <>
    <PhotoHero k="felucca" eyebrow="My Egypt" title="Your travel dashboard." />
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-8">
      <p className="max-w-2xl text-muted">
        Saved in this browser only, with no account needed.
        {backendMode() === "supabase" && (
          <>
            {" "}Want it on your phone too?{" "}
            <Link href="/account" className="font-semibold text-nile underline underline-offset-4">Sync with an optional account</Link>.
          </>
        )}
      </p>
      <div className="mt-12">
        <MyEgyptDashboard />
      </div>
    </div>
    </>
  );
}
