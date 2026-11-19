import type { Metadata } from "next";
import Link from "next/link";
import { accessibility, embassies, emergencyNumbers, metroGuide, monumentTickets, soloWomen } from "@/content/practical";
import { walks } from "@/content/walks";
import { getPrices } from "@/lib/store";
import { RouteMap } from "@/components/MiniMap";
import { Photo, SectionHeading, StatusBadge } from "@/components/ui";
import { PhotoHero, PhotoStrip } from "@/components/design";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Travel Smart", description: "Emergency numbers, Cairo Metro fares, walking routes, safety, accessibility and fair prices in Egypt." };

export default async function TravelSmartPage() {
  const prices = await getPrices();
  return (
    <>
      <PhotoHero k="cairoTower" eyebrow="Travel smart" title="Practical, checked, honest." intro="Every number on this page shows when it was last checked and where it came from. Anything we could not verify is clearly marked.">
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
            {[
              ["#safety", "Emergency & safety"],
              ["#getting-around", "Getting around"],
              ["#walks", "Walking routes"],
              ["#prices", "Fair price guide"],
              ["#accessibility", "Accessibility"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="rounded-full border border-ivory/30 px-4 py-2 hover:bg-ivory/10">
                {l}
              </a>
            ))}
          </nav>
      </PhotoHero>

      <section id="safety" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8" aria-labelledby="safety-h">
        <SectionHeading id="safety-h" eyebrow="Traveller safety" title="Save these numbers." />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {emergencyNumbers.map((e) => (
            <li key={e.number} className="card p-6">
              <p className="text-sm font-semibold text-muted">{e.service}</p>
              <a href={`tel:${e.number}`} className="font-display mt-1 block text-6xl text-midnight hover:text-nile">
                {e.number}
              </a>
              <p className="mt-2 text-sm">{e.note}</p>
              <div className="mt-4">
                <StatusBadge status={e.status} lastVerified={e.lastVerified} source={e.source} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-8">
            <h3 className="text-2xl">Women travelling solo</h3>
            <ul className="mt-4 space-y-3">
              {soloWomen.map((s) => (
                <li key={s} className="flex gap-3">
                  <span aria-hidden="true" className="text-gold">
                    ✦
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-8">
            <h3 className="text-2xl">Embassy directory</h3>
            <p className="mt-2 text-sm text-muted">We link to each embassy&apos;s official website rather than copy phone numbers that can change.</p>
            <ul className="mt-4 divide-y divide-sand">
              {embassies.map((e) => (
                <li key={e.country} className="flex items-center justify-between py-3">
                  <span className="font-medium">{e.country}</span>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-nile underline">
                    Official website<span className="sr-only"> for {e.country} (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              General safety advice: check your own government&apos;s travel advice before and during your trip, for example{" "}
              <a className="text-nile underline" href="https://www.gov.uk/foreign-travel-advice/egypt" target="_blank" rel="noopener noreferrer">
                GOV.UK
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section id="getting-around" className="scroll-mt-24 bg-limestone py-20" aria-labelledby="around-h">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <SectionHeading id="around-h" eyebrow="Getting around" title="The Cairo Metro." />
            <ul className="mt-6 space-y-3">
              {metroGuide.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden="true" className="text-nile">
                    →
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <StatusBadge status={metroGuide.status} lastVerified={metroGuide.lastVerified} source={metroGuide.source} />
            </div>
            <PhotoStrip keys={["metro", "train"]} className="mt-10" />
          </div>
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-2xl">Airports</h3>
              <p className="mt-2">Use official taxi desks or ride-hailing apps from arrivals. Agree the fare before you get in a street taxi, or ask the driver to use the meter.</p>
            </div>
            <div className="card p-6">
              <h3 className="text-2xl">Between cities</h3>
              <p className="mt-2">
                Domestic flights save time on long routes; trains link Cairo, Alexandria, Luxor and Aswan. See{" "}
                <Link href="/plan" className="text-nile underline">
                  suggested routes and journey times
                </Link>
                .
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-2xl">Monument tickets</h3>
              <p className="mt-2">{monumentTickets.note}</p>
              <a href={monumentTickets.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
                Official ticket site
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="walks" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8" aria-labelledby="walks-h">
        <SectionHeading id="walks-h" eyebrow="Walking routes" title="Ready-made walks." />
        <div className="mt-10 space-y-20">
          {walks.map((w) => (
            <article key={w.slug} aria-labelledby={`${w.slug}-h`}>
              <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem]">
                    <Photo k={w.photo} className="absolute inset-0 h-full w-full" />
                  </div>
                  <h3 id={`${w.slug}-h`} className="mt-6 text-3xl">
                    {w.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-gold-ink">
                    {w.duration} · {w.distanceKm} km · {w.stops.length} stops
                  </p>
                  <p className="mt-3 text-muted">{w.intro}</p>
                  <ul className="mt-4 space-y-1 text-sm">
                    {w.tips.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <StatusBadge status={w.status} />
                  </div>
                </div>
                <div className="overflow-hidden rounded-[1.25rem] shadow-lg">
                  <RouteMap points={w.stops.map((s, i) => ({ id: s.name, lat: s.lat, lng: s.lng, label: `${i + 1}. ${s.name}`, sub: s.story, number: i + 1 }))} />
                </div>
              </div>
              <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {w.stops.map((s, i) => (
                  <li key={s.name} className="rounded-2xl bg-white p-5">
                    <p className="text-xs font-bold text-gold-ink">
                      STOP {i + 1} · ~{s.minutes} min
                    </p>
                    <p className="font-display mt-1 text-lg text-midnight">{s.name}</p>
                    <p className="mt-1 text-sm text-muted">{s.story}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="prices" className="scroll-mt-24 bg-ivory py-20" aria-labelledby="prices-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="prices-h" eyebrow="Fair price guide" title="What things usually cost." intro="Official fixed prices are marked 'Verified' with their source. Everything else is an estimate to help you spot an unfair price." />
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <caption className="sr-only">Reference prices in Egyptian pounds</caption>
              <thead className="text-sm text-muted">
                <tr>
                  <th scope="col" className="pb-3">Item</th>
                  <th scope="col" className="pb-3">Price (EGP)</th>
                  <th scope="col" className="pb-3">Type</th>
                  <th scope="col" className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-t border-sand">
                    <th scope="row" className="py-4 pr-4 font-medium text-midnight">
                      {p.item}
                    </th>
                    <td className="font-display py-4 text-xl text-midnight">{p.egp[0] === p.egp[1] ? p.egp[0] : `${p.egp[0]}–${p.egp[1]}`}</td>
                    <td className="py-4 text-sm">{p.kind === "official" ? "Official fixed price" : "Estimate"}</td>
                    <td className="py-4">
                      <StatusBadge status={p.status} lastVerified={p.lastVerified} source={p.source} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="accessibility" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8" aria-labelledby="acc-h">
        <SectionHeading id="acc-h" eyebrow="Accessibility" title="Travelling with access needs." intro={accessibility.intro} />
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <ul className="space-y-4">
            {accessibility.general.map((g) => (
              <li key={g} className="flex gap-3">
                <span aria-hidden="true" className="text-nile">
                  ◆
                </span>
                {g}
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {accessibility.sites.map((s) => (
              <li key={s.name} className="card p-5">
                <p className="font-display text-xl text-midnight">{s.name}</p>
                <p className="mt-1 text-sm">{s.detail}</p>
                <div className="mt-3">
                  <StatusBadge status="awaiting" />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8">
          Know a site&apos;s access details first-hand?{" "}
          <Link href="/contact" className="font-semibold text-nile underline">
            Tell us
          </Link>{" "}
          — we verify reports before publishing.
        </p>
      </section>
    </>
  );
}
