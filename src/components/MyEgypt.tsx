"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { destinations, getDestination } from "@/content/destinations";
import { PRESETS, dailyTotal, tripTotal } from "@/lib/budget";
import { clearAll, saveItinerary, toggleAttraction, useMyEgypt } from "@/lib/client-store";
import type { Itinerary } from "@/lib/validation";
import { DestinationCard } from "./destinations";
import { PackingList } from "./planning";
import { Photo, formatDate } from "./ui";
import { huntStats } from "@/content/hunt";
import { completedChallenges, useMemories } from "@/lib/memories";

/** Memory Hunt at a glance. Memories are kept in IndexedDB, separately from the rest of My Egypt. */
function MemoryHuntSummary() {
  const { status, memories } = useMemories();
  const stats = huntStats(completedChallenges(memories), memories.length);
  return (
    <section aria-labelledby="hunt-me-h" className="card flex flex-wrap items-center justify-between gap-6 p-7">
      <div>
        <p className="eyebrow">Egypt Memory Hunt</p>
        <h2 id="hunt-me-h" className="mt-2 text-4xl">
          My memories
        </h2>
        <p className="mt-2 text-muted">
          {status === "ready" && memories.length
            ? `${memories.length} ${memories.length === 1 ? "memory" : "memories"} · ${stats.completed} of ${stats.total} challenges · ${stats.points} points`
            : "Turn moments from your trip into postcards: complete challenges, save memories, download a print-ready album."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/memory-hunt/album" className="btn btn-primary">
          Open my album
        </Link>
        <Link href="/memory-hunt" className="btn btn-ghost">
          Browse challenges
        </Link>
      </div>
    </section>
  );
}

export async function itineraryPdf(it: Itinerary) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  let y = 0;

  const header = () => {
    doc.setFillColor(15, 27, 45);
    doc.rect(0, 0, W, 110, "F");
    doc.setTextColor(227, 210, 180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DISCOVER EGYPT  ·  TRAVEL ITINERARY", M, 44);
    doc.setTextColor(250, 246, 238);
    doc.setFont("times", "normal");
    doc.setFontSize(26);
    doc.text(it.title, M, 80);
    y = 140;
  };
  const ensure = (h: number) => {
    if (y + h > H - 60) {
      doc.addPage();
      y = 60;
    }
  };

  header();
  doc.setTextColor(43, 45, 51);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const total = tripTotal(PRESETS[it.style], it.days.length, it.travellers);
  doc.text(
    [`${it.days.length} days · ${it.travellers} traveller${it.travellers > 1 ? "s" : ""} · ${it.style} style${it.startDate ? ` · starts ${formatDate(it.startDate)}` : ""}`, `Estimated budget: about $${total.toLocaleString("en-GB")} (estimate only, excluding flights)`],
    M,
    y,
  );
  y += 40;

  it.days.forEach((d, i) => {
    const dest = d.destination ? getDestination(d.destination)?.name : null;
    ensure(40 + d.activities.length * 16);
    doc.setDrawColor(176, 141, 74);
    doc.line(M, y, W - M, y);
    y += 22;
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 27, 45);
    const date = it.startDate ? `  —  ${formatDate(new Date(Date.parse(it.startDate) + i * 864e5).toISOString().slice(0, 10))}` : "";
    doc.text(`Day ${i + 1}${dest ? ` · ${dest}` : ""}${date}`, M, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(43, 45, 51);
    if (!d.activities.length) {
      doc.text("Free day", M + 12, y);
      y += 16;
    }
    d.activities.forEach((a) => {
      doc.setTextColor(125, 95, 39);
      doc.text(a.time.toUpperCase(), M + 12, y);
      doc.setTextColor(43, 45, 51);
      doc.text(doc.splitTextToSize(a.title, W - M * 2 - 90), M + 90, y);
      y += 16;
    });
    y += 6;
  });

  ensure(80);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(91, 93, 99);
  doc.text(
    doc.splitTextToSize("Emergency: Tourist Police 126 · Police 122 · Ambulance 123 · Fire 180 (source: GOV.UK, checked 12 Nov 2026). Check opening hours and ticket prices at egymonuments.gov.eg before you go.", W - M * 2),
    M,
    y,
  );
  doc.save(`${it.title.replace(/[^\w-]+/g, "-").toLowerCase() || "itinerary"}.pdf`);
}

export function MyEgyptDashboard() {
  const me = useMyEgypt();
  const [busy, setBusy] = useState(false);
  const favs = destinations.filter((d) => me.favourites.includes(d.slug));

  return (
    <div className="space-y-20">
      <section aria-labelledby="passport-h">
        <Passport />
      </section>

      <section aria-labelledby="trip-h">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="trip-h" className="text-4xl">
            My itinerary
          </h2>
          {me.itinerary && (
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                aria-busy={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await itineraryPdf(me.itinerary!);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Preparing PDF…" : "Download PDF"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                Print
              </button>
            </div>
          )}
        </div>
        {me.itinerary ? (
          <div className="card mt-6 p-7">
            <h3 className="text-3xl">{me.itinerary.title}</h3>
            <p className="mt-1 text-muted">
              {me.itinerary.days.length} days · {me.itinerary.travellers} travellers · {me.itinerary.style} · about $
              {tripTotal(PRESETS[me.itinerary.style], me.itinerary.days.length, me.itinerary.travellers).toLocaleString("en-GB")} (${dailyTotal(PRESETS[me.itinerary.style])}/person/day, estimate)
            </p>
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {me.itinerary.days.map((d, i) => (
                <li key={i} className="rounded-xl bg-limestone p-4">
                  <p className="font-semibold text-midnight">
                    Day {i + 1} · {d.destination ? getDestination(d.destination)?.name : "Free"}
                  </p>
                  <p className="text-sm text-muted">{d.activities.map((a) => a.title).join(" · ") || "Free day"}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-3">
              <Link href="/plan" className="btn btn-ghost">
                Edit trip
              </Link>
              <button type="button" className="btn btn-ghost text-alert" onClick={() => confirm("Delete this itinerary from this device?") && saveItinerary(null)}>
                Delete trip
              </button>
            </div>
          </div>
        ) : (
          <Empty title="No itinerary yet" body="Build a day-by-day plan with the Smart Trip Builder and it will appear here." href="/plan" cta="Start planning" />
        )}
      </section>

      <MemoryHuntSummary />

      <section aria-labelledby="fav-h">
        <h2 id="fav-h" className="text-4xl">
          Saved destinations
        </h2>
        {favs.length ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((d) => (
              <li key={d.slug}>
                <DestinationCard d={d} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Nothing saved yet" body="Tap the heart on any destination to keep it here." href="/discover" cta="Explore destinations" />
        )}
      </section>

      <section aria-labelledby="att-h" className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 id="att-h" className="text-4xl">
            Saved attractions
          </h2>
          {me.savedAttractions.length ? (
            <ul className="mt-6 divide-y divide-sand rounded-2xl bg-white px-6">
              {me.savedAttractions.map((k) => {
                const [slug, name] = k.split("::");
                return (
                  <li key={k} className="flex items-center justify-between gap-4 py-4">
                    <span>
                      <span className="font-semibold text-midnight">{name}</span>
                      <span className="block text-sm text-muted">{getDestination(slug)?.name}</span>
                    </span>
                    <button type="button" className="text-sm text-alert underline" onClick={() => toggleAttraction(k)}>
                      Remove<span className="sr-only"> {name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 text-muted">Save attractions from any destination page.</p>
          )}
        </div>
        <PackingList />
      </section>

      <section className="rounded-2xl border border-sand p-6 text-sm">
        <h2 className="font-display text-xl">Your data</h2>
        <p className="mt-2 text-muted">Everything on this page is stored only in this browser. Nothing is sent to our servers unless you submit a form.</p>
        <button type="button" className="mt-3 text-alert underline" onClick={() => confirm("Remove all saved places, stamps, trips and lists from this device?") && clearAll()}>
          Clear all my data on this device
        </button>
      </section>
    </div>
  );
}

function Empty({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="grain mt-6 rounded-2xl bg-limestone p-10 text-center">
      <p className="font-display text-2xl text-midnight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{body}</p>
      <Link href={href} className="btn btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}

export function Passport() {
  const { stamps } = useMyEgypt();
  const total = destinations.length;
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-midnight text-ivory on-dark">
      <div className="grid md:grid-cols-[320px_1fr]">
        <div className="relative flex flex-col justify-between gap-8 border-b border-gold/30 p-8 md:border-b-0 md:border-r">
          <div>
            <p className="eyebrow">Arab Republic of Egypt</p>
            <h2 id="passport-h" className="font-display mt-3 text-4xl !text-ivory">
              Travel Passport
            </h2>
            <p className="mt-3 text-ivory/75">Collect a stamp each time you open a destination page.</p>
          </div>
          <div>
            <p className="font-display text-6xl !text-gold">
              {stamps.length}
              <span className="text-2xl text-ivory/60"> / {total}</span>
            </p>
            <p className="mt-1 text-sm text-ivory/70">stamps collected</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ivory/10" role="progressbar" aria-valuenow={stamps.length} aria-valuemin={0} aria-valuemax={total} aria-label="Passport progress">
              <div className="h-full bg-gold transition-all duration-700" style={{ width: `${(stamps.length / total) * 100}%` }} />
            </div>
            {stamps.length === total && <p className="mt-4 font-semibold text-sand">Every stamp collected — you&apos;ve seen all of Egypt&apos;s faces!</p>}
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4" aria-label="Stamps">
          {destinations.map((d, i) => {
            const s = stamps.find((x) => x.slug === d.slug);
            return (
              <li key={d.slug}>
                {s ? (
                  <motion.div
                    initial={{ scale: 1.3, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: (i % 3) * 3 - 3, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="rounded-2xl border-2 border-dashed border-gold/70 bg-ivory/5 p-3"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-full border-2 border-gold">
                      <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full sepia-[.35]" />
                    </div>
                    <p className="font-display mt-2 text-center text-lg !text-ivory">{d.name}</p>
                    <p className="text-center text-[11px] uppercase tracking-widest text-gold">{formatDate(s.at.slice(0, 10))}</p>
                    <p className="mt-2 text-xs text-ivory/70">{d.passportFact}</p>
                  </motion.div>
                ) : (
                  <Link href={`/discover/${d.slug}`} className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ivory/15 p-3 text-center text-ivory/50 hover:border-ivory/40 hover:text-ivory/80">
                    <span aria-hidden="true" className="text-2xl">
                      ✦
                    </span>
                    <span className="mt-2 text-sm">{d.name}</span>
                    <span className="sr-only"> — not collected yet. Visit to collect.</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
