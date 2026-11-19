"use client";
import { useSyncExternalStore } from "react";
import type { Itinerary } from "@/lib/validation";
import { packingDefaults } from "@/content/practical";

/**
 * Personal travel data kept in the browser (localStorage). Nothing personal leaves the device
 * unless the visitor signs in and chooses "Save to my account".
 */
export type Stamp = { slug: string; at: string };
export type PackingItem = { id: string; label: string; done: boolean };

export type MyEgypt = {
  favourites: string[];
  savedAttractions: string[]; // "slug::Attraction name"
  stamps: Stamp[];
  itinerary: Itinerary | null;
  packing: PackingItem[];
  /** favourite recipe slugs */
  recipes: string[];
  /** chosen food region id — never a precise location */
  foodRegion: string | null;
  /** personal bucket-list progress, keyed by official activity id */
  bucket: Record<string, { added: boolean; done: boolean; fav: boolean; doneAt?: string }>;
};

const KEY = "discover-egypt:v1";
const empty = (): MyEgypt => ({
  favourites: [],
  savedAttractions: [],
  stamps: [],
  itinerary: null,
  packing: packingDefaults.map((label, i) => ({ id: `d${i}`, label, done: false })),
  recipes: [],
  foodRegion: null,
  bucket: {},
});

let cache: MyEgypt | null = null;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT = empty();

function load(): MyEgypt {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...empty(), ...(JSON.parse(raw) as Partial<MyEgypt>) } : empty();
  } catch {
    cache = empty();
  }
  return cache;
}

export function update(fn: (s: MyEgypt) => MyEgypt) {
  cache = fn(load());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyEgypt(): MyEgypt {
  return useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
}

/* ---------- actions ---------- */
export const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function toggleFavourite(slug: string) {
  update((s) => ({ ...s, favourites: toggle(s.favourites, slug) }));
}
export function toggleAttraction(key: string) {
  update((s) => ({ ...s, savedAttractions: toggle(s.savedAttractions, key) }));
}
export function collectStamp(slug: string): boolean {
  let added = false;
  update((s) => {
    if (s.stamps.some((x) => x.slug === slug)) return s;
    added = true;
    return { ...s, stamps: [...s.stamps, { slug, at: new Date().toISOString() }] };
  });
  return added;
}
export function toggleRecipe(slug: string) {
  update((s) => ({ ...s, recipes: toggle(s.recipes, slug) }));
}
export function setFoodRegion(id: string | null) {
  update((s) => ({ ...s, foodRegion: id }));
}
type BucketEntry = MyEgypt["bucket"][string];
export function setBucket(id: string, change: Partial<BucketEntry>) {
  update((s) => {
    const cur: BucketEntry = s.bucket[id] ?? { added: false, done: false, fav: false };
    const next: BucketEntry = { ...cur, ...change };
    if (change.done === true && !cur.done) next.doneAt = new Date().toISOString();
    if (change.done === false) delete next.doneAt;
    if (next.done) next.added = true;
    const bucket = { ...s.bucket };
    if (!next.added && !next.done && !next.fav) delete bucket[id];
    else bucket[id] = next;
    return { ...s, bucket };
  });
}
export function replaceBucket(bucket: MyEgypt["bucket"]) {
  update((s) => ({ ...s, bucket }));
}
export function saveItinerary(it: Itinerary | null) {
  update((s) => ({ ...s, itinerary: it }));
}
export function setPacking(items: PackingItem[]) {
  update((s) => ({ ...s, packing: items }));
}
export function clearAll() {
  update(() => empty());
}
