"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { dishes, numerals, phrases, soundscapes, PRICE_NOTE, type Dish } from "@/content/culture";
import { Photo, StatusBadge } from "./ui";

/* ---------------- Taste Egypt ---------------- */
export function FoodGuide() {
  const [filter, setFilter] = useState<"all" | "veg" | Dish["kind"]>("all");
  const list = dishes.filter((d) => filter === "all" || (filter === "veg" ? d.vegetarian === "yes" : d.kind === filter));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter dishes">
          {(
            [
              ["all", "Everything"],
              ["veg", "Vegetarian"],
              ["street", "Street food"],
              ["main", "Home cooking"],
              ["dessert", "Sweets"],
              ["drink", "Drinks"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
        <StatusBadge status="estimate" lastVerified={PRICE_NOTE.lastChecked} />
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <li key={d.slug} className="card photo-zoom flex flex-col overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-2xl">{d.name}</h3>
                <span lang="ar" dir="rtl" className="text-lg text-gold-ink">
                  {d.arabic}
                </span>
              </div>
              <p className="mt-2 text-muted">{d.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-midnight">Typical price</dt>
                  <dd>{d.priceRange ? `${d.priceRange[0]}–${d.priceRange[1]} EGP` : "Varies"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-midnight">Vegetarian</dt>
                  <dd>{d.vegetarian === "yes" ? "Yes" : d.vegetarian === "often" ? "Often — ask" : "No"}</dd>
                </div>
              </dl>
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-semibold text-nile">Ingredients & story</summary>
                <p className="mt-2">
                  <strong>Main ingredients:</strong> {d.ingredients.join(", ")}.
                </p>
                <p className="mt-2 text-muted">{d.background}</p>
              </details>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-6 text-muted">No dishes match this filter.</p>}
    </div>
  );
}

/* ---------------- Decode Egypt ---------------- */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-EG";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

export function ArabicTrainer() {
  const [tab, setTab] = useState<"phrases" | "numbers" | "quiz">("phrases");
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => setCanSpeak("speechSynthesis" in window), []);
  return (
    <div>
      <div className="flex gap-2" role="tablist" aria-label="Arabic learning">
        {(["phrases", "numbers", "quiz"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-controls={`ar-${t}`} id={`ar-tab-${t}`} className="chip capitalize" onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel" id={`ar-${tab}`} aria-labelledby={`ar-tab-${tab}`}>
        {tab === "phrases" && (
          <div className="grid gap-3 md:grid-cols-2">
            {phrases.map((p) => (
              <div key={p.en} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-ink">{p.group}</p>
                  <p className="mt-1 font-semibold text-midnight">{p.en}</p>
                  <p className="text-muted italic">{p.say}</p>
                </div>
                <div className="text-right">
                  <p lang="ar" dir="rtl" className="text-2xl text-midnight">
                    {p.ar}
                  </p>
                  {canSpeak && (
                    <button type="button" className="mt-1 text-sm font-semibold text-nile underline" onClick={() => speak(p.ar)}>
                      Listen<span className="sr-only"> to “{p.en}”</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!canSpeak && <p className="text-sm text-muted">Audio pronunciation uses your browser&apos;s speech feature, which isn&apos;t available here.</p>}
          </div>
        )}
        {tab === "numbers" && (
          <div>
            <p className="max-w-2xl text-muted">Egyptian price tags and bus numbers often use Eastern Arabic numerals. Learn to read them — it helps when shopping.</p>
            <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-11">
              {numerals.map((n) => (
                <li key={n.n} className="rounded-2xl bg-white p-4 text-center">
                  <span lang="ar" className="font-display block text-4xl text-midnight">
                    {n.ar}
                  </span>
                  <span className="mt-1 block font-semibold">{n.n}</span>
                  <span className="block text-xs text-muted">{n.say}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tab === "quiz" && <ArabicQuiz />}
      </div>
    </div>
  );
}

function shuffle<T>(a: T[], seed: number) {
  const out = [...a];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function ArabicQuiz() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const questions = useMemo(() => shuffle(phrases, 7).slice(0, 6), []);
  const q = questions[round];
  const options = useMemo(() => (q ? shuffle([q, ...shuffle(phrases.filter((p) => p !== q), round + 3).slice(0, 3)], round + 11) : []), [q, round]);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  if (!q)
    return (
      <div className="rounded-2xl bg-white p-8" role="status">
        <p className="font-display text-3xl text-midnight">
          You scored {score} / {questions.length}
        </p>
        <p className="mt-2 text-muted">{score >= 5 ? "Mumtaz! (Excellent!) You're ready for the market." : "Shwaya shwaya — little by little. Try again!"}</p>
        <button
          type="button"
          className="btn btn-primary mt-6"
          onClick={() => {
            setRound(0);
            setScore(0);
            setPicked(null);
          }}
        >
          Play again
        </button>
      </div>
    );

  return (
    <div className="rounded-2xl bg-white p-8">
      <p className="text-sm text-muted">
        Question {round + 1} of {questions.length} · Score {score}
      </p>
      <p className="mt-3 text-lg">What does this mean?</p>
      <p lang="ar" dir="rtl" className="font-display mt-2 text-4xl text-midnight">
        {q.ar}
      </p>
      <p className="text-muted italic">{q.say}</p>
      <fieldset className="mt-6">
        <legend className="sr-only">Choose the meaning</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o) => {
            const isRight = o.en === q.en;
            const state = picked ? (isRight ? "border-ok bg-ok/10" : picked === o.en ? "border-alert bg-alert/10" : "opacity-60") : "";
            return (
              <button
                key={o.en}
                type="button"
                disabled={Boolean(picked)}
                onClick={() => {
                  setPicked(o.en);
                  if (isRight) setScore((s) => s + 1);
                  requestAnimationFrame(() => feedbackRef.current?.focus());
                }}
                className={`rounded-xl border-2 border-sand px-4 py-3 text-left font-medium transition ${state}`}
              >
                {o.en}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p ref={feedbackRef} tabIndex={-1} aria-live="polite" className="mt-4 min-h-6 font-semibold outline-none">
        {picked && (picked === q.en ? "Correct! Shater (clever)!" : `Not quite — it means “${q.en}”.`)}
      </p>
      {picked && (
        <button
          type="button"
          className="btn btn-primary mt-2"
          onClick={() => {
            setPicked(null);
            setRound(round + 1);
          }}
        >
          {round === questions.length - 1 ? "See my score" : "Next question"}
        </button>
      )}
    </div>
  );
}

/* ---------------- Egypt Through the Senses ---------------- */
/**
 * Ambient soundscapes are synthesised in the browser with the Web Audio API, so no audio files
 * or third-party recordings are needed. Sound only starts when the visitor presses play.
 */
export function Soundscapes() {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume * 0.6;
  }, [volume]);

  function play(mood: string) {
    stopRef.current?.();
    if (playing === mood) {
      setPlaying(null);
      return;
    }
    const ctx = (ctxRef.current ??= new AudioContext());
    void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = volume * 0.6;
    master.connect(ctx.destination);
    gainRef.current = master;
    const nodes: AudioScheduledSourceNode[] = [];
    const timers: number[] = [];

    const noise = (color: "white" | "brown") => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = color === "white" ? w * 0.4 : (last = (last + 0.02 * w) / 1.02) * 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      nodes.push(src);
      return src;
    };
    const lfo = (target: AudioParam, rate: number, depth: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = rate;
      g.gain.value = depth;
      o.connect(g).connect(target);
      o.start();
      nodes.push(o);
    };

    if (mood === "river" || mood === "coast") {
      const n = noise("brown");
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = mood === "coast" ? 700 : 450;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      lfo(g.gain, mood === "coast" ? 0.12 : 0.3, 0.35);
      n.connect(f).connect(g).connect(master);
      n.start();
    }
    if (mood === "desert") {
      const n = noise("white");
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 500;
      f.Q.value = 0.7;
      lfo(f.frequency, 0.07, 300);
      const g = ctx.createGain();
      g.gain.value = 0.25;
      n.connect(f).connect(g).connect(master);
      n.start();
      const drone = ctx.createOscillator();
      drone.frequency.value = 73.4; // D2
      const dg = ctx.createGain();
      dg.gain.value = 0.08;
      drone.connect(dg).connect(master);
      drone.start();
      nodes.push(drone);
    }
    if (mood === "market") {
      const n = noise("brown");
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      n.connect(f).connect(g).connect(master);
      n.start();
      // Maqsum-like rhythm: dum tak - tak dum - tak -
      const pattern = [1, 0.5, 0, 0.5, 1, 0, 0.5, 0];
      let step = 0;
      const hit = () => {
        const v = pattern[step++ % pattern.length];
        if (!v) return;
        const o = ctx.createOscillator();
        const eg = ctx.createGain();
        o.frequency.value = v === 1 ? 90 : 380;
        eg.gain.setValueAtTime(v === 1 ? 0.5 : 0.18, ctx.currentTime);
        eg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (v === 1 ? 0.35 : 0.12));
        o.connect(eg).connect(master);
        o.start();
        o.stop(ctx.currentTime + 0.4);
      };
      timers.push(window.setInterval(hit, 220));
    }

    stopRef.current = () => {
      timers.forEach(clearInterval);
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      master.disconnect();
      stopRef.current = null;
    };
    setPlaying(mood);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {soundscapes.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={playing === s.mood}
            onClick={() => play(s.mood)}
            className={`group rounded-2xl p-6 text-left ring-1 transition ${playing === s.mood ? "bg-ivory text-midnight ring-ivory" : "bg-ivory/[0.06] text-ivory ring-ivory/20 hover:bg-ivory/10"}`}
          >
            <span className="flex items-center justify-between">
              <span className={`font-display text-xl ${playing === s.mood ? "text-midnight" : "!text-ivory"}`}>{s.title}</span>
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-current">
                {playing === s.mood ? "❚❚" : "▶"}
              </span>
            </span>
            <span className={`mt-2 block text-sm ${playing === s.mood ? "text-midnight/80" : "text-ivory/80"}`}>{s.description}</span>
            <span className="sr-only">{playing === s.mood ? "Playing. Press to stop." : "Press to play"}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex max-w-sm items-center gap-4">
        <label htmlFor="vol" className="text-sm font-semibold">
          Volume
        </label>
        <input id="vol" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-[var(--color-nile)]" />
      </div>
      <p className="mt-3 text-sm text-muted">Sounds are generated live in your browser and only play when you press a card.</p>
    </div>
  );
}
