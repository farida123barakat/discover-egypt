import { describe, expect, it } from "vitest";
import { challenges, HUNT_CATEGORIES } from "@/content/hunt";
import type { Memory } from "@/lib/memories";
import { dateRange, PAGE, SOUVENIR, STAMP_STYLE, stampDate } from "@/lib/passport";
import { bookletSheets, describePage, hash, PASSPORT_BLEED_MM, PASSPORT_MM, planPassport, spreads, STAMPS_PER_PAGE, stampFor } from "@/lib/passport-plan";
import { MM } from "@/lib/postcard";

let n = 0;
const mem = (over: Partial<Memory> = {}): Memory => {
  n++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  return { id, challengeId: null, destination: null, visitDate: null, caption: "", story: "", template: "golden-hour", arabic: false, photo: null, createdAt: `2026-11-${String((n % 27) + 1).padStart(2, "0")}T10:00:00.000Z`, updatedAt: "2026-11-01T10:00:00.000Z", ...over };
};
const jpeg = () => new Blob(["x"], { type: "image/jpeg" });
const NOW = new Date("2026-11-17T12:00:00Z");

describe("passport page size", () => {
  it("is passport size (88 × 125 mm) with 3 mm bleed, at the postcards' 12 px/mm", () => {
    expect(PASSPORT_MM).toEqual({ w: 88, h: 125 });
    expect(PASSPORT_BLEED_MM).toBe(3);
    expect(PAGE).toEqual({ w: 94 * MM, h: 131 * MM });
  });
  it("says it is a souvenir, not a travel document", () => {
    expect(SOUVENIR).toBe("SOUVENIR · NOT A TRAVEL DOCUMENT");
  });
});

describe("planning the booklet", () => {
  it("still makes a complete booklet with no memories", () => {
    const { pages, summary } = planPassport([], { now: NOW });
    expect(pages.map((p) => p.kind)).toEqual(["cover", "holder", "stamps", "endorsements", "notes", "notes", "notes", "back"]);
    expect(summary).toMatchObject({ memories: 0, completed: 0, points: 0, places: [], from: null, to: null, issued: "2026-11-17", name: "" });
  });

  it("always has a multiple of four pages, cover first and back cover last", () => {
    for (let count = 0; count <= 30; count++) {
      const list = Array.from({ length: count }, (_, i) => mem({ challengeId: challenges[i % challenges.length].id, destination: challenges[i % challenges.length].destination, caption: i % 3 ? "" : "Words", photo: i % 2 ? jpeg() : null }));
      const { pages } = planPassport(list, { now: NOW });
      expect(pages.length % 4, `${count} memories`).toBe(0);
      expect(pages[0].kind).toBe("cover");
      expect(pages[1].kind).toBe("holder");
      expect(pages[pages.length - 1].kind).toBe("back");
      expect(pages.filter((p) => p.kind === "endorsements")).toHaveLength(1);
    }
  });

  it("stamps every memory once, oldest first, four to a page", () => {
    const list = [
      mem({ visitDate: "2026-11-14", challengeId: "aswan-felucca", destination: "aswan" }),
      mem({ visitDate: "2026-11-10", challengeId: "giza-scale", destination: "giza" }),
      mem({ visitDate: "2026-11-12", challengeId: "karnak-cartouche", destination: "luxor" }),
      mem({ visitDate: "2026-11-15", challengeId: "nubian-door", destination: "nubia" }),
      mem({ visitDate: "2026-11-16", challengeId: null, destination: "alexandria", caption: "Ice cream" }),
    ];
    const { pages, stamps } = planPassport(list, { now: NOW });
    expect(stamps.map((s) => s.place)).toEqual(["Giza", "Luxor", "Aswan", "Nubian villages", "Alexandria"]);
    const stampPages = pages.filter((p) => p.kind === "stamps");
    expect(stampPages).toHaveLength(Math.ceil(5 / STAMPS_PER_PAGE));
    expect(stampPages.map((p) => (p.kind === "stamps" ? [p.stamps.length, p.sheet, p.sheets] : null))).toEqual([
      [4, 1, 2],
      [1, 2, 2],
    ]);
    expect(stamps.map((s) => s.kind)).toEqual(["landmark", "hieroglyphs", "sunset", "hidden-detail", "memory"]);
  });

  it("gives a memory its own page only when it has a photo or words", () => {
    const a = mem({ challengeId: "giza-scale", photo: jpeg() });
    const b = mem({ challengeId: "aswan-karkade" }); // stamp only
    const c = mem({ challengeId: "luxor-ankh", story: "Found three!" });
    const { pages } = planPassport([a, b, c], { now: NOW });
    expect(pages.filter((p) => p.kind === "memory").map((p) => (p.kind === "memory" ? p.memoryId : ""))).toEqual(expect.arrayContaining([a.id, c.id]));
    expect(pages.filter((p) => p.kind === "memory")).toHaveLength(2);
  });

  it("awards a challenge's points on its first stamp only", () => {
    const first = mem({ challengeId: "luxor-balloon", visitDate: "2026-11-11", caption: "Up before dawn" });
    const again = mem({ challengeId: "luxor-balloon", visitDate: "2026-11-13", photo: jpeg() });
    const { stamps, summary } = planPassport([again, first], { now: NOW });
    expect(stamps.map((s) => s.points)).toEqual([30, 0]);
    expect(summary.points).toBe(30); // the stamps and the points total agree
    expect(stampFor(mem(), true).points).toBe(0); // a memory without a challenge earns none
  });

  it("gives no points for a memory with neither a photo nor words, like the points total", () => {
    const empty = mem({ challengeId: "giza-scale", visitDate: "2026-11-10" });
    const real = mem({ challengeId: "giza-scale", visitDate: "2026-11-11", caption: "Tiny me" });
    const { stamps, summary } = planPassport([empty, real], { now: NOW });
    expect(stamps.map((s) => s.points)).toEqual([0, 10]);
    expect(summary.points).toBe(10);
  });

  it("tilts each stamp a little, the same way every time", () => {
    const m = mem({ challengeId: "giza-scale" });
    const a = stampFor(m, true),
      b = stampFor({ ...m }, true);
    expect(a.rotation).toBe(b.rotation);
    expect(a.jitter).toEqual(b.jitter);
    for (let i = 0; i < 200; i++) {
      const s = stampFor(mem(), false);
      expect(s.rotation).toBeGreaterThanOrEqual(-9);
      expect(s.rotation).toBeLessThanOrEqual(9);
      expect(Math.abs(s.jitter.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.jitter.y)).toBeLessThanOrEqual(1);
    }
    expect(hash("abc")).toBe(hash("abc"));
    expect(hash("abc")).not.toBe(hash("abd"));
  });

  it("summarises the journey on the traveller page", () => {
    const list = [mem({ visitDate: "2026-11-12", destination: "luxor", challengeId: "luxor-ankh", caption: "Three of them" }), mem({ visitDate: "2026-11-10", destination: "giza", challengeId: "giza-scale", photo: jpeg() }), mem({ visitDate: "2026-11-14", destination: "luxor", photo: jpeg() })];
    const { pages, summary } = planPassport(list, { name: "  Maya   Jensen  ", now: NOW });
    expect(summary).toMatchObject({ name: "Maya Jensen", memories: 3, completed: 2, points: 20, places: ["Giza", "Luxor"], from: "2026-11-10", to: "2026-11-14" });
    const holder = pages[1];
    expect(holder.kind === "holder" && holder.photoMemoryId).toBe(list[1].id); // earliest memory with a photo
    expect(planPassport([], { name: "x".repeat(80) }).summary.name).toHaveLength(40);
  });

  it("lists every achievement as an endorsement", () => {
    const e = planPassport([mem({ caption: "hi" })], { now: NOW }).pages.find((p) => p.kind === "endorsements");
    expect(e?.kind === "endorsements" && e.achievements.length).toBe(8);
    expect(e?.kind === "endorsements" && e.achievements.find((a) => a.id === "first-memory")?.earned).toBe(true);
  });
});

describe("printing order (saddle stitch)", () => {
  it("puts every page on exactly one sheet side, outer sheet first", () => {
    for (const total of [4, 8, 12, 16, 40]) {
      const sheets = bookletSheets(total);
      expect(sheets).toHaveLength(total / 4);
      const all = sheets.flatMap((s) => [...s.front, ...s.back]).sort((a, b) => a - b);
      expect(all).toEqual(Array.from({ length: total }, (_, i) => i));
      expect(sheets[0].front).toEqual([total - 1, 0]); // back cover | front cover
      expect(sheets[0].back).toEqual([1, total - 2]);
    }
  });
  it("pairs pages that face each other once folded", () => {
    const total = 12;
    for (const [i, s] of bookletSheets(total).entries()) {
      // the two halves of a side always add up to n - 1 …
      expect(s.front[0] + s.front[1]).toBe(total - 1);
      expect(s.back[0] + s.back[1]).toBe(total - 1);
      // … and each leaf carries consecutive pages on its two faces
      expect(s.back[0]).toBe(s.front[1] + 1);
      expect(s.front[0]).toBe(s.back[1] + 1);
      expect(s.front[1]).toBe(2 * i);
    }
  });
  it("refuses a page count that can't be folded", () => {
    expect(() => bookletSheets(6)).toThrow(/multiple of four/);
    expect(() => bookletSheets(0)).toThrow();
  });
});

describe("the on-screen preview", () => {
  it("shows the cover alone, then facing pages, then the back cover alone", () => {
    expect(spreads(8)).toEqual([[0], [1, 2], [3, 4], [5, 6], [7]]);
    expect(spreads(4)).toEqual([[0], [1, 2], [3]]);
    expect(spreads(12).flat()).toEqual(Array.from({ length: 12 }, (_, i) => i));
    expect(spreads(0)).toEqual([]);
  });
  it("describes each page for screen readers", () => {
    const m = mem({ destination: "aswan", challengeId: "aswan-felucca", caption: "Gold on the water", photo: jpeg() });
    const { pages } = planPassport([m], { name: "Maya", now: NOW });
    const text = pages.map((p) => describePage(p, [m]));
    expect(text[0]).toContain("not a travel document");
    expect(text[1]).toContain("Maya");
    expect(text[1]).toContain("1 memory");
    expect(text[2]).toContain("Aswan, A felucca at sunset");
    expect(text.find((t) => t.startsWith("Memory page"))).toContain("“Gold on the water”, with photo");
    expect(text.find((t) => t.startsWith("Endorsements"))).toContain("First memory");
  });
});

describe("stamp styles and dates", () => {
  it("has an ink and a word for every kind of challenge, plus free memories", () => {
    for (const k of [...HUNT_CATEGORIES, "memory" as const]) {
      expect(STAMP_STYLE[k].ink).toMatch(/^#[0-9a-f]{6}$/);
      expect(STAMP_STYLE[k].verb).toMatch(/^[A-Z]+$/);
    }
    expect(new Set(Object.values(STAMP_STYLE).map((s) => s.ink)).size).toBe(7); // each kind its own colour
  });
  it("prints short dates that fit inside a stamp", () => {
    expect(stampDate("2026-11-10")).toBe("10 NOV 2026");
    expect(stampDate("nope")).toBe("");
  });
  it("prints the journey as a compact date range", () => {
    expect(dateRange("2026-11-10", "2026-11-17")).toBe("10 – 17 Nov 2026");
    expect(dateRange("2026-10-28", "2026-11-03")).toBe("28 Oct – 3 Nov 2026");
    expect(dateRange("2026-12-30", "2027-01-02")).toBe("30 Dec 2026 – 2 Jan 2027");
    expect(dateRange("2026-11-10", "2026-11-10")).toBe("10 Nov 2026");
    expect(dateRange(null, null)).toBe("");
  });
});
