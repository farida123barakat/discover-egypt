import Link from "next/link";
import { destinations, getDestination } from "@/content/destinations";
import { dishes } from "@/content/culture";
import { getEvents, getFeatured, listPublished } from "@/lib/store";
import { DestinationCard } from "@/components/destinations";
import { FindYourEgypt } from "@/components/FindYourEgypt";
import { Counter, Photo, Reveal, SectionHeading, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function Home() {
  const month = new Date().getMonth() + 1;
  const inSeason = destinations.filter((d) => d.bestMonths.includes(month)).slice(0, 6);
  const gems = destinations.filter((d) => d.hiddenGem);
  const stories = await listPublished("story", 3);
  const upcoming = (await getEvents()).filter((e) => !e.dateISO || e.dateISO >= new Date().toISOString().slice(0, 10)).slice(0, 4);
  const [luxor, aswan, alex, dahab] = (await getFeatured()).map((s) => getDestination(s)!);

  return (
    <>
      {/* 1–4. Hero */}
      <section className="on-dark relative flex min-h-[100svh] items-end overflow-hidden bg-midnight text-ivory" aria-labelledby="hero-h">
        <Photo k="giza" priority className="absolute inset-0 h-full w-full scale-105 motion-safe:animate-[heroZoom_20s_ease-out_forwards]" sizes="100vw" />
        <div className="photo-scrim absolute inset-0 bg-gradient-to-t from-midnight via-midnight/45 to-midnight/10" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-40 md:px-8 md:pb-28">
          <Reveal>
            <p className="eyebrow">A thousand stories. One destination.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 id="hero-h" className="mt-5 max-w-4xl text-5xl !text-ivory sm:text-6xl md:text-8xl">
              Five thousand years old. <em className="text-sand not-italic md:italic">Still unfolding.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg text-ivory/85 md:text-xl">
              Pyramids at dawn, coral reefs at noon, a Cairo rooftop at midnight. Find the Egypt that is yours.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/discover" className="btn btn-light">
                Discover Egypt
              </Link>
              <Link href="/plan" className="btn btn-ghost text-ivory">
                Plan your journey
              </Link>
            </div>
          </Reveal>
        </div>
        <p className="absolute bottom-4 right-5 text-[11px] text-ivory/60 md:right-8">Giza pyramids · Ricardo Liberato, CC BY-SA 2.0</p>
      </section>

      {/* Intro + counters */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="eyebrow">More than monuments</p>
            <p className="font-display mt-4 text-3xl leading-snug text-midnight md:text-[2.6rem]">
              Egypt is the hush of a Nubian village at sunset, the clatter of a Cairo ahwa, a whale skeleton in the desert, a reef so bright it looks unreal. It is ancient — and very much alive.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-10 self-end">
            <Counter to={7} label="UNESCO World Heritage Sites" />
            <Counter to={destinations.length} label="Destinations to explore here" />
            <Counter to={dishes.length} label="Dishes to taste" />
            <Counter to={4} label="Climates: river, sea, desert, oasis" />
          </div>
        </div>
      </section>

      {/* 5. Find Your Egypt */}
      <section id="find" className="bg-limestone py-24 md:py-32" aria-labelledby="find-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="find-h" eyebrow="Find your Egypt" title="Tell us what moves you." intro="Four quick questions. We'll match you with the places that fit — and explain why." />
          <div className="card mt-12 p-6 md:p-10">
            <FindYourEgypt />
          </div>
        </div>
      </section>

      {/* 6. Featured destinations — editorial grid */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" aria-labelledby="feat-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="feat-h" eyebrow="Featured destinations" title="Where the story begins." />
          <Link href="/discover" className="font-semibold text-nile underline underline-offset-4">
            See all {destinations.length} destinations
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-7 md:row-span-2">
            <DestinationCard d={luxor} size="lg" />
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.1}>
            <DestinationCard d={aswan} />
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.15}>
            <div className="grid grid-cols-2 gap-6">
              <DestinationCard d={alex} />
              <DestinationCard d={dahab} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Beyond the Pyramids */}
      <section className="on-dark bg-midnight py-24 text-ivory md:py-32" aria-labelledby="beyond-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Beyond the pyramids</p>
          <h2 id="beyond-h" className="mt-3 max-w-3xl text-4xl !text-ivory md:text-6xl">
            The places even Egyptians are still discovering.
          </h2>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gems.map((d, i) => (
              <li key={d.slug}>
                <Reveal delay={i * 0.05}>
                  <DestinationCard d={d} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. Seasonal highlights */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" aria-labelledby="season-h">
        <SectionHeading id="season-h" eyebrow={`In season · ${MONTHS[month - 1]}`} title="Perfect right now." intro="Destinations at their best this month, based on typical weather and crowds." />
        <ul className="mt-12 flex snap-x gap-5 overflow-x-auto pb-4">
          {inSeason.map((d) => (
            <li key={d.slug} className="w-72 shrink-0 snap-start">
              <Link href={`/discover/${d.slug}`} className="photo-zoom group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem]">
                  <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full" />
                </div>
                <p className="font-display mt-4 text-2xl text-midnight group-hover:underline">{d.name}</p>
                <p className="text-sm text-muted">{d.photoTip.light}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 9. Culture & food */}
      <section className="bg-limestone py-24 md:py-32" aria-labelledby="culture-h">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-2 md:px-8">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <Photo k="koshari" className="absolute inset-0 h-full w-full" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Culture & food</p>
            <h2 id="culture-h" className="mt-3 text-4xl md:text-6xl">
              Taste first. Ask questions later.
            </h2>
            <p className="mt-6 text-lg text-muted">
              A steaming bowl of koshari for a few dollars. Ful and taameya at a breakfast cart. Molokhia at a family table. Learn the dishes, the stories behind them, and a few words of Egyptian Arabic to order like a local.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/experience#taste" className="btn btn-primary">
                Taste Egypt
              </Link>
              <Link href="/experience#decode" className="btn btn-ghost">
                Learn some Arabic
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10. Events */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" aria-labelledby="events-h">
        <SectionHeading id="events-h" eyebrow="Upcoming" title="Festivals & moments." />
        <ul className="mt-12 divide-y divide-sand border-y border-sand">
          {upcoming.map((e) => (
            <li key={e.id} className="grid gap-3 py-6 md:grid-cols-[220px_1fr_auto] md:items-center">
              <p className="font-display text-xl text-gold-ink">{e.when}</p>
              <div>
                <h3 className="text-2xl">{e.name}</h3>
                <p className="text-muted">
                  {e.where} · {e.description}
                </p>
              </div>
              <StatusBadge status={e.status} lastVerified={e.lastVerified} />
            </li>
          ))}
        </ul>
        <Link href="/discover#calendar" className="mt-6 inline-block font-semibold text-nile underline underline-offset-4">
          Full events calendar
        </Link>
      </section>

      {/* 11. Traveller stories */}
      <section className="bg-sand/40 py-24 md:py-32" aria-labelledby="stories-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="stories-h" eyebrow="Traveller stories" title="Egypt, in their words." />
          {stories.length ? (
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {stories.map((s) => (
                <li key={s.id} className="card p-7">
                  <p className="eyebrow">{getDestination(s.destination)?.name}</p>
                  <h3 className="mt-3 text-2xl">{s.title}</h3>
                  <p className="mt-3 line-clamp-5 text-muted">{s.body}</p>
                  <p className="mt-5 text-sm font-semibold">
                    {s.firstName}
                    {s.country ? `, ${s.country}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10 rounded-2xl bg-ivory p-10 text-center">
              <p className="font-display text-2xl text-midnight">Be the first to share a story.</p>
              <p className="mx-auto mt-2 max-w-md text-muted">Every story is read by our team before it appears here. We never publish your email.</p>
            </div>
          )}
          <Link href="/community#story" className="btn btn-primary mt-10">
            Share your story
          </Link>
        </div>
      </section>
    </>
  );
}
