// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { glyph, nameToSigns, signByCode, signs } from "@/content/hieroglyphs";
import { extract, judge, rank, type Ref } from "@/lib/glyph-recognition";
import { negatives, references, sample } from "../../scripts/eval-glyphs";

describe("sign knowledge base", () => {
  it("has unique Gardiner codes and real Egyptian Hieroglyph code points", () => {
    expect(new Set(signs.map((s) => s.gardiner)).size).toBe(signs.length);
    for (const s of signs) {
      const cp = parseInt(s.cp, 16);
      expect(cp).toBeGreaterThanOrEqual(0x13000);
      expect(cp).toBeLessThanOrEqual(0x1342f);
      expect(glyph(s).codePointAt(0)).toBe(cp);
    }
  });
  it("every example only uses signs that are in the library", () => {
    for (const s of signs) for (const c of s.example?.signs ?? []) expect(signByCode(c), `${s.gardiner} → ${c}`).toBeDefined();
  });
  it("covers the full set of 25 uniliteral sound signs", () => {
    expect(signs.filter((s) => s.kind === "uniliteral")).toHaveLength(25);
  });
  it("writes names with the modern fun mapping, handling sh / kh / ch", () => {
    expect(nameToSigns("Sham").map((s) => s.gardiner)).toEqual(["N37", "G1", "G17"]);
    expect(nameToSigns("Farida").map((s) => s.gardiner)).toEqual(["I9", "G1", "D21", "M17", "D46", "G1"]);
    expect(nameToSigns("123 !")).toEqual([]);
  });
});

describe("experimental recogniser (synthetic benchmark)", () => {
  let refs: Ref[];
  beforeAll(() => {
    refs = references();
  });

  it("identifies distorted renderings of each sign", () => {
    let ok = 0, confident = 0, confidentWrong = 0;
    for (let rep = 0; rep < 2; rep++)
      for (const s of signs) {
        const e = extract(sample(glyph(s)))!;
        const m = rank(e.f, refs);
        if (m[0].code === s.gardiner) ok++;
        if (judge(m).status === "recognised") {
          confident++;
          if (m[0].code !== s.gardiner) confidentWrong++;
        }
      }
    const n = signs.length * 2;
    expect(ok / n).toBeGreaterThan(0.93);
    expect(confidentWrong / Math.max(1, confident)).toBeLessThan(0.03);
  });

  it("does not claim a confident match for letters, digits or random shapes", () => {
    const wrong = negatives(40).filter((px) => {
      const e = extract(px);
      return e && judge(rank(e.f, refs)).status === "recognised";
    });
    expect(wrong.length).toBeLessThanOrEqual(1);
  });

  it("reports an empty image as empty instead of guessing", () => {
    const blank = { data: new Uint8ClampedArray(64 * 64 * 4).fill(255), width: 64, height: 64 };
    expect(extract(blank)).toBeNull();
  });
});
