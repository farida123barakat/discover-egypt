/**
 * Album backup as a file the visitor keeps. With no accounts or database, this is how memories
 * survive clearing the browser or moving to a new phone: save the file, open it on the other device.
 *
 * Reading a file back in is treated as untrusted input: every field is checked, text is capped,
 * and only real JPEG photos (the format the album saves) are accepted.
 */
import { CAPTION_MAX, STORY_MAX, TEMPLATES, type Memory, type TemplateId } from "./memories";

export const FILE_FORMAT = "discover-egypt-album";
export const FILE_VERSION = 1;
export const MAX_FILE_BYTES = 150 * 1024 * 1024;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // the album stores photos at 1800px, well under this
const MAX_MEMORIES = 500;

export class AlbumFileError extends Error {}

type FileMemory = Omit<Memory, "photo" | "backedUpAt"> & { photo: string | null };

async function blobBytes(b: Blob): Promise<Uint8Array> {
  if (typeof b.arrayBuffer === "function") return new Uint8Array(await b.arrayBuffer());
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(b);
  });
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

/** The whole album as JSON text, photos included. */
export async function albumToJson(memories: Memory[], now = new Date()): Promise<string> {
  const out: FileMemory[] = [];
  for (const m of memories) {
    out.push({
      id: m.id,
      challengeId: m.challengeId,
      destination: m.destination,
      visitDate: m.visitDate,
      caption: m.caption,
      story: m.story,
      template: m.template,
      arabic: m.arabic,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      photo: m.photo ? `data:image/jpeg;base64,${toBase64(await blobBytes(m.photo))}` : null,
    });
  }
  return JSON.stringify({ format: FILE_FORMAT, version: FILE_VERSION, exportedAt: now.toISOString(), memories: out });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const optStr = (v: unknown, re: RegExp) => (typeof v === "string" && re.test(v) ? v : null);
const ID = /^[A-Za-z0-9-]{8,64}$/;
const SLUG = /^[a-z0-9-]{1,60}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/;

/** Reads a backup file's text back into memories. Throws AlbumFileError with a message for the visitor. */
export function albumFromJson(text: string): Memory[] {
  if (text.length > MAX_FILE_BYTES * 1.4) throw new AlbumFileError("That file is too large to be an album backup.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AlbumFileError("That file isn't an album backup. Choose the .json file you saved from this page.");
  }
  const d = data as { format?: unknown; version?: unknown; memories?: unknown };
  if (!d || d.format !== FILE_FORMAT || !Array.isArray(d.memories)) {
    throw new AlbumFileError("That file isn't an album backup. Choose the .json file you saved from this page.");
  }
  if (typeof d.version !== "number" || d.version > FILE_VERSION) throw new AlbumFileError("That backup was made by a newer version of the site. Reload the page and try again.");
  if (d.memories.length > MAX_MEMORIES) throw new AlbumFileError(`A backup can hold up to ${MAX_MEMORIES} memories.`);

  const out: Memory[] = [];
  for (const raw of d.memories as Record<string, unknown>[]) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !ID.test(raw.id)) continue;
    let photo: Blob | null = null;
    if (typeof raw.photo === "string") {
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(raw.photo);
      if (!m) continue; // not a photo this site made: skip that memory rather than store an unknown file
      let bytes: Uint8Array;
      try {
        bytes = fromBase64(m[1]);
      } catch {
        continue;
      }
      if (!isJpeg(bytes) || bytes.length > MAX_PHOTO_BYTES) continue;
      photo = new Blob([bytes as BlobPart], { type: "image/jpeg" });
    }
    const template = (TEMPLATES as readonly string[]).includes(raw.template as string) ? (raw.template as TemplateId) : "golden-hour";
    const createdAt = optStr(raw.createdAt, STAMP) ?? new Date(0).toISOString();
    out.push({
      id: raw.id,
      challengeId: optStr(raw.challengeId, SLUG),
      destination: optStr(raw.destination, SLUG),
      visitDate: optStr(raw.visitDate, DAY),
      caption: str(raw.caption, CAPTION_MAX),
      story: str(raw.story, STORY_MAX),
      template,
      arabic: raw.arabic === true,
      photo,
      createdAt,
      updatedAt: optStr(raw.updatedAt, STAMP) ?? createdAt,
      backedUpAt: null,
    });
  }
  return out;
}

export const albumFileName = (now = new Date()) => `discover-egypt-album-${now.toISOString().slice(0, 10)}.json`;
