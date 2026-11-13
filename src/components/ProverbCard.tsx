"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote, Shuffle } from "lucide-react";
import { proverbs } from "@/content/proverbs";

/** Proverb of the day, with a button to read another. The starting id comes from the server (Cairo date). */
export function ProverbCard({ initialId }: { initialId: string }) {
  const [idx, setIdx] = useState(() => Math.max(0, proverbs.findIndex((p) => p.id === initialId)));
  const p = proverbs[idx];
  const isToday = p.id === initialId;

  return (
    <figure className="relative overflow-hidden rounded-[1.5rem] bg-midnight text-ivory on-dark">
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gold/10 blur-2xl" />
      <div className="relative grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:p-12">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Quote aria-hidden="true" size={14} /> {isToday ? "Proverb of the day" : "Egyptian proverb"}
          </p>
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <p lang="ar" dir="rtl" className="arabic text-right text-4xl leading-[1.6] text-gold-200 md:text-5xl">
                {p.arabic}
              </p>
              <p className="mt-4 font-display italic text-xl text-ivory/85">{p.transliteration}</p>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.figcaption key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col justify-end">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/65">Word for word</dt>
                <dd className="mt-1 font-display text-2xl">“{p.literal}”</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/65">What it means</dt>
                <dd className="mt-1 text-ivory/90">{p.meaning}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/65">Say it…</dt>
                <dd className="mt-1 text-ivory/90">{p.useIt}</dd>
              </div>
            </dl>
            <div className="mt-8 flex items-center justify-between gap-4">
              <span className="text-xs text-ivory/60">{p.provenance}</span>
              <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setIdx((i) => (i + 1) % proverbs.length)}>
                <Shuffle aria-hidden="true" size={15} /> Another one
              </button>
            </div>
          </motion.figcaption>
        </AnimatePresence>
      </div>
    </figure>
  );
}
