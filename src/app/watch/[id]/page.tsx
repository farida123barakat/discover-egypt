import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, MapPin, TriangleAlert } from "lucide-react";
import { getDestination } from "@/content/destinations";
import { formatDuration, mediaSeed } from "@/content/media";
import { getVisibleMedia } from "@/lib/store";
import { backendMode } from "@/lib/env";
import { MediaPlayer } from "@/components/media/MediaPlayer";
import { MediaCard } from "@/components/media/MediaCard";

export const dynamic = "force-dynamic";

/**
 * Every page this route has, for the plain-files GitHub Pages build. Taken from the content files,
 * never the database: this runs at build time, outside any request.
 */
export function generateStaticParams() {
  return mediaSeed.map((m) => ({ id: m.id }));
}

async function find(id: string) {
  const list = await getVisibleMedia();
  return { m: list.find((x) => x.id === id), list };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { m } = await find((await params).id);
  return m ? { title: m.title, description: m.summary } : { title: "Video not found" };
}

export default async function WatchItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { m, list } = await find((await params).id);
  if (!m) notFound();
  const places = m.destinations.map((s) => getDestination(s)).filter((d) => !!d);
  const more = list.filter((x) => x.id !== m.id && x.destinations.some((d) => m.destinations.includes(d))).slice(0, 3);

  return (
    <article className="pb-24 pt-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Link href="/watch" className="inline-flex items-center gap-2 text-sm font-semibold text-nile">
          <ArrowLeft aria-hidden="true" size={15} /> Watch &amp; discover
        </Link>
        <header className="mt-6 max-w-4xl">
          <p className="eyebrow">{m.kind === "original" ? "Discover Egypt original" : `From ${m.channel}`}</p>
          <h1 className="mt-3 text-4xl md:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg text-muted">{m.summary}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" size={15} /> {formatDuration(m.durationSec)}
            </span>
            <span>{m.period}</span>
            {places.map((d) => (
              <Link key={d.slug} href={`/discover/${d.slug}`} className="inline-flex items-center gap-1 font-semibold text-nile underline underline-offset-4">
                <MapPin aria-hidden="true" size={14} /> {d.name}
              </Link>
            ))}
          </p>
        </header>

        {m.status !== "published" && (
          <p role="note" className="mt-8 flex items-start gap-3 rounded-2xl border border-[#8a3f14]/40 bg-[#8a3f14]/10 p-4 text-sm">
            <TriangleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-[#8a3f14]" />
            <span>
              <strong>Draft — awaiting editorial review.</strong>{" "}
              {backendMode() === "local"
                ? "You can see this because the site is running in demo mode. With a database it is hidden until an editor has checked"
                : "An editor hasn’t yet checked"}
              {m.kind === "original" ? " every fact against the sources below." : " that the video plays, its length and its captions."}
            </span>
          </p>
        )}

        <div className="mt-10">
          <MediaPlayer item={m} />
        </div>

        <section aria-labelledby="src-h" className="mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="src-h" className="text-2xl">
              Sources
            </h2>
            {m.sources.length ? (
              <ul className="mt-4 space-y-2">
                {m.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-nile underline underline-offset-4">
                      {s.name} <ExternalLink aria-hidden="true" size={13} className="mt-1 shrink-0" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">Sources have not been added yet.</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl">Credit &amp; licence</h2>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="font-semibold">Made by</dt>
              <dd>{m.credit}</dd>
              <dt className="font-semibold">Licence</dt>
              <dd>{m.license}</dd>
              {m.kind === "original" && (
                <>
                  <dt className="font-semibold">How it was made</dt>
                  <dd>Animated from scratch; the script was drafted with AI assistance from the listed sources{m.lastReviewed ? ` and checked by an editor on ${m.lastReviewed}` : ""}.</dd>
                </>
              )}
              {m.kind === "youtube" && m.lastReviewed && (
                <>
                  <dt className="font-semibold">Checked</dt>
                  <dd>{m.lastReviewed}</dd>
                </>
              )}
            </dl>
          </div>
        </section>

        {more.length > 0 && (
          <section aria-labelledby="more-h" className="mt-20">
            <h2 id="more-h" className="text-3xl">
              More from these places
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((x) => (
                <li key={x.id}>
                  <MediaCard item={x} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
