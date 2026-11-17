/**
 * Memory Passport: which pages the printed booklet has, and in what order. Pure — no canvas, no DOM —
 * so the same plan drives the on-screen preview, both PDFs and the tests.
 *
 * It is a souvenir booklet in the shape of a passport. It deliberately carries no state emblem,
 * no document number and no machine-readable zone, and says "Souvenir · not a travel document".
 */
import { getDestination } from "@/content/destinations";
import { challengeById, huntStats, type Achievement, type HuntCategory } from "@/content/hunt";
import { completedChallenges, type Memory } from "./memories";

/** Trim size of a passport page (ISO/IEC 7810 ID-3, the usual passport format) and print bleed. */
export const PASSPORT_MM = { w: 88, h: 125 };
export const PASSPORT_BLEED_MM = 3;
export const STAMPS_PER_PAGE = 4;

export type StampKind = HuntCategory | "memory";

export type PassportStamp = {
  memoryId: string;
  kind: StampKind;
  /** shown as the stamp's main line, e.g. "ASWAN" */
  place: string;
  /** YYYY-MM-DD */
  date: string;
  /** challenge title, or the memory's caption when there's no challenge */
  title: string;
  /** the first memory for a challenge earns its points; repeats don't */
  points: number;
  /** degrees, -9..9, stable for a memory so the preview and print match */
  rotation: number;
  /** small offset inside its slot, -1..1 on each axis */
  jitter: { x: number; y: number };
};

export type PassportSummary = {
  name: string;
  memories: number;
  completed: number;
  total: number;
  points: number;
  places: string[];
  from: string | null;
  to: string | null;
  achievementsEarned: number;
  issued: string;
};

export type PassportPage =
  | { kind: "cover" }
  | { kind: "holder"; summary: PassportSummary; photoMemoryId: string | null }
  | { kind: "stamps"; stamps: PassportStamp[]; sheet: number; sheets: number }
  | { kind: "memory"; memoryId: string; stamp: PassportStamp }
  | { kind: "endorsements"; achievements: Achievement[] }
  | { kind: "notes" }
  | { kind: "back" };

export type PassportPlan = { pages: PassportPage[]; stamps: PassportStamp[]; summary: PassportSummary };

/** Small, stable hash (FNV-1a) so a memory always gets the same tilt and position. */
export function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const dateOf = (m: Memory) => m.visitDate ?? m.createdAt.slice(0, 10);
const placeOf = (m: Memory) => (m.destination && getDestination(m.destination)?.name) || "Egypt";

export function stampFor(m: Memory, firstForChallenge: boolean): PassportStamp {
  const ch = challengeById(m.challengeId);
  const h = hash(m.id);
  const points = ch && firstForChallenge ? { easy: 10, medium: 20, hard: 30 }[ch.difficulty] : 0;
  return {
    memoryId: m.id,
    kind: ch?.category ?? "memory",
    place: placeOf(m),
    date: dateOf(m),
    title: ch?.title ?? (m.caption.trim() || "A memory"),
    points,
    rotation: (h % 19) - 9,
    jitter: { x: (((h >>> 8) % 21) - 10) / 10, y: (((h >>> 16) % 21) - 10) / 10 },
  };
}

/** A memory gets a page of its own when it has something to show beyond the stamp. */
const hasPage = (m: Memory) => !!m.photo || !!m.story.trim() || !!m.caption.trim();

export function planPassport(memories: Memory[], opts: { name?: string; now?: Date } = {}): PassportPlan {
  const now = opts.now ?? new Date();
  // Oldest first: a passport fills up in the order you travel.
  const list = [...memories].sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || a.createdAt.localeCompare(b.createdAt));
  const seen = new Set<string>();
  const stamps = list.map((m) => {
    // Same rule as the points total (completedChallenges): only a memory with a photo or words counts.
    const counts = !!m.challengeId && hasPage(m);
    const first = counts && !seen.has(m.challengeId!);
    if (counts) seen.add(m.challengeId!);
    return stampFor(m, first);
  });

  const stats = huntStats(completedChallenges(memories), memories.length);
  const places = [...new Set(list.map(placeOf))];
  const summary: PassportSummary = {
    name: (opts.name ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
    memories: memories.length,
    completed: stats.completed,
    total: stats.total,
    points: stats.points,
    places,
    from: list.length ? dateOf(list[0]) : null,
    to: list.length ? dateOf(list[list.length - 1]) : null,
    achievementsEarned: stats.achievements.filter((a) => a.earned).length,
    issued: now.toISOString().slice(0, 10),
  };

  const pages: PassportPage[] = [{ kind: "cover" }, { kind: "holder", summary, photoMemoryId: list.find((m) => m.photo)?.id ?? null }];
  // Always at least one stamp page, even when empty: it shows where stamps will go.
  const sheets = Math.max(1, Math.ceil(stamps.length / STAMPS_PER_PAGE));
  for (let i = 0; i < sheets; i++) pages.push({ kind: "stamps", stamps: stamps.slice(i * STAMPS_PER_PAGE, (i + 1) * STAMPS_PER_PAGE), sheet: i + 1, sheets });
  list.forEach((m, i) => hasPage(m) && pages.push({ kind: "memory", memoryId: m.id, stamp: stamps[i] }));
  pages.push({ kind: "endorsements", achievements: stats.achievements });
  // A folded booklet needs a multiple of four pages: fill with note pages before the back cover.
  while ((pages.length + 1) % 4 !== 0) pages.push({ kind: "notes" });
  pages.push({ kind: "back" });
  return { pages, stamps, summary };
}

/**
 * Saddle-stitch imposition: which pages go on each side of each sheet so that, printed double-sided,
 * stacked in order, folded in half and stapled on the fold, the booklet reads 1, 2, 3 … n.
 * Pages are 0-based. `n` must be a multiple of four.
 */
export function bookletSheets(n: number) {
  if (n <= 0 || n % 4 !== 0) throw new Error("A booklet needs a multiple of four pages");
  const sheets: { front: [number, number]; back: [number, number] }[] = [];
  for (let i = 0; i < n / 4; i++) {
    sheets.push({ front: [n - 1 - 2 * i, 2 * i], back: [2 * i + 1, n - 2 - 2 * i] });
  }
  return sheets;
}

/** How the open booklet looks page by page: the cover alone, then facing pages, then the back cover alone. */
export function spreads(n: number): number[][] {
  if (n <= 0) return [];
  if (n === 1) return [[0]];
  const out: number[][] = [[0]];
  for (let i = 1; i < n - 1; i += 2) out.push(i + 1 < n - 1 ? [i, i + 1] : [i]);
  out.push([n - 1]);
  return out;
}

/** What a screen reader hears for a page of the preview (the canvas itself has no text). */
export function describePage(p: PassportPage, memories: Memory[]) {
  switch (p.kind) {
    case "cover":
      return "Cover: Memory Passport, Discover Egypt. Souvenir, not a travel document.";
    case "holder": {
      const s = p.summary;
      return `Traveller page${s.name ? ` for ${s.name}` : ""}: ${s.memories} ${s.memories === 1 ? "memory" : "memories"}, ${s.completed} of ${s.total} challenges, ${s.points} points${s.places.length ? `, places: ${s.places.join(", ")}` : ""}.`;
    }
    case "stamps":
      return p.stamps.length ? `Stamps page ${p.sheet} of ${p.sheets}: ${p.stamps.map((s) => `${s.place}, ${s.title}`).join("; ")}.` : "Stamps page: empty, waiting for your first stamp.";
    case "memory": {
      const m = memories.find((x) => x.id === p.memoryId);
      return `Memory page: ${p.stamp.place}${m?.caption ? `, “${m.caption}”` : ""}${m?.photo ? ", with photo" : ""}.`;
    }
    case "endorsements": {
      const earned = p.achievements.filter((a) => a.earned);
      return `Endorsements: ${earned.length ? earned.map((a) => a.title).join(", ") : "no achievements yet"}.`;
    }
    case "notes":
      return "Notes page, lined for writing.";
    case "back":
      return "Back cover.";
  }
}
