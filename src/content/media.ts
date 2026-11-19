/**
 * Watch & Discover — historical media per destination (seed data).
 *
 * Two kinds of item:
 *  - "original": our own animated explainers (src/content/explainers.ts), rendered to MP4 with
 *    WebVTT captions by scripts/render-explainers.ts and served from /media. Captions, transcript
 *    and chapters all come from the same script, so they always match the picture.
 *  - "youtube": a video by someone else, embedded from the creator's own channel through
 *    youtube-nocookie.com. We never download or re-upload other people's videos.
 *
 * Nothing here is public on the live site until an administrator publishes it. Seeds start as
 * drafts: originals need an editor's fact check, embeds need someone to watch them, confirm
 * they still play, and record the duration and captions.
 */
import { withBase } from "@/lib/base-path";
import { explainers, timeline, type Source } from "./explainers";

export type MediaChapter = { start: number; title: string };
export type TranscriptLine = { start: number; text: string };

export type MediaItem = {
  id: string;
  title: string;
  summary: string;
  kind: "original" | "youtube";
  destinations: string[];
  period: string;
  /** seconds; null until someone has checked it */
  durationSec: number | null;
  /** original: the explainer this film is rendered from */
  explainerId?: string;
  /** youtube: the 11-character video id, and who published it */
  youtubeId?: string;
  channel?: string;
  /** "Captions available on YouTube" etc. — recorded by the reviewer */
  captionsNote?: string;
  credit: string;
  license: string;
  /** admin-entered for embeds; derived from the script for originals */
  chapters: MediaChapter[];
  transcript: TranscriptLine[];
  sources: Source[];
  status: "draft" | "published";
  featured: boolean;
  provenance: "original-ai-assisted" | "curated-embed";
  lastReviewed: string | null;
  reviewer?: string;
  createdAt: string;
};

export const MEDIA_FILES = (id: string) => ({
  src: withBase(`/media/${id}.mp4`),
  poster: withBase(`/media/${id}-poster.jpg`),
  backdrop: withBase(`/media/${id}-backdrop.jpg`),
  captions: withBase(`/media/${id}.en.vtt`),
  chapters: withBase(`/media/${id}.chapters.vtt`),
});

function fromExplainer(id: string, featured: boolean): MediaItem {
  const e = explainers.find((x) => x.id === id)!;
  const t = timeline(e);
  return {
    id: e.id,
    title: e.title,
    summary: e.summary,
    kind: "original",
    destinations: e.destinations,
    period: e.period,
    durationSec: Math.round(t.duration),
    explainerId: e.id,
    credit: "Discover Egypt (original animation)",
    license: "© Discover Egypt",
    chapters: t.chapters.map((c) => ({ start: c.start, title: c.title })),
    transcript: t.cues.map((c) => ({ start: c.start, text: c.text })),
    sources: e.sources,
    status: "draft",
    featured,
    provenance: "original-ai-assisted",
    lastReviewed: null,
    createdAt: "2026-11-13",
  };
}

export const mediaSeed: MediaItem[] = [
  fromExplainer("great-pyramid-how", true),
  fromExplainer("moving-abu-simbel", true),
  fromExplainer("nile-three-seasons", false),
  {
    id: "whe-hatshepsut",
    title: "Hatshepsut: the forgotten woman who was a king of Egypt",
    summary:
      "World History Encyclopedia's film on Hatshepsut, the female pharaoh whose mortuary temple at Deir el-Bahari is one of the great sights of Luxor's West Bank.",
    kind: "youtube",
    destinations: ["luxor"],
    period: "New Kingdom, 18th Dynasty",
    durationSec: null,
    youtubeId: "-qw-_IHkKoI",
    channel: "World History Encyclopedia",
    credit: "World History Encyclopedia",
    license: "Standard YouTube licence — embedded from the creator's channel, not re-uploaded",
    chapters: [],
    transcript: [],
    sources: [{ name: "World History Encyclopedia — video listing", url: "https://www.worldhistory.org/video/2767/the-great-pyramid-of-giza-in-egypt/" }],
    status: "draft",
    featured: false,
    provenance: "curated-embed",
    lastReviewed: null,
    createdAt: "2026-11-13",
  },
  {
    id: "whe-ptolemaic-dynasty",
    title: "The Ptolemaic dynasty of ancient Egypt: from Ptolemy I to Cleopatra VII",
    summary:
      "World History Encyclopedia's film on the Greek-speaking dynasty that ruled from Alexandria for three centuries, ending with Cleopatra.",
    kind: "youtube",
    destinations: ["alexandria"],
    period: "Ptolemaic period, 305–30 BCE",
    durationSec: null,
    youtubeId: "0Qi_yw5-qCg",
    channel: "World History Encyclopedia",
    credit: "World History Encyclopedia",
    license: "Standard YouTube licence — embedded from the creator's channel, not re-uploaded",
    chapters: [],
    transcript: [],
    sources: [{ name: "World History Encyclopedia — video listing", url: "https://www.worldhistory.org/video/2767/the-great-pyramid-of-giza-in-egypt/" }],
    status: "draft",
    featured: false,
    provenance: "curated-embed",
    lastReviewed: null,
    createdAt: "2026-11-13",
  },
];

/** Original films are short explainers; embedded documentaries should be 5–15 minutes. */
export const EMBED_MIN_SEC = 300;
export const EMBED_MAX_SEC = 900;

export function formatDuration(s: number | null) {
  if (s == null) return "Length not checked";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Problems that block publishing. Empty list = ready. */
export function publishBlockers(m: MediaItem): string[] {
  const out: string[] = [];
  if (!m.sources.length) out.push("Add at least one source.");
  if (m.durationSec == null) out.push("Record the length after watching it.");
  if (m.kind === "youtube") {
    if (!m.youtubeId) out.push("Add the YouTube video id.");
    if (!m.captionsNote?.trim()) out.push("Record whether captions are available.");
    if (m.durationSec != null && (m.durationSec < EMBED_MIN_SEC || m.durationSec > EMBED_MAX_SEC)) out.push("Embedded videos should run 5–15 minutes.");
  }
  if (!m.destinations.length) out.push("Assign at least one destination.");
  return out;
}
