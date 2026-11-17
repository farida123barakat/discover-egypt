import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintStatusView } from "@/components/memory/PrintStatus";

export const metadata: Metadata = {
  title: "Postcard print status",
  // A collection code is a bearer link: keep status pages out of search engines.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PrintStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <Link href="/memory-hunt/album" className="inline-flex items-center gap-1 text-sm font-semibold text-nile underline underline-offset-4">
        <ArrowLeft aria-hidden="true" size={14} /> My album
      </Link>
      <p className="eyebrow mt-6">Postcard printing</p>
      <h1 className="mt-3 text-5xl">Print status</h1>
      <div className="mt-10">
        <PrintStatusView code={decodeURIComponent(code)} />
      </div>
    </div>
  );
}
