import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Album } from "@/components/memory/Album";
import { HuntProgress } from "@/components/memory/Hunt";

export const metadata: Metadata = {
  title: "My album — Egypt Memory Hunt",
  description: "Your Egypt memories as postcards: download print-ready PDFs, make an album, back up or print at a partner.",
  robots: { index: false, follow: true },
};

export default function AlbumPage() {
  return (
    <>
      <section className="on-dark bg-night pb-14 pt-36 text-ivory" aria-labelledby="album-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <Link href="/memory-hunt" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-300 underline underline-offset-4">
              <ArrowLeft aria-hidden="true" size={14} /> All challenges
            </Link>
            <p className="eyebrow mt-6 !text-gold-300">Egypt Memory Hunt</p>
            <h1 id="album-h" className="display-hero mt-4 !text-ivory">
              My album.
            </h1>
            <p className="mt-4 max-w-xl text-ivory/85">Every memory as a postcard, kept privately on this device.</p>
          </div>
          <HuntProgress />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        {/* Album reads ?saved= to confirm a new memory */}
        <Suspense fallback={<p className="text-muted">Opening your album…</p>}>
          <Album />
        </Suspense>
      </div>
    </>
  );
}
