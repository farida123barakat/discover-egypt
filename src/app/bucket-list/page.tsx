import { backendMode } from "@/lib/env";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getBucketPublished } from "@/lib/store";
import { Photo } from "@/components/ui";
import { BucketList, BucketProgress } from "@/components/bucket/BucketList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The Egypt bucket list",
  description: "Sunrise balloons over Luxor, a night in the White Desert, koshari in Cairo — tick off Egypt's unforgettable experiences and collect your stamps.",
};

export default async function BucketListPage() {
  const activities = await getBucketPublished();
  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-night pb-16 pt-40 text-ivory md:pb-20" aria-labelledby="bucket-h">
        <div className="golden-grade absolute inset-0 -z-10">
          <Photo k="luxorBalloons" priority className="absolute inset-0 h-full w-full" sizes="100vw" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="eyebrow !text-gold-300">The Egypt challenge</p>
            <h1 id="bucket-h" className="display-hero mt-5 !text-ivory">
              Your Egypt bucket list.
            </h1>
            <p className="display-italic mt-6 max-w-xl text-ivory/90">{activities.length} experiences worth crossing a continent for. How many will you tick off?</p>
          </div>
          <BucketProgress activities={activities} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <p className="mb-12 flex flex-wrap items-center gap-2 rounded-2xl bg-limestone p-4 text-sm text-muted">
          <ShieldCheck aria-hidden="true" size={16} className="text-ok" />
          Your progress is saved on this device.
          {backendMode() === "supabase" && (
            <>
              <Link href="/account" className="font-semibold text-nile underline underline-offset-4">
                Sign in to keep it in your account
              </Link>
              (optional).
            </>
          )}
        </p>
        {activities.length ? <BucketList activities={activities} /> : <p className="rounded-2xl bg-limestone p-10 text-center text-muted">New experiences are being added. Check back soon.</p>}
      </div>
    </>
  );
}
