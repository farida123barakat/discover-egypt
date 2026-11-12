"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ENVIRONMENTS, INTERESTS, type Environment, type Interest } from "@/content/destinations";
import { recommend, type Preferences, type Recommendation } from "@/lib/recommend";
import { STYLES, styleLevel, type Style } from "@/lib/budget";
import { Photo } from "./ui";
import { SaveButton } from "./destinations";

const INTEREST_ICONS: Record<Interest, string> = {
  history: "𓂀",
  beaches: "◠",
  diving: "≋",
  adventure: "▲",
  food: "◉",
  culture: "✦",
  family: "❖",
  relaxation: "☾",
  photography: "◎",
  architecture: "⌂",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STEPS = ["Interests", "Setting", "Style", "Timing"] as const;

export function FindYourEgypt({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [environment, setEnvironment] = useState<Environment | "any">("any");
  const [style, setStyle] = useState<Style>("comfortable");
  const [days, setDays] = useState(7);
  const [month, setMonth] = useState<number | null>(null);
  const [pace, setPace] = useState<Preferences["pace"]>("balanced");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function next() {
    if (step === 0 && interests.length === 0) {
      setError("Choose at least one interest to continue.");
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setResults(recommend({ interests, environment, budgetLevel: styleLevel(style), days, month, pace }));
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }

  function restart() {
    setResults(null);
    setStep(0);
  }

  if (results) {
    return (
      <div>
        <h3 ref={headingRef} tabIndex={-1} className="text-3xl outline-none md:text-4xl">
          Your Egypt
        </h3>
        {results.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-limestone p-8">
            <p className="text-lg">No destination fits every choice. Try a longer trip, a different month or fewer filters.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={restart}>
              Change my answers
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-muted">Based on {interests.length} interests, a {style} style and {days} days.</p>
            <ol className="mt-8 grid gap-6 md:grid-cols-2">
              {results.map((r, i) => (
                <motion.li
                  key={r.destination.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card overflow-hidden"
                >
                  <div className="relative aspect-[16/9]">
                    <Photo k={r.destination.photo} label={r.destination.name} className="absolute inset-0 h-full w-full" />
                    <span className="absolute left-4 top-4 rounded-full bg-ivory px-3 py-1 text-xs font-bold text-midnight">Match #{i + 1}</span>
                    <div className="absolute right-4 top-4">
                      <SaveButton slug={r.destination.slug} name={r.destination.name} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-display text-2xl text-midnight">{r.destination.name}</h4>
                    <p className="mt-1 text-muted">{r.destination.tagline}</p>
                    <p className="mt-4 text-sm font-semibold text-midnight">Why it matches you</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {r.reasons.slice(0, 3).map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <span aria-hidden="true" className="text-gold">
                            ✦
                          </span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/discover/${r.destination.slug}`} className="mt-5 inline-block font-semibold text-nile underline underline-offset-4">
                      Explore {r.destination.name}
                    </Link>
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/plan?from=${results.map((r) => r.destination.slug).join(",")}&days=${days}&style=${style}`} className="btn btn-primary">
                Build a trip with these
              </Link>
              <button type="button" className="btn btn-ghost" onClick={restart}>
                Start again
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <ol className="flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`rounded-full px-3 py-1 text-xs font-semibold ${i <= step ? "bg-midnight text-ivory" : "bg-sand/60 text-muted"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.fieldset
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          {step === 0 && (
            <>
              <legend className="font-display text-3xl text-midnight">What makes a trip unforgettable for you?</legend>
              <p className="mt-2 text-muted">Choose as many as you like.</p>
              <div className={`mt-6 grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
                {INTERESTS.map((i) => (
                  <label key={i} className="chip cursor-pointer justify-start !rounded-2xl !py-3 capitalize">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={interests.includes(i)}
                      onChange={() => setInterests((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))}
                    />
                    <span aria-hidden="true" className="w-5 text-center text-lg">
                      {INTEREST_ICONS[i]}
                    </span>
                    {i}
                  </label>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <legend className="font-display text-3xl text-midnight">Where do you feel most alive?</legend>
              <div className="mt-6 flex flex-wrap gap-3" role="radiogroup">
                {(["any", ...ENVIRONMENTS] as const).map((e) => (
                  <label key={e} className="chip cursor-pointer capitalize">
                    <input type="radio" name="env" className="sr-only" checked={environment === e} onChange={() => setEnvironment(e)} />
                    {e === "any" ? "Surprise me" : e === "sea" ? "By the sea" : e === "river" ? "On the Nile" : e}
                  </label>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <legend className="font-display text-3xl text-midnight">How do you like to travel?</legend>
              <div className="mt-6 flex flex-wrap gap-3">
                {STYLES.map((s) => (
                  <label key={s} className="chip cursor-pointer capitalize">
                    <input type="radio" name="style" className="sr-only" checked={style === s} onChange={() => setStyle(s)} />
                    {s}
                  </label>
                ))}
              </div>
              <p className="mt-8 font-semibold text-midnight">Pace</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {(["slow", "balanced", "packed"] as const).map((p) => (
                  <label key={p} className="chip cursor-pointer capitalize">
                    <input type="radio" name="pace" className="sr-only" checked={pace === p} onChange={() => setPace(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <legend className="font-display text-3xl text-midnight">When, and for how long?</legend>
              <div className="mt-6 max-w-md">
                <label htmlFor="fye-days" className="font-semibold text-midnight">
                  Trip length: <output>{days} days</output>
                </label>
                <input id="fye-days" type="range" min={2} max={21} value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-3 w-full accent-[var(--color-nile)]" />
              </div>
              <p className="mt-8 font-semibold text-midnight">Month (optional)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="chip cursor-pointer">
                  <input type="radio" name="month" className="sr-only" checked={month === null} onChange={() => setMonth(null)} />
                  Not sure
                </label>
                {MONTHS.map((m, i) => (
                  <label key={m} className="chip cursor-pointer !px-3">
                    <input type="radio" name="month" className="sr-only" checked={month === i + 1} onChange={() => setMonth(i + 1)} />
                    {m}
                  </label>
                ))}
              </div>
            </>
          )}
        </motion.fieldset>
      </AnimatePresence>

      <p role="alert" className="field-error min-h-6">
        {error}
      </p>
      <div className="mt-4 flex gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={next}>
          {step === STEPS.length - 1 ? "Show my Egypt" : "Continue"}
        </button>
      </div>
    </div>
  );
}
