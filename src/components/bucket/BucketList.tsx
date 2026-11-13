"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Check, Clock, Heart, ListPlus, MapPin, Mountain, Plus, Sparkles, Undo2 } from "lucide-react";
import { badgesFor, BUCKET_CATEGORIES, CATEGORY_LABEL, monthRanges, type BucketActivity, type BucketCategory } from "@/content/bucket";
import { getDestination } from "@/content/destinations";
import { setBucket, useMyEgypt } from "@/lib/client-store";
import { Photo } from "../ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type View = "all" | "mine" | "done" | "season";

export function BucketProgress({ activities }: { activities: BucketActivity[] }) {
  const me = useMyEgypt();
  const ids = new Set(activities.map((a) => a.id));
  const done = Object.entries(me.bucket).filter(([id, p]) => p.done && ids.has(id)).length;
  const added = Object.entries(me.bucket).filter(([id, p]) => p.added && ids.has(id)).length;
  const total = activities.length;
  const pct = total ? done / total : 0;
  const earned = badgesFor(Object.keys(me.bucket).filter((k) => me.bucket[k].done), activities).filter((b) => b.earned).length;
  const R = 52,
    C = 2 * Math.PI * R;
  return (
    <div className="glass flex items-center gap-6 p-6">
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true" className="shrink-0 -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgb(250 246 238 / 0.18)" strokeWidth="10" />
        <motion.circle cx="64" cy="64" r={R} fill="none" stroke="var(--color-gold-300)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct) }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div>
        <p className="font-display text-4xl !text-ivory" role="status">
          {done} <span className="text-2xl text-ivory/70">of {total}</span>
        </p>
        <p className="text-ivory/85">Egyptian experiences completed</p>
        <p className="mt-2 text-sm text-ivory/70">
          {added} on your list · {earned} {earned === 1 ? "badge" : "badges"} earned
        </p>
      </div>
    </div>
  );
}

export function BucketList({ activities }: { activities: BucketActivity[] }) {
  const me = useMyEgypt();
  const [view, setView] = useState<View>("all");
  const [cat, setCat] = useState<BucketCategory | "all">("all");
  const month = new Date().getMonth() + 1;
  const featured = activities.filter((a) => a.featured).slice(0, 3);
  const doneIds = Object.keys(me.bucket).filter((k) => me.bucket[k].done);
  const badges = badgesFor(doneIds, activities);

  const list = useMemo(
    () =>
      activities.filter((a) => {
        const p = me.bucket[a.id];
        if (cat !== "all" && !a.categories.includes(cat)) return false;
        if (view === "mine") return p?.added;
        if (view === "done") return p?.done;
        if (view === "season") return a.bestMonths.length === 0 || a.bestMonths.includes(month);
        return true;
      }),
    [activities, me.bucket, cat, view, month],
  );
  const usedCats = BUCKET_CATEGORIES.filter((c) => activities.some((a) => a.categories.includes(c)));

  return (
    <div>
      {featured.length > 0 && (
        <section aria-labelledby="feat-h">
          <h2 id="feat-h" className="text-3xl md:text-4xl">
            Start with these
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {featured.map((a) => (
              <li key={a.id}>
                <FeatureCard a={a} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-h" className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="all-h" className="text-3xl md:text-4xl">
            The full list
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
            {(
              [
                ["all", "Everything"],
                ["mine", "My list"],
                ["done", "Completed"],
                ["season", `Good in ${MONTHS[month - 1]}`],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="chip">
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Category">
          <button type="button" aria-pressed={cat === "all"} onClick={() => setCat("all")} className="chip !min-h-9 text-sm">
            All categories
          </button>
          {usedCats.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className="chip !min-h-9 text-sm">
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {list.length} {list.length === 1 ? "experience" : "experiences"}
        </p>
        {list.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-limestone p-10 text-center">
            <p className="font-display text-2xl text-midnight">{view === "mine" ? "Your list is empty." : view === "done" ? "Nothing ticked off yet." : "Nothing matches."}</p>
            <p className="mt-1 text-muted">{view === "mine" ? "Tap “Add to my list” on any experience." : "Try another filter."}</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <li key={a.id}>
                <ActivityCard a={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="badges-h" className="mt-20 rounded-[1.5rem] bg-midnight p-8 text-ivory on-dark md:p-12">
        <p className="eyebrow">Achievements</p>
        <h2 id="badges-h" className="mt-2 text-3xl !text-ivory md:text-4xl">
          Collect your stamps
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <li key={b.id} className={`rounded-2xl p-5 ring-1 ${b.earned ? "bg-gold-300 text-midnight ring-gold-300" : "bg-ivory/[0.04] ring-ivory/15"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${b.earned ? "bg-midnight text-gold-300" : "border border-dashed border-ivory/40 text-ivory/60"}`}>
                  <Award aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className={`font-display text-lg ${b.earned ? "text-midnight" : "!text-ivory"}`}>{b.title}</p>
                  <p className={`text-xs ${b.earned ? "text-midnight/80" : "text-ivory/70"}`}>{b.detail}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3" aria-label={`${b.progress[0]} of ${b.progress[1]}${b.earned ? ", earned" : ""}`} role="img">
                <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${b.earned ? "bg-midnight/20" : "bg-ivory/15"}`}>
                  <span className={`block h-full rounded-full ${b.earned ? "bg-midnight" : "bg-gold-300"}`} style={{ width: `${(b.progress[0] / Math.max(1, b.progress[1])) * 100}%` }} />
                </span>
                <span className="text-xs tabular-nums">
                  {b.progress[0]}/{b.progress[1]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function where(a: BucketActivity) {
  return a.destination ? (getDestination(a.destination)?.name ?? a.destination) : (a.place ?? "Egypt");
}

function Controls({ a, tone = "light" }: { a: BucketActivity; tone?: "light" | "dark" }) {
  const me = useMyEgypt();
  const p = me.bucket[a.id];
  const added = !!p?.added,
    done = !!p?.done,
    fav = !!p?.fav;
  const ghost = tone === "dark" ? "btn-outline-light" : "btn-ghost";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {done ? (
        <button type="button" aria-label={`Mark not done: ${a.title}`} className={`btn ${ghost} btn-sm`} onClick={() => setBucket(a.id, { done: false })}>
          <Undo2 aria-hidden="true" size={15} /> Mark not done
        </button>
      ) : (
        <button type="button" aria-label={`I did this: ${a.title}`} className="btn btn-gold btn-sm" onClick={() => setBucket(a.id, { done: true })}>
          <Check aria-hidden="true" size={15} /> I did this
        </button>
      )}
      {!done && (
        <button type="button" aria-pressed={added} aria-label={`${added ? "On my list" : "Add to my list"}: ${a.title}`} className={`btn ${ghost} btn-sm`} onClick={() => setBucket(a.id, { added: !added })}>
          {added ? <ListPlus aria-hidden="true" size={15} /> : <Plus aria-hidden="true" size={15} />} {added ? "On my list" : "Add to my list"}
        </button>
      )}
      <button type="button" aria-pressed={fav} onClick={() => setBucket(a.id, { fav: !fav })} className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tone === "dark" ? "hover:bg-ivory/10" : "hover:bg-limestone"}`}>
        <Heart aria-hidden="true" size={17} fill={fav ? "currentColor" : "none"} />
        <span className="sr-only">{fav ? `Remove ${a.title} from favourites` : `Favourite: ${a.title}`}</span>
      </button>
    </div>
  );
}

function FeatureCard({ a }: { a: BucketActivity }) {
  const me = useMyEgypt();
  const done = me.bucket[a.id]?.done;
  return (
    <article className="on-dark group relative flex h-full min-h-[440px] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-night text-ivory shadow-[var(--shadow-lift)]">
      <div className="golden-grade absolute inset-0">
        <Photo k={a.photo} label={a.title} className="photo-zoom absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" sizes="(min-width:768px) 33vw, 100vw" />
      </div>
      {done && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-gold-300 px-3 py-1 text-xs font-bold text-midnight">
          <Check aria-hidden="true" size={13} /> Done
        </span>
      )}
      <div className="relative z-10 p-6">
        <p className="flex items-center gap-1.5 text-sm text-gold-200">
          <MapPin aria-hidden="true" size={14} /> {where(a)}
        </p>
        <h3 className="mt-2 text-2xl !text-ivory">{a.title}</h3>
        <p className="mt-2 text-sm text-ivory/85">{a.description}</p>
        <div className="mt-5">
          <Controls a={a} tone="dark" />
        </div>
      </div>
    </article>
  );
}

function ActivityCard({ a }: { a: BucketActivity }) {
  const me = useMyEgypt();
  const done = me.bucket[a.id]?.done;
  return (
    <article className={`card flex h-full flex-col overflow-hidden transition ${done ? "ring-2 ring-gold" : ""}`}>
      <div className="relative aspect-[16/10]">
        <Photo k={a.photo} label={a.title} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 30vw, 100vw" />
        {done && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-300 px-3 py-1 text-xs font-bold text-midnight">
            <Check aria-hidden="true" size={13} /> Done
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex flex-wrap gap-1.5">
          {a.categories.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-limestone px-2.5 py-0.5 text-[11px] font-semibold text-gold-ink">
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </p>
        <h3 className="mt-3 text-xl">{a.title}</h3>
        <p className="mt-1 text-sm text-muted">{a.description}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="contents">
            <MapPin aria-hidden="true" size={15} className="mt-0.5 text-gold-ink" />
            <span className="sr-only">Where</span>
          </dt>
          <dd>{where(a)}</dd>
          <dt className="contents">
            <Clock aria-hidden="true" size={15} className="mt-0.5 text-gold-ink" />
            <span className="sr-only">Time</span>
          </dt>
          <dd>{a.duration}</dd>
          <dt className="contents">
            <Mountain aria-hidden="true" size={15} className="mt-0.5 text-gold-ink" />
            <span className="sr-only">Effort</span>
          </dt>
          <dd className="capitalize">{a.effort}</dd>
          {a.bestMonths.length > 0 && (
            <>
              <dt className="contents">
                <Sparkles aria-hidden="true" size={15} className="mt-0.5 text-gold-ink" />
                <span className="sr-only">Best months</span>
              </dt>
              <dd>
                Best: {monthRanges(a.bestMonths)}
                <span className="text-muted"> (typical weather)</span>
              </dd>
            </>
          )}
        </dl>
        {a.season && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${a.season.verified ? "bg-ok/10 text-ok" : "bg-limestone text-muted"}`}>
            {a.season.note}{" "}
            {a.season.verified && a.season.source ? (
              <a href={a.season.source.url} target="_blank" rel="noopener noreferrer" className="underline">
                Source
              </a>
            ) : (
              <span className="font-semibold">· Editorial note</span>
            )}
          </p>
        )}
        {a.tips.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-nile">Practical tips</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {a.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </details>
        )}
        {a.link && (
          <Link href={a.link.href} className="mt-3 text-sm font-semibold text-nile underline underline-offset-4">
            {a.link.label}
          </Link>
        )}
        <div className="mt-auto pt-5">
          <Controls a={a} />
        </div>
      </div>
    </article>
  );
}
