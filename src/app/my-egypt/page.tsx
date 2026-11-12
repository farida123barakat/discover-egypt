import type { Metadata } from "next";
import Link from "next/link";
import { MyEgyptDashboard } from "@/components/MyEgypt";

export const metadata: Metadata = { title: "My Egypt", description: "Your saved places, passport stamps, itinerary and packing list." };

export default function MyEgyptPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <p className="eyebrow">My Egypt</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Your travel dashboard.</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Saved in this browser only. Want it on your phone too?{" "}
        <Link href="/account" className="font-semibold text-nile underline underline-offset-4">Sync with an optional account</Link>.
      </p>
      <div className="mt-12">
        <MyEgyptDashboard />
      </div>
    </div>
  );
}
