import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Map, PenLine, Route, ScanSearch, Stamp, Sun, UtensilsCrossed } from "lucide-react";
import { destinations, getDestination } from "@/content/destinations";
import { dishes } from "@/content/culture";
import type { PhotoKey } from "@/content/images";
import { proverbOfTheDay } from "@/content/proverbs";
import { getEvents, getFeatured, listPublished } from "@/lib/store";
import { DestinationCard } from "@/components/destinations";
import { FeatureStrip, PhotoCard, SectionHeader } from "@/components/design";
import { Hero } from "@/components/Hero";
import { ProverbCard } from "@/components/ProverbCard";
import { Counter, Photo, Reveal, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EVENT_PHOTO: Record<string, PhotoKey> = { "sun-feb": "abuSimbel", "sun-oct": "abuSimbel", "coptic-christmas": "coptic", ramadan: "azhar", sham: "aswan", ciff: "cairo" };

const FEATURES = [
  { href: "/discover#map", label: "Interactive", sub: "Egypt map", icon: Map },
  { href: "/plan#builder", label: "Smart trip", sub: "builder", icon: Route },
  { href: "/experience#taste", label: "Taste Egypt", sub: "dishes & stories", icon: UtensilsCrossed },
  { href: "/discover#timeline", label: "Walk through", sub: "5,000 years", icon: BookOpen },
  { href: "/hieroglyphs", label: "Hieroglyph", sub: "explorer", icon: ScanSearch },
  { href: "/my-egypt", label: "Egypt travel", sub: "passport & stamps", icon: Stamp },
];

export default async function Home() {
  const month = new Date().getMonth() + 1;
  const today = new Date().toISOString().slice(0, 10);
  const inSeason = destinations.filter((d) => d.bestMonths.includes(month)).slice(0, 8);
  const gems = destinations.filter((d) => d.hiddenGem).slice(0, 6);
  const [stories, events, featured] = await Promise.all([listPublished("story", 3), getEvents(), getFeatured()]);
  const upcoming = events.filter((e) => e.dateISO && e.dateISO >= today).slice(0, 3);
  const next = upcoming[0];
  const top = featured.map((s) => getDestination(s)!).filter(Boolean);
  const proverb = proverbOfTheDay();

  return (
    <>
      <Hero />

      {/* Top destinations rail */}
      <section className="bg-ivory py-16 md:py-20" aria-labelledby="top-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[260px_1fr] lg:items-center">
          <Reveal>
            <span aria-hidden="true" className="mb-5 block h-0.5 w-12 bg-gold" />
            <h2 id="top-h" className="text-4xl md:text-5xl">
              Top destinations
            </h2>
            <p className="mt-3 text-lg text-muted">From ancient wonders to the Red Sea.</p>
            <Link href="/discover#map" className="btn btn-primary mt-7">
              Explore all places <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </Reveal>
          <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {top.map((d, i) => (
              <li key={d.slug} className="w-[68vw] shrink-0 snap-start sm:w-[40vw] lg:w-auto">
                <Reveal delay={i * 0.06}>
                  <PhotoCard href={`/discover/${d.slug}`} photo={d.photo} title={d.name} subtitle={d.tagline} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FeatureStrip items={FEATURES} label="Plan with our tools" />

      {/* Editorial intro */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" aria-labelledby="intro-h">
        <div className="grid gap-16 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <p className="eyebrow">More than monuments</p>
            <h2 id="intro-h" className="sr-only">
              More than monuments
            </h2>
            <p className="font-display mt-5 text-3xl leading-snug text-midnight md:text-[2.6rem]">
              Egypt is the hush of a Nubian village at sunset, the clatter of a Cairo <em>ahwa</em>, a whale skeleton in the desert, a reef so bright it looks unreal. Ancient — and very much alive.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-10 self-end border-l-0 border-sand lg:border-l lg:pl-12">
            <Counter to={7} label="UNESCO World Heritage Sites" />
            <Counter to={destinations.length} label="Destinations to explore" />
            <Counter to={dishes.length} label="Dishes to taste" />
            <Counter to={4} label="Landscapes: river, sea, desert, oasis" />
          </div>
        </div>
      </section>

      {/* Passport · Events · Stories */}
      <section className="bg-limestone py-20 md:py-24" aria-label="Passport, events and stories">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:px-8 lg:grid-cols-[1.15fr_1fr_1fr]">
          <Reveal>
            <Link href="/my-egypt" className="card group relative flex h-full min-h-[300px] overflow-hidden bg-[radial-gradient(circle_at_80%_30%,#f6ead2,#efe0c2)] p-8">
              <div className="relative z-10 max-w-[64%] sm:max-w-[55%]">
                <h2 className="text-3xl md:text-4xl">Get your Egypt passport</h2>
                <p className="mt-3 text-muted">Collect a stamp for every place you explore, each with a small story.</p>
                <span className="btn btn-ghost btn-sm mt-6 text-midnight">
                  Start collecting <ArrowRight aria-hidden="true" size={15} />
                </span>
              </div>
              <PassportArt />
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card flex h-full flex-col p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl">Upcoming events</h2>
                <Link href="/discover#calendar" className="text-sm font-semibold text-nile underline underline-offset-4">
                  Calendar
                </Link>
              </div>
              {next ? (
                <div className="mt-5 flex flex-1 flex-col">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                    <Photo k={EVENT_PHOTO[next.id] ?? "cairo"} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 30vw, 100vw" />
                    <DateBadge iso={next.dateISO!} />
                  </div>
                  <h3 className="mt-4 text-xl">{next.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {next.where} · {next.when}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={next.status} lastVerified={next.lastVerified} source={next.source} />
                  </div>
                  {upcoming.length > 1 && (
                    <ul className="mt-4 space-y-2 border-t border-sand pt-4 text-sm">
                      {upcoming.slice(1).map((e) => (
                        <li key={e.id} className="flex gap-3">
                          <CalendarDays aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-gold-ink" />
                          <span>
                            <strong>{e.name}</strong> <span className="text-muted">· {e.when}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-muted">No dated events right now. See the full calendar for festivals awaiting official dates.</p>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="card flex h-full flex-col p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl">Traveller stories</h2>
                <Link href="/community#story" className="text-sm font-semibold text-nile underline underline-offset-4">
                  Share yours
                </Link>
              </div>
              {stories.length ? (
                <ul className="mt-5 space-y-5">
                  {stories.map((s) => (
                    <li key={s.id}>
                      <p className="font-display text-lg leading-snug text-midnight">&ldquo;{s.title}&rdquo;</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{s.body}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold-ink">
                        {s.firstName}
                        {s.country ? `, ${s.country}` : ""} · {getDestination(s.destination)?.name}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 flex flex-1 flex-col items-start justify-center rounded-2xl bg-limestone/70 p-6">
                  <PenLine aria-hidden="true" size={26} strokeWidth={1.5} className="text-gold-ink" />
                  <p className="mt-3 font-display text-xl text-midnight">Real travellers, real words.</p>
                  <p className="mt-1 text-sm text-muted">Stories appear here after our team reads them. We never publish your email — and we never invent reviews.</p>
                  <Link href="/community#story" className="btn btn-primary btn-sm mt-5">
                    Be the first
                  </Link>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Beyond the pyramids */}
      <section className="on-dark bg-midnight py-24 text-ivory md:py-32" aria-labelledby="beyond-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader id="beyond-h" tone="light" eyebrow="Beyond the pyramids" title="The places even Egyptians are still discovering." action={{ href: "/discover#beyond", label: "All hidden gems" }} />
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

      {/* Proverb of the day */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-28" aria-label="Egyptian proverb">
        <Reveal>
          <ProverbCard initialId={proverb.id} />
        </Reveal>
      </section>

      {/* In season */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32" aria-labelledby="season-h">
        <SectionHeader id="season-h" eyebrow={`In season · ${MONTHS[month - 1]}`} title="Perfect right now." intro="At their best this month, based on typical weather and crowds." />
        <ul className="mt-12 flex snap-x gap-5 overflow-x-auto pb-4">
          {inSeason.map((d) => (
            <li key={d.slug} className="w-72 shrink-0 snap-start">
              <Link href={`/discover/${d.slug}`} className="photo-zoom group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem]">
                  <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full" sizes="288px" />
                </div>
                <p className="font-display mt-4 text-2xl text-midnight group-hover:underline">{d.name}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted">
                  <Sun aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-gold-ink" />
                  {d.photoTip.light}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Taste Egypt */}
      <section className="bg-limestone py-24 md:py-32" aria-labelledby="culture-h">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-2 md:px-8">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] shadow-[var(--shadow-lift)]">
              <Photo k="koshari" className="absolute inset-0 h-full w-full" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeader id="culture-h" eyebrow="Taste Egypt" title="Taste first. Ask questions later." />
            <p className="mt-6 text-lg text-muted">
              A steaming bowl of koshari for a few dollars. Ful and taameya at a breakfast cart. Molokhia at a family table. Learn the dishes, the stories behind them, and a few words of Egyptian Arabic to order like a local.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/experience#taste" className="btn btn-primary">
                Explore the food guide <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link href="/experience#decode" className="btn btn-ghost">
                Learn some Arabic
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function DateBadge({ iso }: { iso: string }) {
  const d = new Date(iso + "T00:00:00Z");
  return (
    <span className="absolute right-3 top-3 flex w-14 flex-col items-center rounded-xl bg-ivory py-1.5 text-midnight shadow-[var(--shadow-soft)]">
      <span className="font-display text-2xl leading-none">{d.getUTCDate()}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span>
    </span>
  );
}

/** Original illustration of the digital passport (no copied artwork). */
function PassportArt() {
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true" className="absolute -bottom-8 -right-6 w-[42%] max-w-[230px] sm:-bottom-6 sm:-right-4 sm:w-[52%] rotate-[8deg] drop-shadow-[0_24px_30px_rgb(15_27_45/0.35)] transition-transform duration-700 group-hover:rotate-[4deg]">
      <rect x="10" y="8" width="170" height="224" rx="12" fill="#14243c" />
      <rect x="10" y="8" width="14" height="224" rx="6" fill="#0d192b" />
      <rect x="34" y="22" width="132" height="196" rx="8" fill="none" stroke="#c9a35a" strokeOpacity="0.55" />
      <text x="100" y="62" textAnchor="middle" fill="#e4c486" fontFamily="Georgia, serif" fontSize="22" letterSpacing="3">EGYPT</text>
      <text x="100" y="82" textAnchor="middle" fill="#e4c486" fontFamily="Georgia, serif" fontSize="11" letterSpacing="4">PASSPORT</text>
      <g transform="translate(100 140)" stroke="#e4c486" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <circle r="20" />
        <path d="M0-34v6M-25-25l4 4M25-25l-4 4M-34 0h6M28 0h6" />
        <path d="M-40 30h80" />
        <path d="M-30 40c5-3 10-3 15 0s10 3 15 0 10-3 15 0 10 3 15 0" />
      </g>
      <g transform="translate(150 200) rotate(-14)" opacity="0.85">
        <circle r="22" fill="none" stroke="#c56a2d" strokeWidth="2" strokeDasharray="3 3" />
        <text textAnchor="middle" y="4" fill="#c56a2d" fontFamily="Georgia, serif" fontSize="9" letterSpacing="1">LUXOR</text>
      </g>
    </svg>
  );
}
