import { describe, expect, it } from "vitest";
import { badgesFor, bucketSeed, monthRanges } from "@/content/bucket";
import { destinations } from "@/content/destinations";
import { photos } from "@/content/images";
import { bucketProgressSchema, bucketSchema } from "@/lib/validation";

const pub = bucketSeed.filter((a) => a.published);

describe("bucket-list seed data", () => {
  it("has unique ids, real destinations or a place, and real photos", () => {
    expect(new Set(bucketSeed.map((a) => a.id)).size).toBe(bucketSeed.length);
    for (const a of bucketSeed) {
      if (a.destination) expect(destinations.some((d) => d.slug === a.destination), a.id).toBe(true);
      else expect(a.place, a.id).toBeTruthy();
      if (a.photo) expect(a.photo in photos, a.id).toBe(true);
      expect(a.season?.verified ?? false).toBe(false); // nothing is claimed as verified without a source
    }
  });
  it("every seed entry passes the admin validation schema", () => {
    for (const a of bucketSeed) {
      const { createdAt: _c, lastReviewed: _l, ...input } = a;
      void _c;
      void _l;
      const r = bucketSchema.safeParse(input);
      expect(r.success, `${a.id}: ${JSON.stringify(r.error?.issues?.[0])}`).toBe(true);
    }
  });
});

describe("validation", () => {
  const ok = { id: "test-activity", title: "Try something new", description: "A description that is long enough.", destination: "luxor", categories: ["history"], effort: "easy", duration: "1 hour", bestMonths: [], tips: [], photo: null, published: true, featured: false };
  it("needs a destination or a place", () => {
    expect(bucketSchema.safeParse({ ...ok, destination: null }).success).toBe(false);
    expect(bucketSchema.safeParse({ ...ok, destination: null, place: "Mount Sinai" }).success).toBe(true);
  });
  it("refuses a 'verified' season without a source, and non-https sources", () => {
    expect(bucketSchema.safeParse({ ...ok, season: { note: "Only in spring", verified: true } }).success).toBe(false);
    expect(bucketSchema.safeParse({ ...ok, season: { note: "Only in spring", verified: true, source: { name: "Official site", url: "http://x.org" } } }).success).toBe(false);
    expect(bucketSchema.safeParse({ ...ok, season: { note: "Only in spring", verified: true, source: { name: "Official site", url: "https://x.org" } } }).success).toBe(true);
  });
  it("only allows links inside the site", () => {
    expect(bucketSchema.safeParse({ ...ok, link: { href: "https://evil.example", label: "Go" } }).success).toBe(false);
    expect(bucketSchema.safeParse({ ...ok, link: { href: "javascript:alert(1)", label: "Go" } }).success).toBe(false);
    expect(bucketSchema.safeParse({ ...ok, link: { href: "/taste", label: "Go" } }).success).toBe(true);
  });
  it("checks personal progress payloads", () => {
    expect(bucketProgressSchema.safeParse({ "felucca-aswan": { added: true, done: true, fav: false } }).success).toBe(true);
    expect(bucketProgressSchema.safeParse({ "../../etc": { added: true, done: true, fav: false } }).success).toBe(false);
  });
});

describe("achievements", () => {
  it("awards milestones and category badges from completed activities", () => {
    expect(badgesFor([], pub).filter((b) => b.earned)).toHaveLength(0);
    const one = badgesFor([pub[0].id], pub);
    expect(one.find((b) => b.id === "first")?.earned).toBe(true);
    const all = badgesFor(pub.map((a) => a.id), pub);
    expect(all.every((b) => b.earned)).toBe(true);
    const half = badgesFor(pub.slice(0, Math.ceil(pub.length / 2)).map((a) => a.id), pub);
    expect(half.find((b) => b.id === "half")?.earned).toBe(true);
  });
  it("ignores unknown or unpublished ids", () => {
    const hidden = [{ ...pub[0], id: "hidden-one", published: false }];
    expect(badgesFor(["nope", "hidden-one"], [...pub, ...hidden]).find((b) => b.id === "first")?.earned).toBe(false);
  });
  it("formats seasons as month ranges", () => {
    expect(monthRanges([10, 11, 12, 1, 2, 3, 4])).toBe("Oct–Apr");
    expect(monthRanges([4, 5, 6, 9, 10, 11])).toBe("Apr–Jun, Sep–Nov");
    expect(monthRanges([2, 10])).toBe("Feb, Oct");
  });
});
