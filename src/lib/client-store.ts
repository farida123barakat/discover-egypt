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
};

const KEY = "discover-egypt:v1";
const empty = (): MyEgypt => ({
  favourites: [],
  savedAttractions: [],
  stamps: [],
  itinerary: null,
  packing: packingDefaults.map((label, i) => ({ id: `d${i}`, label, done: false })),
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
export function saveItinerary(it: Itinerary | null) {
  update((s) => ({ ...s, itinerary: it }));
}
export function setPacking(items: PackingItem[]) {
  update((s) => ({ ...s, packing: items }));
}
export function clearAll() {
  update(() => empty());
}

/** Test helper */
export function _resetClientStore() {
  cache = null;
  listeners.clear();
}
