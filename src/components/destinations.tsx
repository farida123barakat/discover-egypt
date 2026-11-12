"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Destination } from "@/content/destinations";
import { photos } from "@/content/images";
import { collectStamp, toggleAttraction, toggleFavourite, useMyEgypt } from "@/lib/client-store";
import { Photo } from "./ui";

export function SaveButton({ slug, name, variant = "light" }: { slug: string; name: string; variant?: "light" | "dark" }) {
  const { favourites } = useMyEgypt();
  const saved = favourites.includes(slug);
  return (
    <button
      type="button"
      onClick={() => toggleFavourite(slug)}
      aria-pressed={saved}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${
        variant === "light" ? "bg-ivory/90 text-midnight hover:bg-ivory" : "bg-midnight text-ivory"
      }`}
    >
      <span className="sr-only">{saved ? `Remove ${name} from saved` : `Save ${name}`}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 4.5 7 4.5c2.1 0 3.6 1.1 5 2.8 1.4-1.7 2.9-2.8 5-2.8 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}

export function DestinationCard({ d, size = "md" }: { d: Destination; size?: "md" | "lg" }) {
  return (
    <article className={`photo-zoom group relative overflow-hidden rounded-[1.5rem] bg-midnight ${size === "lg" ? "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[520px]" : "aspect-[4/5]"}`}>
      <Photo k={d.photo} label={d.name} className="absolute inset-0 h-full w-full" sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="photo-scrim absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/25 to-transparent" />
      <div className="absolute right-4 top-4 z-10">
        <SaveButton slug={d.slug} name={d.name} />
      </div>
      <div className="on-dark absolute inset-x-0 bottom-0 p-6 text-ivory">
        <p className="eyebrow">{d.region}</p>
        <h3 className="mt-2 text-3xl !text-ivory">
          <Link href={`/discover/${d.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {d.name}
          </Link>
        </h3>
        <p className="mt-2 max-w-sm text-sm text-ivory/85">{d.tagline}</p>
      </div>
    </article>
  );
}

export function StampOnVisit({ slug, name }: { slug: string; name: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (collectStamp(slug)) setMsg(`New passport stamp: ${name}! See it in My Egypt.`);
  }, [slug, name]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      {msg && (
        <p className="pointer-events-auto rounded-full bg-midnight px-5 py-3 text-sm font-medium text-ivory shadow-xl">
          <span aria-hidden="true">✦ </span>
          {msg}{" "}
          <Link href="/my-egypt" className="underline">
            Open passport
          </Link>
        </p>
      )}
    </div>
  );
}

export function AttractionList({ d }: { d: Destination }) {
  const { savedAttractions } = useMyEgypt();
  return (
    <ul className="divide-y divide-sand">
      {d.attractions.map((a) => {
        const key = `${d.slug}::${a.name}`;
        const saved = savedAttractions.includes(key);
        return (
          <li key={a.name} className="flex items-start justify-between gap-4 py-5">
            <div>
              <h3 className="text-xl">{a.name}</h3>
              <p className="mt-1 text-muted">{a.note}</p>
            </div>
            <button type="button" className="chip shrink-0" aria-pressed={saved} onClick={() => toggleAttraction(key)}>
              {saved ? "Saved" : "Save"}
              <span className="sr-only"> {a.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export const photoCredit = (k: Destination["photo"]) => (k ? photos[k] : null);
