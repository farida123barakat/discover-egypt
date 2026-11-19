"use client";
import { withBase } from "@/lib/base-path";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { photo, type PhotoKey } from "@/content/images";
import type { Interest } from "@/content/destinations";
import { INTEREST_ICONS } from "./FindYourEgypt";
import { usePrefersReducedMotion } from "./ui";

const SLIDES: { k: PhotoKey; place: string; pos?: string }[] = [
  { k: "heroGiza", place: "Giza plateau at sunset" },
  { k: "heroAswan", place: "The Nile at Aswan" },
  { k: "heroWhiteDesert", place: "The White Desert" },
  { k: "luxorBalloons", place: "Balloons over Luxor at sunrise", pos: "center 70%" },
];
const QUICK: Interest[] = ["history", "beaches", "adventure", "food", "culture"];
const INTERVAL = 8000;

export function Hero() {
  const reduce = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [picked, setPicked] = useState<Interest[]>([]);
  const go = useCallback((d: number) => setI((x) => (x + d + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (reduce || paused || hover) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, reduce, paused, hover, go]);

  const slide = SLIDES[i];
  const p = photo(slide.k)!;
  const findHref = `/discover${picked.length ? `?i=${picked.join(",")}` : ""}#find`;

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby="hero-h"
      className="on-dark relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-night text-ivory"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      {/* Photos */}
      <div className="golden-grade absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div key={slide.k} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: "easeInOut" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Commons thumbnails with srcset */}
            <img
              src={p.src}
              srcSet={p.srcSet}
              sizes="100vw"
              alt={p.alt}
              fetchPriority={i === 0 ? "high" : "auto"}
              referrerPolicy="no-referrer"
              style={{ objectPosition: slide.pos }}
              className="kenburns h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-28 pt-36 md:px-8 lg:grid-cols-[1fr_400px] lg:items-end lg:pb-24">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="eyebrow !text-gold-300 [text-shadow:0_1px_12px_rgb(10_18_32/0.8)]">
            A thousand stories. One destination.
          </motion.p>
          <motion.h1
            id="hero-h"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="display-hero mt-5 max-w-4xl !text-ivory [text-shadow:0_2px_30px_rgb(10_18_32/0.45)]"
          >
            You haven&rsquo;t seen Egypt yet.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.25 }} className="display-italic mt-6 max-w-xl text-ivory/90">
            Pyramids at dawn, coral reefs at noon, a Cairo rooftop at midnight. Find the Egypt that is yours.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="mt-9 flex flex-wrap gap-3">
            <Link href="/discover" className="btn btn-gold">
              Discover Egypt <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link href="/plan" className="btn btn-outline-light">
              Plan your journey <CalendarDays aria-hidden="true" size={17} />
            </Link>
          </motion.div>
        </div>

        {/* Find Your Egypt quick panel */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55 }}
          action="/discover"
          className="glass p-6"
          aria-labelledby="quick-h"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.assign(withBase(findHref));
          }}
        >
          <p id="quick-h" className="flex items-center gap-2 font-display text-2xl !text-ivory">
            <Sparkles aria-hidden="true" size={22} strokeWidth={1.5} className="text-gold-300" /> Find your Egypt
          </p>
          <p className="mt-1 text-sm text-ivory/80">Tell us what you love…</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Interests">
            {QUICK.map((q) => {
              const Icon = INTEREST_ICONS[q];
              const on = picked.includes(q);
              return (
                <button key={q} type="button" aria-pressed={on} onClick={() => setPicked((v) => (on ? v.filter((x) => x !== q) : [...v, q]))} className="chip !min-h-9 !px-3 text-sm capitalize">
                  <Icon aria-hidden={true} size={15} strokeWidth={1.75} /> {q}
                </button>
              );
            })}
          </div>
          <button type="submit" className="btn btn-gold mt-5 w-full">
            Find my perfect trip <ArrowRight aria-hidden="true" size={17} />
          </button>
        </motion.form>
      </div>

      {/* Slide controls */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 pb-6 md:px-8">
          <p className="hidden text-xs text-ivory/75 sm:block" aria-live={paused || reduce ? "polite" : "off"}>
            <span className="font-semibold text-ivory">{slide.place}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href={p.sourcePage} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
              Photo: {p.author}, {p.license}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <div className="ml-auto flex items-center gap-1 text-ivory">
            <button type="button" onClick={() => setPaused((v) => !v)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ivory/10" disabled={reduce}>
              {paused || reduce ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
              <span className="sr-only">{paused ? "Play slideshow" : "Pause slideshow"}</span>
            </button>
            <button type="button" onClick={() => go(-1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ivory/10">
              <ChevronLeft aria-hidden="true" size={18} />
              <span className="sr-only">Previous photo</span>
            </button>
            <span className="flex items-center gap-3 px-1 text-xs tabular-nums" aria-hidden="true">
              {i + 1} / {SLIDES.length}
              <span className="relative h-px w-16 bg-ivory/30">
                <span className="absolute inset-y-0 left-0 bg-gold-300 transition-[width] duration-700" style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} />
              </span>
            </span>
            <span className="sr-only">
              Photo {i + 1} of {SLIDES.length}
            </span>
            <button type="button" onClick={() => go(1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ivory/10">
              <ChevronRight aria-hidden="true" size={18} />
              <span className="sr-only">Next photo</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
