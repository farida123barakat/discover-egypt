"use client";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { eras } from "@/content/culture";
import { getDestination } from "@/content/destinations";
import { Photo } from "./ui";

export function Timeline() {
  const [active, setActive] = useState(1);
  const [kids, setKids] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const era = eras[active];

  function onKey(e: KeyboardEvent) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? eras.length - 1 : (active + dir + eras.length) % eras.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Historical periods" className="relative flex w-full gap-0 overflow-x-auto pb-2 lg:w-auto" onKeyDown={onKey}>
          {eras.map((e, i) => (
            <button
              key={e.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`era-tab-${e.id}`}
              aria-selected={i === active}
              aria-controls="era-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`group relative min-w-[120px] shrink-0 border-t-2 px-3 pt-4 pb-2 text-left transition ${i === active ? "border-gold" : "border-sand hover:border-sand-deep"}`}
            >
              <span className={`absolute -top-[7px] left-3 h-3 w-3 rounded-full ${i === active ? "bg-gold" : "bg-sand-deep"}`} aria-hidden="true" />
              <span className="block text-xs text-muted">{e.dates}</span>
              <span className={`block text-sm font-semibold ${i === active ? "text-midnight" : "text-muted"}`}>{e.name}</span>
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="h-5 w-5 accent-[var(--color-nile)]" />
          Explain it for children
        </label>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={era.id + kids}
          id="era-panel"
          role="tabpanel"
          aria-labelledby={`era-tab-${era.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]"
        >
          <div>
            <p className="eyebrow">{era.dates}</p>
            <h3 className="mt-2 text-4xl">{era.name}</h3>
            <p className="mt-4 text-lg leading-relaxed">{kids ? era.childVersion : era.summary}</p>
            <p className="mt-6 text-sm font-semibold text-midnight">See it today</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {era.places.map((slug) => {
                const d = getDestination(slug);
                return d ? (
                  <li key={slug}>
                    <Link href={`/discover/${slug}`} className="chip hover:bg-limestone">
                      {d.name} →
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem]">
            <Photo k={getDestination(era.places[0])?.photo ?? null} className="absolute inset-0 h-full w-full" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
