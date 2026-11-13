import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { destinations } from "@/content/destinations";
import { MEDIA_FILES } from "@/content/media";
import { getVisibleMedia } from "@/lib/store";
import { MediaCard } from "@/components/media/MediaCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Watch & Discover",
  description: "Short films on how the Great Pyramid was built, the Nile's seasons and the rescue of Abu Simbel — with captions, transcripts, chapters and sources.",
};

export default async function WatchPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const all = await getVisibleMedia();
  const places = destinations.filter((x) => all.some((m) => m.destinations.includes(x.slug)));
  const active = places.find((x) => x.slug === d)?.slug;
  const list = active ? all.filter((m) => m.destinations.includes(active)) : all;
  const lead = all.find((m) => m.kind === "original" && m.featured) ?? all.find((m) => m.kind === "original");

  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-night pb-16 pt-40 text-ivory md:pb-24" aria-labelledby="watch-h">
        {lead && (
          // eslint-disable-next-line @next/next/no-img-element -- poster frame of our own film
          <img src={MEDIA_FILES(lead.id).backdrop} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-right opacity-80" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/75 to-night/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow !text-gold-300">Watch &amp; discover</p>
          <h1 id="watch-h" className="display-hero mt-5 max-w-4xl !text-ivory">
            The stories behind the stones.
          </h1>
          <p className="display-italic mt-6 max-w-2xl text-ivory/90">Short films to watch before you go — every one with captions, a full transcript, chapters and its sources.</p>
          {lead && (
            <Link href={`/watch/${lead.id}`} className="btn btn-gold mt-10">
              Start with “{lead.title.split(" — ")[0]}”
            </Link>
          )}
        </div>
      </section>

      <div id="films" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-16 md:px-8 md:py-20">
        {places.length > 1 && (
          <nav aria-label="Filter films by destination" className="mb-10 flex flex-wrap gap-2">
            <Link href="/watch#films" className="chip" aria-current={!active ? "page" : undefined}>
              All places
            </Link>
            {places.map((p) => (
              <Link key={p.slug} href={`/watch?d=${p.slug}#films`} className="chip" aria-current={active === p.slug ? "page" : undefined}>
                {p.name}
              </Link>
            ))}
          </nav>
        )}
        {list.length ? (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => (
              <li key={m.id}>
                <MediaCard item={m} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-limestone p-10 text-center text-muted">New films are on their way. Check back soon.</p>
        )}

        <aside className="mt-20 grid gap-6 rounded-[1.5rem] bg-limestone p-8 md:grid-cols-[auto_1fr] md:p-10" aria-labelledby="how-h">
          <ShieldCheck aria-hidden="true" size={28} className="text-ok" />
          <div>
            <h2 id="how-h" className="text-2xl">
              How we choose what to show
            </h2>
            <ul className="mt-4 grid gap-2 text-muted md:grid-cols-2">
              <li>Our own films are drawn from scratch and list a source for every claim. Where historians disagree, the film says so.</li>
              <li>Other creators&apos; videos are embedded from their own channels — never downloaded or re-uploaded.</li>
              <li>Nothing goes live until an editor has watched it, checked the facts and recorded its captions.</li>
              <li>Embedded videos load only when you press play, in YouTube&apos;s privacy-enhanced mode.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
