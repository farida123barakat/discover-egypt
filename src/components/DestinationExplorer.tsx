"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, destinations, type Category } from "@/content/destinations";
import { Photo } from "./ui";
import { SaveButton } from "./destinations";

const EgyptMap = dynamic(() => import("./EgyptMapInner"), {
  ssr: false,
  loading: () => (
    <div className="grain flex h-[560px] items-center justify-center rounded-[1.25rem] bg-limestone" role="status">
      <span className="text-muted">Loading map…</span>
    </div>
  ),
});

export function DestinationExplorer() {
  const [cat, setCat] = useState<Category | "All">("All");
  const [selected, setSelected] = useState<string | null>(null);
  const list = useMemo(() => destinations.filter((d) => cat === "All" || d.category === cat), [cat]);
  const current = destinations.find((d) => d.slug === selected) ?? null;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter destinations by category">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            aria-pressed={cat === c}
            onClick={() => {
              setCat(c);
              setSelected(null);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {list.length} destinations shown
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[1.25rem] shadow-lg">
          <EgyptMap
            points={list.map((d) => ({ id: d.slug, lat: d.lat, lng: d.lng, label: d.name, sub: d.tagline, href: `/discover/${d.slug}` }))}
            focus={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="flex flex-col gap-4">
          {current ? (
            <article className="card overflow-hidden" aria-live="polite">
              <div className="relative aspect-[16/10]">
                <Photo k={current.photo} label={current.name} className="absolute inset-0 h-full w-full" />
                <div className="absolute right-3 top-3">
                  <SaveButton slug={current.slug} name={current.name} />
                </div>
              </div>
              <div className="p-6">
                <p className="eyebrow">{current.category}</p>
                <h3 className="mt-2 text-3xl">{current.name}</h3>
                <p className="mt-3 text-muted">{current.summary}</p>
                <h4 className="mt-5 text-sm font-semibold text-midnight">Nearby highlights</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {current.attractions.slice(0, 3).map((a) => (
                    <li key={a.name}>· {a.name}</li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-3">
                  <Link href={`/discover/${current.slug}`} className="btn btn-primary">
                    Explore {current.name}
                  </Link>
                  <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                    Back to list
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1" aria-label="Destinations">
              {list.map((d) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => setSelected(d.slug)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left transition hover:bg-limestone"
                  >
                    <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full" />
                    </span>
                    <span>
                      <span className="font-display block text-lg text-midnight">{d.name}</span>
                      <span className="block text-sm text-muted">
                        {d.category} · {d.region}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
