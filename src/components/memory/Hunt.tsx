"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, Camera, Check, Clock, Lock, MapPin, Sparkles, Users } from "lucide-react";
import { AUDIENCE_LABEL, AUDIENCES, challenges, DIFFICULTY_POINTS, HUNT_CATEGORIES, HUNT_CATEGORY_LABEL, huntStats, type Audience, type Challenge, type HuntCategory } from "@/content/hunt";
import { getDestination } from "@/content/destinations";
import { completedChallenges, useMemories } from "@/lib/memories";
import { Photo, ProgressRing } from "../ui";

function useStats() {
  const { status, memories } = useMemories();
  const done = useMemo(() => completedChallenges(memories), [memories]);
  return { status, memories, done, stats: huntStats(done, memories.length) };
}

export function HuntProgress() {
  const { stats, memories } = useStats();
  const earned = stats.achievements.filter((a) => a.earned).length;
  return (
    <div className="glass flex items-center gap-6 p-6" data-testid="hunt-progress">
      <ProgressRing value={stats.total ? stats.completed / stats.total : 0} />
      <div>
        <p className="font-display text-4xl !text-ivory" role="status">
          {stats.points} <span className="text-2xl text-ivory/70">points</span>
        </p>
        <p className="text-ivory/85">
          {stats.completed} of {stats.total} challenges complete
        </p>
        <p className="mt-2 text-sm text-ivory/70">
          {memories.length} {memories.length === 1 ? "memory" : "memories"} · {earned} {earned === 1 ? "achievement" : "achievements"}
        </p>
        <Link href="/memory-hunt/album" className="mt-3 inline-block text-sm font-semibold text-gold-300 underline underline-offset-4">
          Open my album
        </Link>
      </div>
    </div>
  );
}

const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Challenging" } as const;

export function ChallengeBrowser({ links }: { links: Record<string, boolean> }) {
  const { done } = useStats();
  const [place, setPlace] = useState("all");
  const [cat, setCat] = useState<HuntCategory | "all">("all");
  const [aud, setAud] = useState<Audience | "all">("all");
  const [hideDone, setHideDone] = useState(false);
  const places = useMemo(() => [...new Set(challenges.map((c) => c.destination))].map((s) => ({ slug: s, name: getDestination(s)?.name ?? s })).sort((a, b) => a.name.localeCompare(b.name)), []);
  const list = challenges.filter((c) => (place === "all" || c.destination === place) && (cat === "all" || c.category === cat) && (aud === "all" || c.audiences.includes(aud)) && (!hideDone || !done.includes(c.id)));

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="field">
          <label htmlFor="hunt-place">Destination</label>
          <select id="hunt-place" className="input" value={place} onChange={(e) => setPlace(e.target.value)}>
            <option value="all">All destinations</option>
            {places.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hunt-aud">Travelling as</label>
          <select id="hunt-aud" className="input" value={aud} onChange={(e) => setAud(e.target.value as Audience | "all")}>
            <option value="all">Anyone</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" /> Hide completed
        </label>
      </div>
      <div role="radiogroup" aria-label="Kind of challenge" className="mt-5 flex flex-wrap gap-2">
        {(["all", ...HUNT_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className="chip">
            {c === "all" ? "All kinds" : HUNT_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted" role="status">
        {list.length} {list.length === 1 ? "challenge" : "challenges"}
      </p>
      {list.length ? (
        <ul className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <ChallengeCard c={c} done={done.includes(c.id)} linkOk={!c.link || links[c.link.href] !== false} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl bg-limestone p-10 text-center">
          <p className="text-muted">No challenges match these filters.</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={() => (setPlace("all"), setCat("all"), setAud("all"), setHideDone(false))}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ c, done, linkOk }: { c: Challenge; done: boolean; linkOk: boolean }) {
  const d = getDestination(c.destination);
  return (
    <article className="card flex h-full flex-col overflow-hidden" aria-labelledby={`ch-${c.id}`} data-testid="challenge-card">
      <div className="photo-zoom relative aspect-[4/3] overflow-hidden">
        <Photo k={c.photo} className="h-full w-full" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" label={c.title} />
        <span className="absolute left-3 top-3 rounded-full bg-night/80 px-3 py-1 text-xs font-semibold text-ivory">{HUNT_CATEGORY_LABEL[c.category]}</span>
        {done && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ok px-3 py-1 text-xs font-bold text-ivory">
            <Check aria-hidden="true" size={13} /> Completed
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin aria-hidden="true" size={14} /> {d?.name}
        </p>
        <h3 id={`ch-${c.id}`} className="mt-1 text-2xl leading-snug">
          {c.title}
        </h3>
        <p className="mt-2 text-[0.95rem]">{c.prompt}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Details">
          <li className="inline-flex items-center gap-1">
            <Sparkles aria-hidden="true" size={14} /> {DIFF_LABEL[c.difficulty]} · {DIFFICULTY_POINTS[c.difficulty]} points
          </li>
          <li className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" size={14} /> About {c.minutes >= 60 ? `${Math.round((c.minutes / 60) * 2) / 2} h` : `${c.minutes} min`}
          </li>
          <li className="inline-flex items-center gap-1">
            <Users aria-hidden="true" size={14} /> {c.audiences.length === 3 ? "Everyone" : c.audiences.map((a) => AUDIENCE_LABEL[a]).join(", ")}
          </li>
        </ul>
        <p className="mt-3 text-sm italic text-muted">Tip: {c.tip}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          <Link href={`/memory-hunt/new?challenge=${c.id}`} className="btn btn-primary !min-h-10 !py-2">
            <Camera aria-hidden="true" size={16} /> {done ? "Add another memory" : "Capture this memory"}
            <span className="sr-only">: {c.title}</span>
          </Link>
          {c.link && linkOk && (
            <Link href={c.link.href} className="text-sm font-semibold text-nile underline underline-offset-4">
              {c.link.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function Achievements({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { stats } = useStats();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Achievements">
      {stats.achievements.map((a) => (
        <li key={a.id} className={`rounded-2xl border p-5 ${a.earned ? "border-gold bg-gold-200/30" : tone === "dark" ? "border-ivory/20" : "border-line"}`} data-earned={a.earned}>
          <p className="flex items-center gap-2 font-semibold">
            {a.earned ? <Award aria-hidden="true" size={18} className="text-gold-ink" /> : <Lock aria-hidden="true" size={16} className="text-muted" />}
            {a.title}
            <span className="sr-only">{a.earned ? " — earned" : " — not yet earned"}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{a.detail}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden="true">
            <div className="h-full rounded-full bg-gold" style={{ width: `${a.progress[1] ? (a.progress[0] / a.progress[1]) * 100 : 0}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {a.progress[0]} / {a.progress[1]}
          </p>
        </li>
      ))}
    </ul>
  );
}
