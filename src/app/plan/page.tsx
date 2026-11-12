import type { Metadata } from "next";
import { Suspense } from "react";
import { routes } from "@/content/practical";
import { BudgetCalculator, CurrencyConverter, PackingList, TripBuilder } from "@/components/planning";
import { SectionHeading, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Plan your journey", description: "Build a day-by-day Egypt itinerary, estimate your budget and convert currency." };

const MONTH_GUIDE = [
  ["Dec–Feb", "Cool and sunny in the Nile Valley — peak season. Evenings in the desert can be cold."],
  ["Mar–Apr", "Warm days and spring festivals. Occasional dusty khamsin winds."],
  ["May–Sep", "Hot inland; perfect for the Red Sea and the Mediterranean coast."],
  ["Oct–Nov", "Heat eases, Red Sea still warm — a sweet spot for combining both."],
];

const PREP = [
  "Check visa rules for your nationality on Egypt's official e-visa portal (visa2egypt.gov.eg) before you book.",
  "Make sure your passport is valid for at least six months after arrival.",
  "Get travel insurance that covers medical care and any diving or adventure activities.",
  "Tell your bank you're travelling and carry a mix of card and cash.",
  "Download offline maps and a ride-hailing app before you land.",
];

export default function PlanPage() {
  return (
    <>
      <section className="bg-limestone pb-16 pt-36">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="eyebrow">Plan your journey</p>
          <h1 className="mt-4 max-w-4xl text-5xl md:text-7xl">Your trip, day by day.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Choose where to go, add the things you want to see, reorder them, and watch your budget update. Saved itineraries can be downloaded as a PDF from My Egypt.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8" aria-label="Smart trip builder">
        <Suspense fallback={<p role="status">Loading trip builder…</p>}>
          <TripBuilder />
        </Suspense>
      </section>

      <section id="budget" className="scroll-mt-24 bg-ivory py-24" aria-labelledby="budget-h">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading id="budget-h" eyebrow="Daily budget calculator" title="What will it cost?" intro="Start from a travel style, then adjust each category to match how you travel." />
          <div className="mt-10">
            <BudgetCalculator />
          </div>
        </div>
      </section>

      <section className="bg-limestone py-24" aria-labelledby="tools-h">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <SectionHeading id="tools-h" eyebrow="Currency converter" title="Euros, dollars, pounds to Egyptian pounds." />
            <div className="mt-8">
              <CurrencyConverter />
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Before you go" title="Pack and prepare." />
            <div className="mt-8">
              <PackingList />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8" aria-labelledby="routes-h">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading id="routes-h" eyebrow="Suggested routes" title="How long between places?" />
            <table className="mt-8 w-full text-left">
              <caption className="sr-only">Typical travel times between destinations</caption>
              <thead className="text-sm text-muted">
                <tr>
                  <th scope="col" className="pb-3">Route</th>
                  <th scope="col" className="pb-3">Typical options</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.from + r.to} className="border-t border-sand align-top">
                    <th scope="row" className="py-4 pr-4 font-semibold text-midnight">
                      {r.from} → {r.to}
                    </th>
                    <td className="py-4">{r.options}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <StatusBadge status="awaiting" />
              <p className="mt-2 text-sm text-muted">Durations are typical ranges, awaiting verification with Egyptian National Railways and airlines. Always check current schedules.</p>
            </div>
          </div>
          <div className="space-y-10">
            <div>
              <SectionHeading eyebrow="Monthly guide" title="Seasons at a glance." />
              <dl className="mt-6 space-y-4">
                {MONTH_GUIDE.map(([m, t]) => (
                  <div key={m} className="grid grid-cols-[110px_1fr] gap-4 border-b border-sand pb-4">
                    <dt className="font-display text-xl text-gold-ink">{m}</dt>
                    <dd>{t}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="text-3xl">Travel preparation</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5">
                {PREP.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
