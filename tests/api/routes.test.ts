// @vitest-environment node
/**
 * Integration tests for the API routes in local demo mode: CSRF/origin checks, validation,
 * spam handling, rate limits, admin authorisation and the full moderate-then-publish flow.
 */
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)! } : undefined), getAll: () => [], set: () => {} }),
}));

const tmp = mkdtempSync(path.join(os.tmpdir(), "de-test-"));
vi.spyOn(process, "cwd").mockReturnValue(tmp);
process.env.DEMO_LOCAL_MODE = "true";
process.env.LOCAL_ADMIN_PASSWORD = "local-admin-password-123";
process.env.SESSION_SECRET = "s".repeat(48);
delete process.env.NEXT_PUBLIC_SUPABASE_URL;

let ip = 0;
function req(url: string, body: unknown, opts: { origin?: string | null; type?: string; method?: string } = {}) {
  const headers: Record<string, string> = { host: "localhost:3000", "x-real-ip": `10.0.0.${++ip}` };
  if (opts.origin !== null) headers.origin = opts.origin ?? "http://localhost:3000";
  headers["content-type"] = opts.type ?? "application/json";
  return new NextRequest(`http://localhost:3000${url}`, { method: opts.method ?? "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

const question = { name: "Maya Jensen", email: "maya@example.com", destination: "aswan", question: "Can I visit a Nubian village respectfully?", consent: true };

let questions: typeof import("@/app/api/questions/route");
let login: typeof import("@/app/api/admin/login/route");
let moderate: typeof import("@/app/api/admin/moderate/route");
let events: typeof import("@/app/api/admin/events/route");
let store: typeof import("@/lib/store");
let rl: typeof import("@/lib/rate-limit");

beforeAll(async () => {
  questions = await import("@/app/api/questions/route");
  login = await import("@/app/api/admin/login/route");
  moderate = await import("@/app/api/admin/moderate/route");
  events = await import("@/app/api/admin/events/route");
  store = await import("@/lib/store");
  rl = await import("@/lib/rate-limit");
});
beforeEach(() => rl._resetRateLimits());
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("public submissions", () => {
  it("rejects cross-site requests (CSRF)", async () => {
    expect((await questions.POST(req("/api/questions", question, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await questions.POST(req("/api/questions", question, { origin: null }))).status).toBe(403);
  });
  it("rejects form-encoded bodies", async () => {
    expect((await questions.POST(req("/api/questions", "name=x", { type: "application/x-www-form-urlencoded" }))).status).toBe(415);
  });
  it("returns field errors for invalid input", async () => {
    const r = await questions.POST(req("/api/questions", { ...question, email: "bad" }));
    expect(r.status).toBe(422);
    expect((await r.json()).fields.email).toBeDefined();
  });
  it("pretends to accept bot submissions but stores nothing", async () => {
    const r = await questions.POST(req("/api/questions", { ...question, website: "http://spam" }));
    expect(r.status).toBe(200);
    expect(await store.adminListSubmissions("all")).toHaveLength(0);
  });
  it("stores a real question as pending, not public", async () => {
    expect((await questions.POST(req("/api/questions", question))).status).toBe(201);
    expect(await store.adminListSubmissions("pending")).toHaveLength(1);
    expect(await store.listPublished("question")).toHaveLength(0);
  });
  it("rate-limits repeated submissions from one address", async () => {
    const same = () => {
      const r = req("/api/questions", question);
      r.headers.set("x-real-ip", "10.9.9.9");
      return questions.POST(r);
    };
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await same()).status);
    expect(codes.slice(0, 5).every((c) => c === 201)).toBe(true);
    expect(codes[5]).toBe(429);
  });
});

describe("admin", () => {
  it("refuses admin actions without a session", async () => {
    jar.clear();
    const [s] = await store.adminListSubmissions("pending");
    expect((await moderate.POST(req("/api/admin/moderate", { kind: "question", id: s.id, action: "approve", answer: "Yes" }))).status).toBe(401);
    expect((await events.POST(req("/api/admin/events", {}))).status).toBe(401);
  });
  it("rejects a wrong password", async () => {
    expect((await login.POST(req("/api/admin/login", { password: "guess" }))).status).toBe(401);
  });
  it("logs in, answers and publishes a question", async () => {
    const r = await login.POST(req("/api/admin/login", { password: "local-admin-password-123" }));
    expect(r.status).toBe(200);
    const cookie = r.cookies.get("de_admin");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("strict");
    jar.set("de_admin", cookie!.value);

    const [s] = await store.adminListSubmissions("pending");
    const m = await moderate.POST(req("/api/admin/moderate", { kind: "question", id: s.id, action: "approve", answer: "Yes — ask first and follow your guide." }));
    expect(m.status).toBe(200);
    const pub = await store.listPublished("question");
    expect(pub.length).toBeGreaterThan(0);
    expect(pub[0]).not.toHaveProperty("email");
    expect(pub[0].firstName).toBe("Maya");
  });
  it("creates and deletes an event, and requires a source to mark it verified", async () => {
    const ev = { id: "nile-festival-test", name: "Test festival", where: "Luxor", when: "Spring", dateISO: "2027-03-01", description: "A test event for the suite", status: "verified" };
    expect((await events.POST(req("/api/admin/events", ev))).status).toBe(422);
    expect((await events.POST(req("/api/admin/events", { ...ev, sourceUrl: "https://example.org/festival" }))).status).toBe(200);
    expect((await store.getEvents()).find((e) => e.id === ev.id)?.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((await events.DELETE(req("/api/admin/events", { id: ev.id }, { method: "DELETE" }))).status).toBe(200);
    expect((await store.getEvents()).some((e) => e.id === ev.id)).toBe(false);
  });
});

describe("recipe review gate", () => {
  it("shows drafts only in local demo mode; elsewhere only approved recipes are public", async () => {
    const all = await store.getVisibleRecipes();
    expect(all.length).toBeGreaterThan(0);
    process.env.DEMO_LOCAL_MODE = "false"; // backend "none": behaves like the live site without demo data
    try {
      expect(await store.getVisibleRecipes()).toHaveLength(0);
    } finally {
      process.env.DEMO_LOCAL_MODE = "true";
    }
  });
  it("only admins can approve, and approval is recorded", async () => {
    const recipesRoute = await import("@/app/api/admin/recipes/route");
    jar.clear();
    expect((await recipesRoute.POST(req("/api/admin/recipes", { slug: "koshari", status: "approved" }))).status).toBe(401);
    const r = await login.POST(req("/api/admin/login", { password: "local-admin-password-123" }));
    jar.set("de_admin", r.cookies.get("de_admin")!.value);
    expect((await recipesRoute.POST(req("/api/admin/recipes", { slug: "koshari", status: "approved" }))).status).toBe(200);
    expect((await recipesRoute.POST(req("/api/admin/recipes", { slug: "not-a-recipe", status: "approved" }))).status).toBe(404);
    const k = (await store.getRecipes()).find((x) => x.slug === "koshari")!;
    expect(k.review.status).toBe("approved");
    process.env.DEMO_LOCAL_MODE = "false";
    try {
      // With no backend there are no stored approvals, so nothing is public — fail safe.
      expect(await store.getVisibleRecipes()).toHaveLength(0);
    } finally {
      process.env.DEMO_LOCAL_MODE = "true";
    }
  });
});
