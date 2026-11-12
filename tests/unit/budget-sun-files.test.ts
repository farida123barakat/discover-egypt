import { describe, expect, it } from "vitest";
import { convert, dailyTotal, PRESETS, styleLevel, tripTotal } from "@/lib/budget";
import { cairoTime, goldenHours, sunTimes } from "@/lib/sun";
import { detectImageType } from "@/lib/files";

describe("budget calculator", () => {
  it("adds the daily categories", () => {
    expect(dailyTotal(PRESETS.backpacker)).toBe(48);
  });
  it("ignores negative or invalid amounts", () => {
    expect(dailyTotal({ accommodation: -50, food: Number.NaN, transport: 10, activities: 0, shopping: 0 })).toBe(10);
  });
  it("multiplies by days and travellers, with a minimum of one", () => {
    expect(tripTotal(PRESETS.budget, 5, 2)).toBe(dailyTotal(PRESETS.budget) * 10);
    expect(tripTotal(PRESETS.budget, 0, 0)).toBe(dailyTotal(PRESETS.budget));
  });
  it("never invents a conversion when there is no rate", () => {
    expect(convert(100, null)).toBeNull();
    expect(convert(100, 0)).toBeNull();
    expect(convert(100, 50)).toBe(5000);
  });
  it("maps styles to levels", () => {
    expect(styleLevel("backpacker")).toBe(1);
    expect(styleLevel("luxury")).toBe(4);
  });
});

describe("golden hour finder", () => {
  // Cairo, 21 June 2026: solar noon ≈ 09:57 UTC, ~14 h of daylight → sunrise ≈ 02:55 UTC (05:55 Cairo summer time), sunset ≈ 16:59 UTC.
  const cairo = sunTimes(new Date(Date.UTC(2026, 5, 21)), 30.0444, 31.2357);
  it("computes sunrise and sunset within a few minutes", () => {
    const mins = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();
    expect(Math.abs(mins(cairo.sunrise) - (2 * 60 + 55))).toBeLessThanOrEqual(5);
    expect(Math.abs(mins(cairo.sunset) - (16 * 60 + 59))).toBeLessThanOrEqual(5);
  });
  it("returns sunrise before sunset on the same day", () => {
    expect(cairo.sunrise < cairo.noon && cairo.noon < cairo.sunset).toBe(true);
    expect(cairo.sunrise.getUTCDate()).toBe(21);
  });
  it("puts golden hour inside daylight", () => {
    const g = goldenHours(new Date(Date.UTC(2026, 0, 15)), 25.6872, 32.6396);
    expect(g.morning[0].getTime()).toBe(g.sunrise.getTime());
    expect(g.evening[1].getTime()).toBe(g.sunset.getTime());
    expect(g.morning[1] < g.evening[0]).toBe(true);
  });
  it("formats in Cairo time", () => {
    expect(cairoTime(new Date(Date.UTC(2026, 0, 1, 10, 0)))).toBe("12:00");
  });
});

describe("upload type detection", () => {
  it("accepts JPEG, PNG and WebP by magic bytes", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))?.ext).toBe("webp");
  });
  it("rejects SVG, HTML and files that only pretend by name", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<!doctype html>"))).toBeNull();
    expect(detectImageType(new Uint8Array([0x4d, 0x5a]))).toBeNull();
  });
});
