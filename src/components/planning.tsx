"use client";
import { STATIC_SITE } from "@/lib/base-path";
import { parseRates, RATES_URL } from "@/lib/rates";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { destinations, getDestination } from "@/content/destinations";
import { BUDGET_META, CATEGORIES, PRESETS, STYLES, dailyTotal, tripTotal, type DailyBudget, type Style } from "@/lib/budget";
import { saveItinerary, setPacking, useMyEgypt, type PackingItem } from "@/lib/client-store";
import { itinerarySchema, type Itinerary } from "@/lib/validation";
import { StatusBadge, formatDate } from "./ui";

type Day = Itinerary["days"][number];
type Activity = Day["activities"][number];

const uid = () => Math.random().toString(36).slice(2, 10);

/** Spread chosen destinations over the trip, giving each roughly its ideal minimum. Exported for tests. */
export function distributeDays(slugs: string[], total: number): Day[] {
  const valid = slugs.map(getDestination).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (!valid.length) return Array.from({ length: total }, () => ({ destination: null, activities: [] }));
  const base = valid.map((d) => d.idealDays[0]);
  const sum = base.reduce((a, b) => a + b, 0);
  const alloc = base.map((b) => Math.max(1, Math.round((b / sum) * total)));
  let diff = total - alloc.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0; i = (i + 1) % alloc.length) {
    if (diff > 0) {
      alloc[i]++;
      diff--;
    } else if (alloc[i] > 1) {
      alloc[i]--;
      diff++;
    } else if (alloc.every((a) => a <= 1)) break;
  }
  const days: Day[] = [];
  valid.forEach((d, i) => {
    for (let k = 0; k < alloc[i] && days.length < total; k++) {
      const a = d.attractions[k % d.attractions.length];
      days.push({ destination: d.slug, activities: a ? [{ id: uid(), title: a.name, destination: d.slug, time: "morning" }] : [] });
    }
  });
  while (days.length < total) days.push({ destination: valid[valid.length - 1].slug, activities: [] });
  return days.slice(0, Math.max(1, total));
}

export function TripBuilder() {
  const params = useSearchParams();
  const { itinerary: saved } = useMyEgypt();
  const [trip, setTrip] = useState<Itinerary>(() => ({
    title: "My Egypt trip",
    startDate: null,
    style: "comfortable",
    travellers: 2,
    interests: [],
    days: distributeDays(["cairo", "giza", "luxor", "aswan"], 7),
  }));
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialise once: query string from Find Your Egypt wins, otherwise the saved draft.
  useEffect(() => {
    if (loaded) return;
    const from = params.get("from");
    if (from) {
      const days = Math.min(30, Math.max(1, Number(params.get("days")) || 7));
      const style = (STYLES as readonly string[]).includes(params.get("style") ?? "") ? (params.get("style") as Style) : "comfortable";
      setTrip((t) => ({ ...t, style, days: distributeDays(from.split(","), days) }));
    } else if (saved) setTrip(saved);
    setLoaded(true);
  }, [params, saved, loaded]);

  const setDay = (i: number, fn: (d: Day) => Day) => setTrip((t) => ({ ...t, days: t.days.map((d, k) => (k === i ? fn(d) : d)) }));

  function setLength(n: number) {
    n = Math.min(30, Math.max(1, n));
    setTrip((t) => ({
      ...t,
      days: n > t.days.length ? [...t.days, ...Array.from({ length: n - t.days.length }, () => ({ destination: t.days.at(-1)?.destination ?? null, activities: [] }))] : t.days.slice(0, n),
    }));
  }

  function move(day: number, idx: number, dir: -1 | 1) {
    setDay(day, (d) => {
      const a = [...d.activities];
      const j = idx + dir;
      if (j < 0 || j >= a.length) return d;
      [a[idx], a[j]] = [a[j], a[idx]];
      return { ...d, activities: a };
    });
  }

  function save() {
    const r = itinerarySchema.safeParse(trip);
    if (!r.success) {
      setMsg({ text: r.error.issues[0]?.message ?? "Please check your trip", tone: "error" });
      return;
    }
    saveItinerary(r.data);
    setMsg({ text: "Trip saved on this device. Open My Egypt to download it as a PDF.", tone: "ok" });
  }

  const daily = dailyTotal(PRESETS[trip.style]);
  const total = tripTotal(PRESETS[trip.style], trip.days.length, trip.travellers);
  const dateOf = (i: number) => (trip.startDate ? formatDate(new Date(Date.parse(trip.startDate) + i * 864e5).toISOString().slice(0, 10)) : null);

  return (
    <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Trip settings">
        <div className="field">
          <label htmlFor="trip-title">Trip name</label>
          <input id="trip-title" className="input" value={trip.title} maxLength={80} onChange={(e) => setTrip({ ...trip, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label htmlFor="trip-start">Start date</label>
            <input id="trip-start" type="date" className="input" value={trip.startDate ?? ""} onChange={(e) => setTrip({ ...trip, startDate: e.target.value || null })} />
          </div>
          <div className="field">
            <label htmlFor="trip-days">Days</label>
            <input id="trip-days" type="number" min={1} max={30} className="input" value={trip.days.length} onChange={(e) => setLength(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label htmlFor="trip-style">Travel style</label>
            <select id="trip-style" className="input capitalize" value={trip.style} onChange={(e) => setTrip({ ...trip, style: e.target.value as Style })}>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="trip-people">Travellers</label>
            <input id="trip-people" type="number" min={1} max={20} className="input" value={trip.travellers} onChange={(e) => setTrip({ ...trip, travellers: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
        </div>

        <div className="rounded-2xl bg-midnight p-6 text-ivory on-dark">
          <p className="eyebrow">Estimated budget</p>
          <p className="font-display mt-2 text-4xl !text-ivory">${total.toLocaleString("en-GB")}</p>
          <p className="mt-1 text-sm text-ivory/75">
            ≈ ${daily}/person/day × {trip.days.length} days × {trip.travellers}
          </p>
          <p className="mt-3 text-xs text-ivory/60">
            {BUDGET_META.label}. Last checked {formatDate(BUDGET_META.lastChecked)}. Excludes international flights.{" "}
            <Link href="#budget" className="underline">
              Adjust in detail
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={save}>
            Save itinerary
          </button>
          <Link href="/my-egypt" className="btn btn-ghost">
            View in My Egypt
          </Link>
        </div>
        <div aria-live="polite" role="status">
          {msg && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}
        </div>
      </aside>

      <ol className="relative space-y-6 border-l-2 border-sand pl-6 md:pl-10" aria-label="Day-by-day itinerary">
        {trip.days.map((day, i) => (
          <DayCard
            key={i}
            index={i}
            day={day}
            date={dateOf(i)}
            onChangeDestination={(slug) => setDay(i, (d) => ({ ...d, destination: slug }))}
            onAdd={(a) => setDay(i, (d) => ({ ...d, activities: [...d.activities, a] }))}
            onRemove={(id) => setDay(i, (d) => ({ ...d, activities: d.activities.filter((x) => x.id !== id) }))}
            onMove={(idx, dir) => move(i, idx, dir)}
            onTime={(id, time) => setDay(i, (d) => ({ ...d, activities: d.activities.map((x) => (x.id === id ? { ...x, time } : x)) }))}
          />
        ))}
      </ol>
    </div>
  );
}

function DayCard({
  index,
  day,
  date,
  onChangeDestination,
  onAdd,
  onRemove,
  onMove,
  onTime,
}: {
  index: number;
  day: Day;
  date: string | null;
  onChangeDestination: (slug: string | null) => void;
  onAdd: (a: Activity) => void;
  onRemove: (id: string) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onTime: (id: string, t: Activity["time"]) => void;
}) {
  const id = useId();
  const d = day.destination ? getDestination(day.destination) : null;
  const [custom, setCustom] = useState("");
  const suggestions = d?.attractions.filter((a) => !day.activities.some((x) => x.title === a.name)) ?? [];

  return (
    <li className="card relative p-6">
      <span className="absolute -left-[35px] top-7 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-midnight md:-left-[51px]" aria-hidden="true">
        {index + 1}
      </span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl">
            Day {index + 1}
            {d ? ` · ${d.name}` : ""}
          </h3>
          {date && <p className="text-sm text-muted">{date}</p>}
        </div>
        <div className="field min-w-[200px]">
          <label htmlFor={`${id}-dest`} className="sr-only">
            Destination for day {index + 1}
          </label>
          <select id={`${id}-dest`} className="input" value={day.destination ?? ""} onChange={(e) => onChangeDestination(e.target.value || null)}>
            <option value="">Choose destination…</option>
            {destinations.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {day.activities.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-sand-deep p-4 text-sm text-muted">A free day. Add an attraction below, or keep it for wandering.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {day.activities.map((a, idx) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-limestone px-4 py-3">
              <select
                aria-label={`Time of day for ${a.title}`}
                value={a.time}
                onChange={(e) => onTime(a.id, e.target.value as Activity["time"])}
                className="rounded-lg bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gold-ink"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
              <span className="flex-1 font-medium">{a.title}</span>
              <button type="button" className="h-9 w-9 rounded-full hover:bg-white" onClick={() => onMove(idx, -1)} disabled={idx === 0} aria-label={`Move ${a.title} up`}>
                ↑
              </button>
              <button type="button" className="h-9 w-9 rounded-full hover:bg-white" onClick={() => onMove(idx, 1)} disabled={idx === day.activities.length - 1} aria-label={`Move ${a.title} down`}>
                ↓
              </button>
              <button type="button" className="h-9 w-9 rounded-full text-alert hover:bg-white" onClick={() => onRemove(a.id)} aria-label={`Remove ${a.title}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((a) => (
          <button key={a.name} type="button" className="chip text-sm" onClick={() => onAdd({ id: uid(), title: a.name, destination: day.destination, time: "afternoon" })}>
            + {a.name}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = custom.trim();
          if (t.length < 1) return;
          onAdd({ id: uid(), title: t.slice(0, 120), destination: day.destination, time: "evening" });
          setCustom("");
        }}
      >
        <label htmlFor={`${id}-custom`} className="sr-only">
          Add your own activity to day {index + 1}
        </label>
        <input id={`${id}-custom`} className="input !min-h-10" placeholder="Add your own activity…" value={custom} maxLength={120} onChange={(e) => setCustom(e.target.value)} />
        <button type="submit" className="btn btn-ghost !min-h-10 shrink-0">
          Add
        </button>
      </form>
    </li>
  );
}

/* ---------------- Budget calculator ---------------- */
export function BudgetCalculator() {
  const [style, setStyle] = useState<Style>("budget");
  const [b, setB] = useState<DailyBudget>(PRESETS.budget);
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(1);
  const rates = useRates();
  const egp = rates.toEgp?.USD ?? null;
  const daily = dailyTotal(b);
  const total = tripTotal(b, days, people);
  const max = { accommodation: 500, food: 200, transport: 150, activities: 200, shopping: 150 };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Travel style preset">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              className="chip capitalize"
              aria-pressed={style === s}
              onClick={() => {
                setStyle(s);
                setB(PRESETS[s]);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-8 space-y-6">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <div className="flex items-baseline justify-between">
                <label htmlFor={`b-${c}`} className="font-semibold capitalize text-midnight">
                  {c}
                </label>
                <output htmlFor={`b-${c}`} className="font-display text-xl text-midnight">
                  ${b[c]}
                  <span className="text-sm text-muted"> /day</span>
                </output>
              </div>
              <input
                id={`b-${c}`}
                type="range"
                min={0}
                max={max[c]}
                step={c === "accommodation" ? 5 : 1}
                value={b[c]}
                onChange={(e) => setB({ ...b, [c]: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--color-nile)]"
              />
            </div>
          ))}
          <div className="grid max-w-md grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="b-days">Days</label>
              <input id="b-days" type="number" min={1} max={60} className="input" value={days} onChange={(e) => setDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
            </div>
            <div className="field">
              <label htmlFor="b-people">Travellers</label>
              <input id="b-people" type="number" min={1} max={20} className="input" value={people} onChange={(e) => setPeople(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
            </div>
          </div>
        </div>
      </div>
      <div className="card h-fit p-7" aria-live="polite">
        <p className="eyebrow">Your estimate</p>
        <p className="mt-4 text-sm text-muted">Per person, per day</p>
        <p className="font-display text-4xl text-midnight">${daily}</p>
        {egp && <p className="text-sm text-muted">≈ {Math.round(daily * egp).toLocaleString("en-GB")} EGP</p>}
        <p className="mt-5 text-sm text-muted">
          Whole trip ({days} days, {people} {people === 1 ? "person" : "people"})
        </p>
        <p className="font-display text-5xl text-midnight">${total.toLocaleString("en-GB")}</p>
        {egp && <p className="text-sm text-muted">≈ {Math.round(total * egp).toLocaleString("en-GB")} EGP</p>}
        <div className="mt-6 border-t border-sand pt-4">
          <StatusBadge status="estimate" lastVerified={BUDGET_META.lastChecked} />
          <p className="mt-2 text-xs text-muted">Editorial estimates in US dollars, excluding international flights and visas. Actual prices vary by season and provider.</p>
          {rates.updated && <p className="mt-1 text-xs text-muted">Exchange rate updated {rates.updated}.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Currency converter ---------------- */
type Rates = { toEgp: Record<string, number | null> | null; updated: string | null; error: string | null; loading: boolean };

export function useRates(): Rates {
  const [r, setR] = useState<Rates>({ toEgp: null, updated: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    // The GitHub Pages build has no server, so it asks the (CORS-enabled) provider directly.
    (STATIC_SITE ? fetch(RATES_URL).then(async (res) => parseRates(await res.json())) : fetch("/api/rates").then((res) => res.json()))
      .then((d) => {
        if (!alive) return;
        if (d.ok) setR({ toEgp: d.toEgp, updated: new Date(d.updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), error: null, loading: false });
        else setR({ toEgp: null, updated: null, error: d.error, loading: false });
      })
      .catch(() => alive && setR({ toEgp: null, updated: null, error: "Live exchange rates are unavailable right now.", loading: false }));
    return () => {
      alive = false;
    };
  }, []);
  return r;
}

export function CurrencyConverter() {
  const rates = useRates();
  const [cur, setCur] = useState<"USD" | "EUR" | "GBP">("EUR");
  const [amount, setAmount] = useState("100");
  const [manual, setManual] = useState("");
  const live = rates.toEgp?.[cur] ?? null;
  const rate = live ?? (Number(manual) > 0 ? Number(manual) : null);
  const value = Number(amount);
  const result = rate && Number.isFinite(value) && value >= 0 ? Math.round(value * rate * 100) / 100 : null;

  return (
    <div className="card p-7">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="field">
          <label htmlFor="cc-amount">Amount</label>
          <input id="cc-amount" inputMode="decimal" className="input text-lg" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        <div className="field">
          <label htmlFor="cc-cur">From</label>
          <select id="cc-cur" className="input" value={cur} onChange={(e) => setCur(e.target.value as typeof cur)}>
            <option value="EUR">EUR €</option>
            <option value="USD">USD $</option>
            <option value="GBP">GBP £</option>
          </select>
        </div>
      </div>

      {rates.loading ? (
        <p className="mt-6 text-muted" role="status">
          Loading today&apos;s rate…
        </p>
      ) : (
        <>
          {!live && (
            <div className="mt-5 rounded-xl bg-gold/10 p-4 text-sm">
              <p className="font-medium text-gold-ink">{rates.error ?? "No live rate available."}</p>
              <div className="field mt-3">
                <label htmlFor="cc-manual">Enter today&apos;s rate yourself (EGP per 1 {cur})</label>
                <input id="cc-manual" inputMode="decimal" className="input" value={manual} onChange={(e) => setManual(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            </div>
          )}
          <div aria-live="polite" className="mt-6">
            {result !== null ? (
              <>
                <p className="font-display text-5xl text-midnight">{result.toLocaleString("en-GB")} EGP</p>
                <p className="mt-1 text-sm text-muted">
                  1 {cur} = {rate!.toFixed(2)} EGP {live ? `· ExchangeRate-API, updated ${rates.updated}` : "· your rate"}
                </p>
              </>
            ) : (
              <p className="text-muted">Enter an amount{live ? "" : " and a rate"} to convert.</p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">Indicative mid-market rate. Banks and exchange offices apply their own rates and fees.</p>
        </>
      )}
    </div>
  );
}

/* ---------------- Packing checklist ---------------- */
export function PackingList() {
  const { packing } = useMyEgypt();
  const [text, setText] = useState("");
  const done = packing.filter((p) => p.done).length;
  const set = (items: PackingItem[]) => setPacking(items);
  return (
    <div className="card p-7">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl">Packing checklist</h3>
        <p className="text-sm text-muted" aria-live="polite">
          {done} of {packing.length} packed
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand/60" aria-hidden="true">
        <div className="h-full bg-nile transition-all" style={{ width: `${packing.length ? (done / packing.length) * 100 : 0}%` }} />
      </div>
      <ul className="mt-5 space-y-1">
        {packing.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-limestone">
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-[var(--color-nile)]" checked={p.done} onChange={() => set(packing.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))} />
              <span className={p.done ? "text-muted line-through" : ""}>{p.label}</span>
            </label>
            <button type="button" className="h-9 w-9 rounded-full text-muted hover:text-alert" onClick={() => set(packing.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.label}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {packing.length === 0 && <p className="mt-3 text-sm text-muted">Your list is empty. Add the things you don&apos;t want to forget.</p>}
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim().slice(0, 80);
          if (!t) return;
          set([...packing, { id: uid(), label: t, done: false }]);
          setText("");
        }}
      >
        <label htmlFor="pack-new" className="sr-only">
          Add an item
        </label>
        <input id="pack-new" className="input !min-h-10" placeholder="Add an item…" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-ghost !min-h-10">
          Add
        </button>
      </form>
    </div>
  );
}
