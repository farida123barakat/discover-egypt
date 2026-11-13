import { beforeAll, describe, expect, it } from "vitest";
import { clean, contactSchema, eventSchema, featuredSchema, fieldErrors, itinerarySchema, questionSchema } from "@/lib/validation";
import { rateLimit, _resetRateLimits } from "@/lib/rate-limit";

const okQuestion = { name: "Lina", email: "LINA@Example.com ", destination: "cairo", question: "Is the metro easy for visitors?", consent: true };

describe("form validation", () => {
  it("accepts a good question and normalises the email", () => {
    const r = questionSchema.safeParse(okQuestion);
    expect(r.success && r.data.email).toBe("lina@example.com");
  });
  it("gives helpful, field-level error messages", () => {
    const r = questionSchema.safeParse({ ...okQuestion, question: "hi", email: "nope", consent: false });
    expect(r.success).toBe(false);
    const f = fieldErrors(r.error!);
    expect(f.question).toMatch(/at least 10/);
    expect(f.email).toMatch(/valid email/);
    expect(f.consent).toMatch(/privacy/);
  });
  it("flags the honeypot field", () => {
    const r = contactSchema.safeParse({ name: "Bot", email: "b@x.io", topic: "other", message: "Buy cheap things now", consent: true, website: "spam.example" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).website).toBeDefined();
  });
  it("rejects unknown destinations", () => {
    expect(questionSchema.safeParse({ ...okQuestion, destination: "atlantis" }).success).toBe(false);
  });
  it("strips control characters and squashes spaces", () => {
    expect(clean("  a\u0000b   c\t ")).toBe("ab c");
  });
  it("keeps itineraries within limits", () => {
    const day = { destination: "luxor", activities: [] };
    const it = { title: "Trip", startDate: null, style: "budget", travellers: 2, interests: [], days: [day] };
    expect(itinerarySchema.safeParse(it).success).toBe(true);
    expect(itinerarySchema.safeParse({ ...it, days: [] }).success).toBe(false);
    expect(itinerarySchema.safeParse({ ...it, days: Array(31).fill(day) }).success).toBe(false);
  });
  it("only accepts https source links for events", () => {
    const e = { id: "test-event", name: "Test", where: "Cairo", when: "Soon", dateISO: null, description: "A test event here", status: "estimate" };
    expect(eventSchema.safeParse({ ...e, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...e, sourceUrl: "http://example.com" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...e, sourceUrl: "https://example.com" }).success).toBe(true);
  });
  it("needs five different featured destinations", () => {
    expect(featuredSchema.safeParse({ slugs: ["cairo", "luxor", "aswan", "dahab", "siwa"] }).success).toBe(true);
    expect(featuredSchema.safeParse({ slugs: ["cairo", "cairo", "aswan", "dahab", "siwa"] }).success).toBe(false);
    expect(featuredSchema.safeParse({ slugs: ["cairo", "luxor", "aswan", "dahab"] }).success).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and resets after the window", () => {
    _resetRateLimits();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(1);
    expect(rateLimit("k", 3, 1000, t + 1001).ok).toBe(true);
  });
});

describe("local admin session tokens", () => {
  let auth: typeof import("@/lib/auth");
  beforeAll(async () => {
    process.env.SESSION_SECRET = "x".repeat(40);
    process.env.LOCAL_ADMIN_PASSWORD = "correct-horse-battery";
    auth = await import("@/lib/auth");
  });
  it("checks the password in constant time", () => {
    expect(auth.checkLocalAdminPassword("correct-horse-battery")).toBe(true);
    expect(auth.checkLocalAdminPassword("wrong")).toBe(false);
  });
  it("accepts a fresh token and rejects tampered or expired ones", () => {
    const now = Date.now();
    const t = auth.createLocalAdminToken(now);
    expect(auth.verifyLocalAdminToken(t, now)).toBe(true);
    expect(auth.verifyLocalAdminToken(t.replace(/.$/, (c) => (c === "A" ? "B" : "A")), now)).toBe(false);
    const [exp, sig] = t.split(".");
    expect(auth.verifyLocalAdminToken(`${Number(exp) + 999999}.${sig}`, now)).toBe(false);
    expect(auth.verifyLocalAdminToken(t, now + 9 * 3600_000)).toBe(false);
    expect(auth.verifyLocalAdminToken(undefined)).toBe(false);
  });
});
