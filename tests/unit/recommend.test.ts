import { describe, expect, it } from "vitest";
import { recommend, type Preferences } from "@/lib/recommend";

const base: Preferences = { interests: [], environment: "any", budgetLevel: 3, days: 7, month: null, pace: "balanced" };
const slugs = (p: Preferences) => recommend(p, undefined, 4).map((r) => r.destination.slug);

describe("Find Your Egypt recommendations", () => {
  it("suggests Red Sea dive sites to divers", () => {
    const top = slugs({ ...base, interests: ["diving"], environment: "sea" });
    expect(top).toEqual(expect.arrayContaining(["dahab"]));
    expect(top.some((s) => ["sharm-el-sheikh", "marsa-alam", "hurghada"].includes(s))).toBe(true);
  });

  it("suggests ancient sites to history lovers", () => {
    const top = slugs({ ...base, interests: ["history"] });
    expect(top).toEqual(expect.arrayContaining(["luxor"]));
  });

  it("suggests oases for people seeking calm", () => {
    const top = slugs({ ...base, interests: ["relaxation"], environment: "oasis", pace: "slow" });
    expect(top[0]).toMatch(/siwa|fayoum/);
  });

  it("explains every recommendation", () => {
    for (const r of recommend({ ...base, interests: ["food", "culture"], month: 11 })) expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("is deterministic and sorted by score", () => {
    const p: Preferences = { ...base, interests: ["photography", "architecture"] };
    const a = recommend(p);
    expect(recommend(p)).toEqual(a);
    for (let i = 1; i < a.length; i++) expect(a[i - 1].score).toBeGreaterThanOrEqual(a[i].score);
  });

  it("penalises places above the visitor's budget", () => {
    const rich = recommend({ ...base, interests: ["relaxation"], budgetLevel: 4 }, undefined, 50);
    const poor = recommend({ ...base, interests: ["relaxation"], budgetLevel: 1 }, undefined, 50);
    const total = (r: typeof rich) => r.reduce((s, x) => s + x.score, 0);
    expect(total(poor)).toBeLessThanOrEqual(total(rich));
  });
});
