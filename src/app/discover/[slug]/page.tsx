import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestination } from "@/content/destinations";
import { photos } from "@/content/images";
import { listPublished } from "@/lib/store";
import { AttractionList, DestinationCard, SaveButton, StampOnVisit } from "@/components/destinations";
import { Photo, Reveal } from "@/components/ui";
import { MiniMap } from "@/components/MiniMap";

export const dynamic = "force-dynamic";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = getDestination((await params).slug);
  return d ? { title: d.name, description: d.summary } : { title: "Not found" };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = getDestination((await params).slug);
  if (!d) notFound();
  const nearby = destinations
    .filter((x) => x.slug !== d.slug)
    .map((x) => ({ x, dist: km(d, x) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);
  const answers = (await listPublished("question", 30)).filter((q) => q.destination === d.slug && q.answer);
  const credit = d.photo ? photos[d.photo] : null;

  return (
    <>
      <StampOnVisit slug={d.slug} name={d.name} />
      <section className="on-dark relative flex min-h-[80svh] items-end overflow-hidden bg-midnight text-ivory">
        <Photo k={d.photo} priority label={d.name} className="absolute inset-0 h-full w-full" />
        <div className="photo-scrim absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-40 md:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-ivory/75">
            <Link href="/discover" className="underline">
              Discover
            </Link>{" "}
            / <span aria-current="page">{d.name}</span>
          </nav>
          <p className="eyebrow mt-6">
            {d.category} · {d.region}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <h1 className="text-6xl !text-ivory md:text-8xl">{d.name}</h1>
            <SaveButton slug={d.slug} name={d.name} />
          </div>
          <p className="mt-4 max-w-2xl text-xl text-ivory/85">{d.tagline}</p>
        </div>
        {credit && (
          <p className="absolute bottom-3 right-5 text-[11px] text-ivory/60">
            {credit.author}, {credit.license}
          </p>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-16 px-5 py-20 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Reveal>
            <p className="font-display text-3xl leading-snug text-midnight">{d.summary}</p>
          </Reveal>
          <h2 className="mt-14 text-3xl">Don&apos;t miss</h2>
          <AttractionList d={d} />
        </div>
        <aside className="space-y-6" aria-label="Plan your visit">
          <div className="card p-6">
            <h2 className="text-xl">At a glance</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-midnight">Ideal stay</dt>
                <dd>
                  {d.idealDays[0] === d.idealDays[1] ? `${d.idealDays[0]} day` : `${d.idealDays[0]}–${d.idealDays[1]} days`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-midnight">Best months</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {MONTHS.map((m, i) => (
                    <span key={m} className={`rounded px-1.5 py-0.5 text-xs ${d.bestMonths.includes(i + 1) ? "bg-nile text-ivory" : "bg-sand/50 text-muted"}`}>
                      {m}
                      <span className="sr-only">{d.bestMonths.includes(i + 1) ? " (recommended)" : ""}</span>
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-midnight">Photo tip</dt>
                <dd>
                  {d.photoTip.spot} — {d.photoTip.light}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-midnight">Accessibility</dt>
                <dd>
                  Awaiting verification. <Link href="/travel-smart#accessibility" className="text-nile underline">How we check access information</Link>
                </dd>
              </div>
            </dl>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <MiniMap lat={d.lat} lng={d.lng} label={d.name} />
          </div>
          <div className="rounded-2xl bg-gold/10 p-6">
            <p className="font-display text-xl text-midnight">Passport stamp collected ✦</p>
            <p className="mt-1 text-sm">{d.passportFact}</p>
          </div>
          <Link href={`/plan?from=${d.slug}&days=${d.idealDays[1]}`} className="btn btn-primary w-full">
            Plan a trip to {d.name}
          </Link>
        </aside>
      </section>

      <section className="bg-limestone py-20" aria-labelledby="qa-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 id="qa-h" className="text-4xl">
            Locals answer
          </h2>
          {answers.length ? (
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {answers.map((q) => (
                <li key={q.id} className="card p-6">
                  <p className="font-semibold text-midnight">“{q.body}”</p>
                  <p className="mt-1 text-sm text-muted">— {q.firstName}</p>
                  <p className="mt-4 border-l-4 border-gold pl-4">{q.answer}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted">No questions about {d.name} have been answered yet.</p>
          )}
          <Link href="/community" className="btn btn-ghost mt-8">
            Ask a local about {d.name}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8" aria-labelledby="near-h">
        <h2 id="near-h" className="text-4xl">
          Nearby
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {nearby.map(({ x, dist }) => (
            <li key={x.slug}>
              <DestinationCard d={x} />
              <p className="mt-2 text-sm text-muted">About {Math.round(dist)} km away (straight line)</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
