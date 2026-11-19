"use client";
/**
 * Memories live on the visitor's device, in IndexedDB. They are private by default: nothing is sent
 * anywhere unless the visitor signs in and chooses "Back up", asks for a printed postcard, or shares a
 * postcard themselves. Photos are re-encoded on the device, which drops EXIF data such as GPS position.
 */
import { useSyncExternalStore } from "react";

export const TEMPLATES = ["golden-hour", "papyrus", "nile", "cairo-night", "desert"] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export type Memory = {
  id: string;
  challengeId: string | null;
  destination: string | null;
  /** YYYY-MM-DD */
  visitDate: string | null;
  caption: string;
  story: string;
  template: TemplateId;
  arabic: boolean;
  photo: Blob | null;
  createdAt: string;
  updatedAt: string;
  /** set when the memory has been backed up to the visitor's account */
  backedUpAt?: string | null;
};

export const CAPTION_MAX = 120;
export const STORY_MAX = 600;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // before processing
export const PHOTO_MAX_EDGE = 1800;

const DB = "discover-egypt-memories";
const STORE = "memories";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("unsupported"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open storage"));
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(r ? r.result : undefined);
    };
    t.onerror = () => reject(t.error ?? new Error("Storage error"));
    t.onabort = () => reject(t.error ?? new Error("Storage full or blocked"));
  });
}

/* ---- tiny external store so every component sees the same list ---- */
type State = { status: "loading" | "ready" | "unavailable"; memories: Memory[] };
let state: State = { status: "loading", memories: [] };
const listeners = new Set<() => void>();
const SERVER: State = { status: "loading", memories: [] };
let started = false;

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export async function refreshMemories() {
  try {
    const all = ((await tx<Memory[]>("readonly", (s) => s.getAll())) ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    emit({ status: "ready", memories: all });
  } catch {
    emit({ status: "unavailable", memories: [] });
  }
}

export function useMemories(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      if (!started) {
        started = true;
        void refreshMemories();
      }
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER,
  );
}

export async function saveMemory(m: Memory) {
  await tx("readwrite", (s) => s.put(m));
  await refreshMemories();
}

export async function getMemory(id: string) {
  return (await tx<Memory>("readonly", (s) => s.get(id))) ?? null;
}

export async function deleteMemory(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  await refreshMemories();
}

export async function deleteAllMemories() {
  await tx("readwrite", (s) => s.clear());
  await refreshMemories();
}

export function newId() {
  return crypto.randomUUID();
}

/** Completed challenge ids: a challenge counts once it has a memory with a photo or some words. */
export function completedChallenges(list: Memory[]) {
  return [...new Set(list.filter((m) => m.challengeId && (m.photo || m.caption.trim() || m.story.trim())).map((m) => m.challengeId!))];
}

export class PhotoError extends Error {}

/**
 * Check, shrink and re-encode a photo on the device. Rejects anything that is not a real image.
 * Re-encoding through a canvas drops all metadata (EXIF, including any GPS position).
 */
export async function processPhoto(file: File, maxEdge = PHOTO_MAX_EDGE): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new PhotoError("That file is not a photo. Choose a JPEG, PNG, WebP or HEIC image.");
  if (file.size > MAX_PHOTO_BYTES) throw new PhotoError("That photo is larger than 15 MB. Please choose a smaller one.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("We couldn't read that photo. Try a JPEG or PNG — some phones save HEIC photos that browsers can't open.");
  }
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale)),
    h = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new PhotoError("We couldn't process that photo. Please try another one.");
  return blob;
}
