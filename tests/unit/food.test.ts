import { describe, expect, it } from "vitest";
import { destinations } from "@/content/destinations";
import { recipes, regionalDishes, regionOfDestination, regions, scaleQty } from "@/content/food";
import { haversineKm, nearestRegion } from "@/lib/geo";

describe("regions and location", () => {
  it("every destination belongs to exactly one food region", () => {
    for (const d of destinations) expect(regions.filter((r) => r.destinations.includes(d.slug)), d.slug).toHaveLength(1);
  });
  it("finds the region near a position, and nothing far from Egypt", () => {
    expect(nearestRegion(25.69, 32.64)?.region).toBe("upper-egypt"); // Luxor
    expect(nearestRegion(24.09, 32.9)?.region).toBe("nubia"); // Aswan
    expect(nearestRegion(31.2, 29.92)?.region).toBe("alexandria");
    expect(nearestRegion(28.5, 34.5)?.region).toBe("sinai-red-sea"); // Dahab area
    expect(nearestRegion(52.52, 13.4)).toBeNull(); // Berlin
  });
  it("measures distances sensibly", () => {
    expect(Math.round(haversineKm({ lat: 30.0444, lng: 31.2357 }, { lat: 31.2001, lng: 29.9187 }))).toBeGreaterThan(170);
    expect(Math.round(haversineKm({ lat: 30.0444, lng: 31.2357 }, { lat: 31.2001, lng: 29.9187 }))).toBeLessThan(190);
  });
  it("maps destinations to regions", () => {
    expect(regionOfDestination("siwa")?.id).toBe("western-desert");
  });
});

describe("serving scaler", () => {
  it("rounds grams and millilitres sensibly", () => {
    expect(scaleQty(200, 1.5, "g")).toBe("300");
    expect(scaleQty(80, 0.5, "ml")).toBe("40");
    expect(scaleQty(333, 1, "g")).toBe("335");
  });
  it("uses kitchen fractions for spoons and counts", () => {
    expect(scaleQty(1, 0.5, "tsp")).toBe("½");
    expect(scaleQty(0.5, 1.5, "tsp")).toBe("¾");
    expect(scaleQty(3, 0.5)).toBe("1½");
    expect(scaleQty(2, 1)).toBe("2");
    expect(scaleQty(null, 2)).toBe("");
  });
});

describe("dataset integrity and provenance", () => {
  it("every dish that names a recipe has one, and slugs are unique", () => {
    for (const d of regionalDishes) if (d.recipe) expect(recipes.find((r) => r.slug === d.recipe), d.slug).toBeDefined();
    expect(new Set(recipes.map((r) => r.slug)).size).toBe(recipes.length);
    expect(new Set(regionalDishes.map((r) => r.slug)).size).toBe(regionalDishes.length);
  });
  it("a 'sourced' regional association always has https sources; editorial ones claim none", () => {
    for (const d of regionalDishes) {
      if (d.association.status === "sourced") {
        expect(d.association.sources.length, d.slug).toBeGreaterThan(0);
        for (const s of d.association.sources) expect(s.url).toMatch(/^https:\/\//);
      } else expect(d.association.sources).toHaveLength(0);
    }
  });
  it("every recipe records provenance and a review status, and AI drafts are never 'approved' in the seed", () => {
    for (const r of recipes) {
      expect(r.provenance.kind).toBe("ai-assisted-draft");
      expect(r.review.status).toBe("draft");
      expect(r.review.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.regions.length).toBeGreaterThan(0);
    }
  });
  it("allergen tags match obvious ingredients", () => {
    for (const r of recipes) {
      const text = r.ingredients.flatMap((g) => g.items.map((i) => `${i.item} ${i.note ?? ""}`)).join(" ").toLowerCase();
      if (/flour|semolina|pasta|bread|rolls|flatbread/.test(text)) expect(r.allergens, r.slug).toContain("gluten");
      if (/sesame/.test(text)) expect(r.allergens, r.slug).toContain("sesame");
      if (/fish/.test(text) && r.diet === "fish") expect(r.allergens, r.slug).toContain("fish");
      if (/almond|nut/.test(text)) expect(r.allergens, r.slug).toContain("nuts");
      if (/butter|ghee|yoghurt|milk|cheese/.test(text)) expect(r.allergens, r.slug).toContain("milk");
    }
  });
});
