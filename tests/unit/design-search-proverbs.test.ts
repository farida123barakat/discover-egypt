import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildIndex, search } from "@/lib/search";
import { proverbOfTheDay, proverbs } from "@/content/proverbs";

/* ---- Design tokens meet the contrast ratios documented in docs/DESIGN.md ---- */
const css = readFileSync(path.join(__dirname, "../../src/app/globals.css"), "utf8");
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("design tokens", () => {
  it.each([
    ["midnight", "gold-300", 10], // gold CTA text
    ["gold-ink", "ivory", 4.5], // gold text on light
    ["nile", "ivory", 4.5], // links
    ["muted", "ivory", 4.5], // secondary text
    ["muted", "limestone", 4.5],
    ["ivory", "midnight", 7], // text on dark sections
    ["gold-300", "night", 7], // gold eyebrow/icons on the darkest surface
  ])("%s on %s ≥ %s:1", (fg, bg, min) => {
    expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(min as number);
  });
});

/* ---- Site search ---- */
describe("site search", () => {
  const index = buildIndex();
  it("finds destinations by name, ignoring case and accents", () => {
    expect(search(index, "luxor")[0].href).toBe("/discover/luxor");
    expect(search(index, "LÚXOR")[0].href).toBe("/discover/luxor");
  });
  it("finds things by what is inside them", () => {
    expect(search(index, "karnak").some((r) => r.href === "/discover/luxor")).toBe(true);
    expect(search(index, "emergency").some((r) => r.href.includes("safety"))).toBe(true);
  });
  it("requires every word to match", () => {
    expect(search(index, "koshari zzzz")).toEqual([]);
  });
  it("returns nothing for an empty query", () => {
    expect(search(index, "   ")).toEqual([]);
  });
});

/* ---- Proverbs ---- */
describe("proverb of the day", () => {
  it("every proverb is complete, in Arabic script, and tracked for review", () => {
    for (const p of proverbs) {
      expect(p.arabic).toMatch(/[؀-ۿ]/);
      expect(p.transliteration && p.literal && p.meaning && p.useIt).toBeTruthy();
      expect(["editorial-draft", "native-reviewed"]).toContain(p.review.status);
    }
    expect(new Set(proverbs.map((p) => p.id)).size).toBe(proverbs.length);
  });
  it("is the same all day in Cairo and changes the next day", () => {
    const morning = proverbOfTheDay(new Date("2026-11-13T00:30:00+02:00"));
    const night = proverbOfTheDay(new Date("2026-11-13T23:30:00+02:00"));
    const tomorrow = proverbOfTheDay(new Date("2026-11-14T09:00:00+02:00"));
    expect(night.id).toBe(morning.id);
    expect(tomorrow.id).not.toBe(morning.id);
  });
});
