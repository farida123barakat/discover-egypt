import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { MemoryEditor } from "@/components/memory/MemoryEditor";

export const metadata: Metadata = {
  title: "Save a memory — Egypt Memory Hunt",
  description: "Add a photo and a few words, choose a postcard design and keep the memory in your album. Saved privately on your device.",
  robots: { index: false, follow: true },
};

export default function NewMemoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <Link href="/memory-hunt" className="inline-flex items-center gap-1 text-sm font-semibold text-nile underline underline-offset-4">
        <ArrowLeft aria-hidden="true" size={14} /> All challenges
      </Link>
      <p className="eyebrow mt-6">Egypt Memory Hunt</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Save a memory.</h1>
      <p className="mt-4 max-w-2xl text-muted">A photo, a few words, or both. You&rsquo;ll see the postcard take shape as you type.</p>
      <div className="mt-12">
        {/* MemoryEditor reads ?challenge= and ?id= from the URL */}
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <MemoryEditor />
        </Suspense>
      </div>
    </div>
  );
}
