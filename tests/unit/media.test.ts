import { describe, expect, it } from "vitest";
import { explainers, timeline, toChapterVtt, toVtt, cueDuration } from "@/content/explainers";
import { mediaSeed, publishBlockers, formatDuration, EMBED_MIN_SEC } from "@/content/media";
import { destinations } from "@/content/destinations";
import { mediaSchema, parseTimedLines } from "@/lib/validation";
import { activeIndex, clock } from "@/components/media/MediaPlayer";

const slugs = new Set(destinations.map((d) => d.slug));

describe("explainer timelines", () => {
  for (const e of explainers) {
    it(`${e.id}: cues are ordered, never overlap, and fit inside their chapters`, () => {
      const { cues, chapters, duration } = timeline(e);
      expect(cues.length).toBe(e.chapters.reduce((n, c) => n + c.lines.length, 0));
      for (let i = 1; i < cues.length; i++) expect(cues[i].start).toBeGreaterThanOrEqual(cues[i - 1].end);
      for (const c of cues) expect(c.end).toBeGreaterThan(c.start);
      expect(chapters[0].start).toBe(0);
      for (let i = 1; i < chapters.length; i++) expect(chapters[i].start).toBe(chapters[i - 1].end);
      expect(chapters.at(-1)!.end).toBe(duration);
      expect(cues.at(-1)!.end).toBeLessThanOrEqual(duration);
    });
    it(`${e.id}: has sources, known destinations and readable captions`, () => {
      expect(e.sources.length).toBeGreaterThanOrEqual(3);
      for (const s of e.sources) expect(s.url).toMatch(/^https:\/\//);
      for (const d of e.destinations) expect(slugs.has(d)).toBe(true);
      for (const c of e.chapters) for (const l of c.lines) expect(l.length).toBeLessThanOrEqual(170);
    });
  }
  it("gives every caption enough time to read", () => {
    expect(cueDuration("Short.")).toBeGreaterThanOrEqual(3.4);
    const long = "word ".repeat(26).trim();
    expect(cueDuration(long)).toBeGreaterThanOrEqual(10);
  });
  it("writes valid WebVTT for captions and chapters", () => {
    const { cues, chapters } = timeline(explainers[0]);
    const vtt = toVtt(cues);
    expect(vtt.startsWith("WEBVTT\n\n1\n00:00:01.600 --> ")).toBe(true);
    expect(vtt).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/);
    expect(toVtt([{ start: 0, end: 1, text: "a --> b" }])).not.toContain("a --> b");
    const ch = toChapterVtt(chapters);
    expect(ch).toContain("chapter-1\n00:00:00.000 --> ");
    expect(ch).toContain(chapters[1].title);
  });
});

describe("media seed and publishing rules", () => {
  it("starts everything as a draft", () => {
    expect(mediaSeed.every((m) => m.status === "draft")).toBe(true);
  });
  it("embeds come only from YouTube ids and never point at a re-upload", () => {
    for (const m of mediaSeed.filter((x) => x.kind === "youtube")) {
      expect(m.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(m.license).toMatch(/not re-uploaded/);
      // Unchecked embeds cannot be published yet.
      expect(publishBlockers(m).length).toBeGreaterThan(0);
    }
  });
  it("original films are ready to publish once an editor approves", () => {
    for (const m of mediaSeed.filter((x) => x.kind === "original")) expect(publishBlockers(m)).toEqual([]);
  });
  it("enforces 5–15 minutes for embeds", () => {
    const e = { ...mediaSeed.find((x) => x.kind === "youtube")!, durationSec: EMBED_MIN_SEC - 1, captionsNote: "Yes" };
    expect(publishBlockers(e).join(" ")).toMatch(/5–15 minutes/);
    expect(publishBlockers({ ...e, durationSec: 600 })).toEqual([]);
  });
  it("formats durations", () => {
    expect(formatDuration(290)).toBe("4:50");
    expect(formatDuration(null)).toBe("Length not checked");
    expect(clock(3725)).toBe("1:02:05");
    expect(clock(65)).toBe("1:05");
  });
  it("finds the active transcript line", () => {
    const list = [{ start: 0 }, { start: 5 }, { start: 9 }];
    expect(activeIndex(list, -1)).toBe(-1);
    expect(activeIndex(list, 0)).toBe(0);
    expect(activeIndex(list, 6.5)).toBe(1);
    expect(activeIndex(list, 100)).toBe(2);
  });
});

describe("admin input", () => {
  it("parses chapter and transcript lines", () => {
    expect(parseTimedLines("0:00 Intro\n1:05 Middle\n1:02:30 Late")).toEqual([
      { start: 0, text: "Intro" },
      { start: 65, text: "Middle" },
      { start: 3750, text: "Late" },
    ]);
    expect(parseTimedLines("Intro without time")).toHaveProperty("error");
    expect(parseTimedLines("0:75 Bad seconds")).toHaveProperty("error");
  });
  it("validates media items", () => {
    const base = { ...mediaSeed[3], status: "draft" as const };
    expect(mediaSchema.safeParse(base).success).toBe(true);
    expect(mediaSchema.safeParse({ ...base, destinations: ["atlantis"] }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...base, sources: [{ name: "Insecure", url: "http://example.org" }] }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...base, youtubeId: undefined }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...base, durationSec: 600, chapters: [{ start: 700, title: "After the end" }] }).success).toBe(false);
  });
});
