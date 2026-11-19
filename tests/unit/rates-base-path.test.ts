import { describe, expect, it } from "vitest";
import { parseRates } from "@/lib/rates";
import { withBase } from "@/lib/base-path";

describe("exchange rates", () => {
  it("turns the provider's EGP-based rates into pounds per unit", () => {
    const r = parseRates({ result: "success", time_last_update_utc: "Thu, 19 Nov 2026 00:02:31 +0000", rates: { USD: 0.02, EUR: 0.025, GBP: 0 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.toEgp.USD).toBeCloseTo(50);
    expect(r.toEgp.EUR).toBeCloseTo(40);
    expect(r.toEgp.GBP).toBeNull(); // never divide by zero or invent a rate
  });
  it("reports failure instead of guessing", () => {
    expect(parseRates({ result: "error" }).ok).toBe(false);
    expect(parseRates(null).ok).toBe(false);
  });
});

describe("site address prefix", () => {
  it("leaves outside links and anchors alone", () => {
    expect(withBase("https://example.com/x")).toBe("https://example.com/x");
    expect(withBase("//cdn.example.com/x")).toBe("//cdn.example.com/x");
    expect(withBase("#find")).toBe("#find");
    expect(withBase("/media/a.mp4")).toBe(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/media/a.mp4`);
  });
});
