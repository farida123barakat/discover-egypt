import type { Metadata } from "next";
import Link from "next/link";
import { destinations, INTERESTS, type Interest } from "@/content/destinations";
import { ramadanGuide } from "@/content/practical";
import type { PhotoKey } from "@/content/images";
import { getEvents } from "@/lib/store";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { FindYourEgypt } from "@/components/FindYourEgypt";
import { Timeline } from "@/components/Timeline";
import { ClimateChart, GoldenHourFinder } from "@/components/discover-extras";
import { DestinationCard } from "@/components/destinations";
import { Photo, Reveal, SectionHeading, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Discover", description: "Find the parts of Egypt that match you, explore an interactive map and walk through 5,000 years of history." };

export const dynamic = "force-dynamic";

/** Photos for the built-in events. Events added in the admin show without one. */
const EVENT_PHOTO: Record<string, PhotoKey> = {
  "coptic-christmas": "copticMuseum",
  "sun-feb": "abuSimbelSanctuary",
  "sun-oct": "abuSimbelSanctuary",
  ramadan: "lanterns",
  sham: "cairoTower",
};

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const events = await getEvents();
  const { i } = await searchParams;
  const initialInterests = (i ?? "").split(",").filter((x): x is Interest => (INTERESTS as readonly string[]).includes(x));
  return (
    <>
      <section className="on-dark relative overflow-hidden bg-midnight pb-20 pt-40 text-ivory">
        <Photo k="whiteDesert" priority className="absolute inset-0 h-full w-full opacity-45" />
        <div className="photo-scrim absolute inset-0 bg-gradient-to-t from-midnight to-midnight/30" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Discover Egypt</p>
          <h1 className="mt-4 max-w-4xl text-5xl !text-ivory md:text-7xl">Every traveller finds a different Egypt.</h1>
          <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2 text-sm">
            {[
              ["#find", "Find your Egypt"],
              ["#map", "Map"],
              ["#beyond", "Beyond the pyramids"],
              ["#timeline", "Walk through time"],
              ["#when", "Best time to visit"],
              ["#calendar", "Events"],
              ["#ramadan", "Ramadan"],
              ["#photo", "Golden hour"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="rounded-full border border-ivory/30 px-4 py-2 hover:bg-ivory/10">
                {l}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="find" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="find-h">
        <SectionHeading id="find-h" eyebrow="Find your Egypt" title="Your interests, matched." />
        <div className="card mt-10 p-6 md:p-10">
          <FindYourEgypt key={initialInterests.join(",")} initialInterests={initialInterests} />
        </div>
      </section>

      <section id="map" className="scroll-mt-24 bg-limestone py-24" aria-labelledby="map-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="map-h" eyebrow="Destination explorer" title="Explore the map." intro="Filter by what you love, select a place to see photos and nearby highlights, and save it to My Egypt." />
          <div className="mt-10">
            <DestinationExplorer />
          </div>
        </div>
      </section>

      <section id="beyond" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="beyond-h">
        <SectionHeading id="beyond-h" eyebrow="Hidden Egypt" title="Beyond the pyramids." intro="Fossil whales, salt lakes, Mamluk rooftops and painted Nubian villages." />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations
            .filter((d) => d.hiddenGem)
            .map((d) => (
              <li key={d.slug}>
                <Reveal>
                  <DestinationCard d={d} />
                </Reveal>
              </li>
            ))}
        </ul>
      </section>

      <section id="timeline" className="scroll-mt-24 bg-ivory py-24" aria-labelledby="time-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="time-h" eyebrow="Walk through time" title="Five thousand years, seven chapters." intro="Choose a period to see what happened — and where you can still see it today." />
          <div className="mt-12">
            <Timeline />
          </div>
        </div>
      </section>

      <section id="when" className="scroll-mt-24 bg-limestone py-24" aria-labelledby="when-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading id="when-h" eyebrow="Best time to visit" title="Choose your season." />
            <ul className="mt-8 space-y-5 text-lg">
              <li>
                <strong className="text-midnight">October–April:</strong> pleasant days for Cairo, Luxor and Aswan. Busiest season.
              </li>
              <li>
                <strong className="text-midnight">March–May & Sept–Nov:</strong> ideal on the Red Sea — warm water, comfortable air.
              </li>
              <li>
                <strong className="text-midnight">June–August:</strong> very hot in Upper Egypt. Great for the coast and Alexandria; visit temples at opening time.
              </li>
            </ul>
          </div>
          <ClimateChart />
        </div>
      </section>

      <section id="calendar" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="cal-h">
        <SectionHeading id="cal-h" eyebrow="Events calendar" title="Festivals & holy days." intro="Dates marked 'awaiting verification' depend on official announcements or the lunar calendar." />
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <li key={e.id} className="card overflow-hidden">
              {EVENT_PHOTO[e.id] && (
                <div className="relative aspect-[16/9] overflow-hidden" aria-hidden="true">
                  <Photo k={EVENT_PHOTO[e.id]} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="p-6">
              <p className="font-display text-lg text-gold-ink">{e.when}</p>
              <h3 className="mt-2 text-2xl">{e.name}</h3>
              <p className="mt-1 text-sm font-medium">{e.where}</p>
              <p className="mt-2 text-muted">{e.description}</p>
              <div className="mt-4">
                <StatusBadge status={e.status} lastVerified={e.lastVerified} />
              </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="ramadan" className="on-dark scroll-mt-24 bg-midnight py-24 text-ivory" aria-labelledby="ram-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:px-8">
          <div>
            <p className="eyebrow">Ramadan visitor guide</p>
            <h2 id="ram-h" className="mt-3 text-4xl !text-ivory md:text-5xl">
              Travelling during the holy month.
            </h2>
            <p className="mt-4 text-ivory/80">Ramadan is a beautiful time to visit — calmer days, glowing evenings, generous hospitality.</p>
          </div>
          <ul className="space-y-4">
            {ramadanGuide.map((r) => (
              <li key={r} className="flex gap-3 border-b border-ivory/10 pb-4">
                <span aria-hidden="true" className="text-gold">
                  ☾
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="photo" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8" aria-labelledby="photo-h">
        <SectionHeading id="photo-h" eyebrow="Golden hour finder" title="Photograph Egypt in its best light." intro="Pick a place and a date to see golden and blue hour times." />
        <div className="mt-10">
          <GoldenHourFinder />
        </div>
        <p className="mt-10">
          Looking for cultural experiences?{" "}
          <Link href="/experience" className="font-semibold text-nile underline">
            Experience Egypt →
          </Link>
        </p>
      </section>
    </>
  );
}
