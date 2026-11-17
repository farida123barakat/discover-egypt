// @vitest-environment node
/**
 * Integration tests for Memory Hunt printing in local demo mode: same-origin checks, the hourly
 * limit, consent, JPEG-only uploads, collection codes that reveal nothing personal, cancelling with
 * the one-time token, admin authorisation, and image deletion once a job is closed.
 */
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)! } : undefined), getAll: () => [], set: () => {} }),
}));

const tmp = mkdtempSync(path.join(os.tmpdir(), "de-print-"));
vi.spyOn(process, "cwd").mockReturnValue(tmp);
process.env.DEMO_LOCAL_MODE = "true";
process.env.LOCAL_ADMIN_PASSWORD = "local-admin-password-123";
process.env.SESSION_SECRET = "s".repeat(48);
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
const JOBS = path.join(tmp, ".data", "print-jobs");

let ip = 0;
const nextIp = () => `10.1.0.${++ip}`;
function jsonReq(url: string, body: unknown, opts: { origin?: string | null; method?: string; ip?: string } = {}) {
  const headers: Record<string, string> = { host: "localhost:3000", "x-real-ip": opts.ip ?? nextIp(), "content-type": "application/json" };
  if (opts.origin !== null) headers.origin = opts.origin ?? "http://localhost:3000";
  return new NextRequest(`http://localhost:3000${url}`, { method: opts.method ?? "POST", headers, body: JSON.stringify(body) });
}
function getReq(url: string, ip = nextIp()) {
  return new NextRequest(`http://localhost:3000${url}`, { headers: { host: "localhost:3000", "x-real-ip": ip } });
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
function printReq(fields: { partnerId?: string; consent?: string; file?: Uint8Array<ArrayBuffer> | null; type?: string }, opts: { origin?: string | null; ip?: string } = {}) {
  const fd = new FormData();
  if (fields.partnerId !== undefined) fd.set("partnerId", fields.partnerId);
  if (fields.consent !== undefined) fd.set("consent", fields.consent);
  if (fields.file !== null) fd.set("postcard", new File([fields.file ?? JPEG], "postcard.jpg", { type: fields.type ?? "image/jpeg" }));
  const headers: Record<string, string> = { host: "localhost:3000", "x-real-ip": opts.ip ?? nextIp() };
  if (opts.origin !== null) headers.origin = opts.origin ?? "http://localhost:3000";
  return new NextRequest("http://localhost:3000/api/print/requests", { method: "POST", headers, body: fd });
}
const ctx = (code: string) => ({ params: Promise.resolve({ code }) });

const partnerInput = { name: "Nile View Hotel", kind: "hotel", destination: "aswan", address: "Corniche el-Nil, Aswan", openingHours: "Reception, 24 hours", verificationNote: "", verified: false, verifiedOn: null, active: false };

let login: typeof import("@/app/api/admin/login/route");
let adminPartners: typeof import("@/app/api/admin/print-partners/route");
let adminRequests: typeof import("@/app/api/admin/print-requests/route");
let adminImage: typeof import("@/app/api/admin/print-requests/[id]/route");
let partners: typeof import("@/app/api/print/partners/route");
let requests: typeof import("@/app/api/print/requests/route");
let byCode: typeof import("@/app/api/print/requests/[code]/route");
let printStore: typeof import("@/lib/print-store");
let rl: typeof import("@/lib/rate-limit");
let print: typeof import("@/lib/print");
let store: typeof import("@/lib/store");
let cron: typeof import("@/app/api/cron/print-sweep/route");

beforeAll(async () => {
  login = await import("@/app/api/admin/login/route");
  adminPartners = await import("@/app/api/admin/print-partners/route");
  adminRequests = await import("@/app/api/admin/print-requests/route");
  adminImage = await import("@/app/api/admin/print-requests/[id]/route");
  partners = await import("@/app/api/print/partners/route");
  requests = await import("@/app/api/print/requests/route");
  byCode = await import("@/app/api/print/requests/[code]/route");
  printStore = await import("@/lib/print-store");
  rl = await import("@/lib/rate-limit");
  print = await import("@/lib/print");
  store = await import("@/lib/store");
  cron = await import("@/app/api/cron/print-sweep/route");
});
beforeEach(() => rl._resetRateLimits());
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

async function signIn() {
  const r = await login.POST(jsonReq("/api/admin/login", { password: "local-admin-password-123" }));
  jar.set("de_admin", r.cookies.get("de_admin")!.value);
}
async function livePartnerId() {
  return (await (await partners.GET()).json()).partners[0].id as string;
}

describe("admin: printing partners", () => {
  it("refuses partner and job changes without an admin session (401)", async () => {
    jar.clear();
    expect((await adminPartners.POST(jsonReq("/api/admin/print-partners", partnerInput))).status).toBe(401);
    expect((await adminPartners.DELETE(jsonReq("/api/admin/print-partners", { id: crypto.randomUUID() }, { method: "DELETE" }))).status).toBe(401);
    expect((await adminRequests.POST(jsonReq("/api/admin/print-requests", { id: crypto.randomUUID(), status: "ready" }))).status).toBe(401);
    expect((await adminImage.GET(getReq("/x"), { params: Promise.resolve({ id: crypto.randomUUID() }) })).status).toBe(401);
  });

  it("offers no printing until a partner is verified and active", async () => {
    await signIn();
    expect((await (await partners.GET()).json()).partners).toEqual([]);
    const created = await adminPartners.POST(jsonReq("/api/admin/print-partners", partnerInput));
    expect(created.status).toBe(200);
    const { id } = await created.json();
    expect((await (await partners.GET()).json()).partners).toEqual([]); // draft: hidden

    // verifying needs a date and a note on how it was checked; active needs verified
    const noNote = await adminPartners.POST(jsonReq("/api/admin/print-partners", { ...partnerInput, id, verified: true, verifiedOn: "2026-11-12" }));
    expect(noNote.status).toBe(422);
    expect((await noNote.json()).fields.verificationNote).toBeDefined();
    expect((await adminPartners.POST(jsonReq("/api/admin/print-partners", { ...partnerInput, id, active: true }))).status).toBe(422);

    const ok = await adminPartners.POST(jsonReq("/api/admin/print-partners", { ...partnerInput, id, verified: true, verifiedOn: "2026-11-12", verificationNote: "Signed letter from the front-office manager", active: true }));
    expect(ok.status).toBe(200);
    const list = (await (await partners.GET()).json()).partners;
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Nile View Hotel");
    expect(list[0]).not.toHaveProperty("verificationNote"); // internal note never reaches visitors
  });
});

describe("visitor: asking for a print", () => {
  it("rejects cross-site requests", async () => {
    const id = await livePartnerId();
    expect((await requests.POST(printReq({ partnerId: id, consent: "yes" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await requests.POST(printReq({ partnerId: id, consent: "yes" }, { origin: null }))).status).toBe(403);
  });
  it("needs multipart form data", async () => {
    expect((await requests.POST(jsonReq("/api/print/requests", { partnerId: "x" }))).status).toBe(415);
  });
  it("needs consent and a partner", async () => {
    const id = await livePartnerId();
    const noConsent = await requests.POST(printReq({ partnerId: id }));
    expect(noConsent.status).toBe(422);
    expect((await noConsent.json()).fields.consent).toBeDefined();
    const noPartner = await requests.POST(printReq({ partnerId: "", consent: "yes" }));
    expect(noPartner.status).toBe(422);
    expect((await noPartner.json()).fields.partnerId).toBeDefined();
    expect((await requests.POST(printReq({ partnerId: id, consent: "yes", file: null }))).status).toBe(422);
  });
  it("accepts only real JPEGs, checked by content, not by the file's label", async () => {
    const id = await livePartnerId();
    expect((await requests.POST(printReq({ partnerId: id, consent: "yes", file: PNG, type: "image/jpeg" }))).status).toBe(415);
    expect((await requests.POST(printReq({ partnerId: id, consent: "yes", file: new TextEncoder().encode("<svg onload=alert(1)>"), type: "image/jpeg" }))).status).toBe(415);
  });
  it("refuses a partner that is not live (409)", async () => {
    expect((await requests.POST(printReq({ partnerId: crypto.randomUUID(), consent: "yes" }))).status).toBe(409);
  });
  it("allows five requests per hour from one address", async () => {
    const id = await livePartnerId();
    const same = () => requests.POST(printReq({ partnerId: id, consent: "yes", file: PNG }, { ip: "10.9.9.9" }));
    for (let i = 0; i < 5; i++) expect((await same()).status).toBe(415); // counted even when rejected later
    const r = await same();
    expect(r.status).toBe(429);
    expect(Number(r.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
  it("explains that printing is unavailable when there is no back end (501)", async () => {
    process.env.DEMO_LOCAL_MODE = "false";
    try {
      expect((await requests.POST(printReq({ partnerId: crypto.randomUUID(), consent: "yes" }))).status).toBe(501);
      expect((await (await partners.GET()).json()).partners).toEqual([]); // so the option is hidden
    } finally {
      process.env.DEMO_LOCAL_MODE = "true";
    }
  });
});

describe("collection codes, status and cancelling", () => {
  let code = "";
  let token = "";

  it("returns a random code and a one-time cancel token, and stores the image", async () => {
    const id = await livePartnerId();
    const r = await requests.POST(printReq({ partnerId: id, consent: "yes" }));
    expect(r.status).toBe(201);
    const d = await r.json();
    expect(d.code).toMatch(print.CODE_RE);
    expect(d.cancelToken).toMatch(/^[0-9a-f]{48}$/);
    expect(d.partner).not.toHaveProperty("verificationNote");
    code = d.code;
    token = d.cancelToken;
    expect(readdirSync(JOBS)).toHaveLength(1);
  });

  it("shows only the status and the partner for a code: nothing personal, no token", async () => {
    const r = await byCode.GET(getReq(`/api/print/requests/${code}`), ctx(code));
    expect(r.status).toBe(200);
    const s = await r.json();
    expect(s.status).toBe("requested");
    expect(s.partner.name).toBe("Nile View Hotel");
    expect(Object.keys(s).sort()).toEqual(["code", "createdAt", "expiresAt", "partner", "status"]);
    expect(JSON.stringify(s)).not.toContain(token);
  });

  it("accepts codes typed loosely, and 404s unknown or malformed ones", async () => {
    const loose = code.toLowerCase().replace(/-/g, " ");
    expect((await byCode.GET(getReq("/x"), ctx(loose))).status).toBe(200);
    expect((await byCode.GET(getReq("/x"), ctx("DE-2222-2222"))).status).toBe(404);
    expect((await byCode.GET(getReq("/x"), ctx("../../etc/passwd"))).status).toBe(404);
  });

  it("rate-limits code lookups so codes can't be guessed by brute force", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await byCode.GET(getReq("/x", "10.8.8.8"), ctx("DE-2222-2222"))).status);
    expect(statuses.slice(0, 30).every((s) => s === 404)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("refuses to cancel with the wrong token (403)", async () => {
    expect((await byCode.DELETE(jsonReq(`/api/print/requests/${code}`, { token: "b".repeat(48) }, { method: "DELETE" }), ctx(code))).status).toBe(403);
    expect((await byCode.DELETE(jsonReq(`/api/print/requests/${code}`, { token: "short" }, { method: "DELETE" }), ctx(code))).status).toBe(422);
    expect((await byCode.DELETE(jsonReq(`/api/print/requests/${code}`, { token }, { method: "DELETE", origin: "https://evil.example" }), ctx(code))).status).toBe(403);
  });

  it("cancels with the right token, deletes the image, and then treats the request as closed (409)", async () => {
    expect((await byCode.DELETE(jsonReq(`/api/print/requests/${code}`, { token }, { method: "DELETE" }), ctx(code))).status).toBe(200);
    expect(readdirSync(JOBS)).toHaveLength(0);
    const s = await (await byCode.GET(getReq("/x"), ctx(code))).json();
    expect(s.status).toBe("cancelled");
    expect((await byCode.DELETE(jsonReq(`/api/print/requests/${code}`, { token }, { method: "DELETE" }), ctx(code))).status).toBe(409);
  });
});

describe("admin: the print-job queue", () => {
  it("moves a job through printing, ready and collected, and deletes the image at the end", async () => {
    await signIn();
    const partnerId = await livePartnerId();
    const { code } = await (await requests.POST(printReq({ partnerId, consent: "yes" }))).json();
    const job = (await printStore.adminListPrintRequests()).find((r) => r.code === code)!;

    const img = await adminImage.GET(getReq("/x"), { params: Promise.resolve({ id: job.id }) });
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/jpeg");
    expect(img.headers.get("cache-control")).toContain("no-store");

    // a partner with open jobs can't be deleted: deactivate it instead
    expect((await adminPartners.DELETE(jsonReq("/api/admin/print-partners", { id: partnerId }, { method: "DELETE" }))).status).toBe(409);

    for (const status of ["printing", "ready"] as const) {
      expect((await adminRequests.POST(jsonReq("/api/admin/print-requests", { id: job.id, status }))).status).toBe(200);
      expect((await (await byCode.GET(getReq("/x"), ctx(code))).json()).status).toBe(status);
    }
    expect(existsSync(path.join(JOBS, `${job.id}.jpg`))).toBe(true);
    expect((await adminRequests.POST(jsonReq("/api/admin/print-requests", { id: job.id, status: "collected" }))).status).toBe(200);
    expect(existsSync(path.join(JOBS, `${job.id}.jpg`))).toBe(false);
    expect((await adminImage.GET(getReq("/x"), { params: Promise.resolve({ id: job.id }) })).status).toBe(404);

    expect((await adminRequests.POST(jsonReq("/api/admin/print-requests", { id: crypto.randomUUID(), status: "ready" }))).status).toBe(404);
    expect((await adminRequests.POST(jsonReq("/api/admin/print-requests", { id: job.id, status: "lost" }))).status).toBe(422);
  });

  it("deletes the image of a job that expired uncollected, and the daily job needs its secret", async () => {
    const partnerId = await livePartnerId();
    const { code } = await (await requests.POST(printReq({ partnerId, consent: "yes" }))).json();
    const job = (await printStore.adminListPrintRequests()).find((r) => r.code === code)!;
    expect(existsSync(path.join(JOBS, `${job.id}.jpg`))).toBe(true);
    await store.writeLocal((db) => {
      db.printRequests!.find((r) => r.id === job.id)!.expiresAt = "2026-01-01T00:00:00.000Z";
    });

    const cronReq = (auth?: string) => new NextRequest("http://localhost:3000/api/cron/print-sweep", { headers: auth ? { authorization: auth } : {} });
    delete process.env.CRON_SECRET;
    expect((await cron.GET(cronReq("Bearer "))).status).toBe(401); // refused when no secret is configured
    process.env.CRON_SECRET = "cron-secret-for-tests-123";
    expect((await cron.GET(cronReq())).status).toBe(401);
    expect((await cron.GET(cronReq("Bearer wrong-secret-for-tests"))).status).toBe(401);
    const r = await cron.GET(cronReq("Bearer cron-secret-for-tests-123"));
    expect(r.status).toBe(200);
    expect((await r.json()).swept).toBe(1);

    expect(existsSync(path.join(JOBS, `${job.id}.jpg`))).toBe(false);
    expect((await store.readLocal()).printRequests!.find((r) => r.id === job.id)!.status).toBe("expired");
    expect((await (await byCode.GET(getReq("/x"), ctx(code))).json()).status).toBe("expired");
    expect(await printStore.sweepPrintJobs()).toBe(0); // nothing left to do
  });

  it("deletes a partner once all its jobs are closed", async () => {
    const partnerId = await livePartnerId();
    expect((await adminPartners.DELETE(jsonReq("/api/admin/print-partners", { id: partnerId }, { method: "DELETE" }))).status).toBe(200);
    expect((await (await partners.GET()).json()).partners).toEqual([]);
    expect((await adminPartners.DELETE(jsonReq("/api/admin/print-partners", { id: partnerId }, { method: "DELETE" }))).status).toBe(404);
  });
});
