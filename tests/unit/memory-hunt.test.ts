import { afterEach, describe, expect, it, vi } from "vitest";
import { challenges, DIFFICULTY_POINTS, HUNT_CATEGORIES, huntStats, challengeById } from "@/content/hunt";
import { destinations } from "@/content/destinations";
import { photos } from "@/content/images";
import { completedChallenges, PHOTO_MAX_EDGE, PhotoError, processPhoto, TEMPLATES, type Memory } from "@/lib/memories";
import { formatVisitDate, TEMPLATE_INFO, wrapText, CARD, TRIM_MM, BLEED_MM, MM } from "@/lib/postcard";
import { CODE_ALPHABET, CODE_RE, effectiveStatus, isLive, newCancelToken, newCollectionCode, normaliseCode, statusUrl, toPublic, type PrintPartner } from "@/lib/print";
import { addTicket, parseTickets, removeTicket, type PrintTicket } from "@/lib/print-tickets";
import { printPartnerSchema } from "@/lib/validation";

const mem = (over: Partial<Memory> = {}): Memory => ({
  id: crypto.randomUUID(),
  challengeId: null,
  destination: null,
  visitDate: null,
  caption: "",
  story: "",
  template: "golden-hour",
  arabic: false,
  photo: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

describe("challenge content", () => {
  it("has unique ids, real destinations, real photos and internal links", () => {
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
    for (const c of challenges) {
      expect(c.id, c.id).toMatch(/^[a-z0-9-]{2,60}$/); // matches the memories.challenge_id check in the migration
      expect(destinations.some((d) => d.slug === c.destination), c.id).toBe(true);
      expect(c.photo in photos, c.id).toBe(true);
      expect(c.audiences.length, c.id).toBeGreaterThan(0);
      if (c.link) expect(c.link.href, c.id).toMatch(/^\/[a-z]/);
    }
  });
  it("covers every category, so the 'Curious mind' achievement can be earned", () => {
    for (const cat of HUNT_CATEGORIES) expect(challenges.some((c) => c.category === cat), cat).toBe(true);
  });
  it("looks challenges up by id and ignores empty or unknown ids", () => {
    expect(challengeById("giza-scale")?.destination).toBe("giza");
    expect(challengeById(null)).toBeUndefined();
    expect(challengeById("nope")).toBeUndefined();
  });
});

describe("points and achievements", () => {
  it("starts at zero with nothing earned", () => {
    const s = huntStats([], 0);
    expect(s.points).toBe(0);
    expect(s.completed).toBe(0);
    expect(s.total).toBe(challenges.length);
    expect(s.achievements.filter((a) => a.earned)).toHaveLength(0);
    expect(s.maxPoints).toBe(challenges.reduce((n, c) => n + DIFFICULTY_POINTS[c.difficulty], 0));
  });
  it("adds points by difficulty and ignores unknown ids", () => {
    const s = huntStats(["giza-scale", "giza-panorama", "luxor-balloon", "made-up"], 3);
    expect(s.points).toBe(10 + 20 + 30);
    expect(s.completed).toBe(3);
    expect(s.places).toBe(2);
  });
  it("earns 'First memory' from a memory even without a challenge", () => {
    const a = huntStats([], 1).achievements.find((x) => x.id === "first-memory")!;
    expect(a.earned).toBe(true);
    expect(a.progress).toEqual([1, 1]);
  });
  it("earns 'Treasure hunter' at five and 'On the road' at three places", () => {
    const ids = ["giza-scale", "giza-panorama", "luxor-ankh", "aswan-karkade", "aswan-felucca"];
    const s = huntStats(ids, 5);
    expect(s.achievements.find((a) => a.id === "five-challenges")!.earned).toBe(true);
    expect(s.achievements.find((a) => a.id === "three-places")!.earned).toBe(true);
    expect(huntStats(ids.slice(0, 4), 4).achievements.find((a) => a.id === "five-challenges")!.progress).toEqual([4, 5]);
  });
  it("earns category achievements only when every challenge of that kind is done", () => {
    const food = challenges.filter((c) => c.category === "food").map((c) => c.id);
    expect(huntStats(food.slice(1), 1).achievements.find((a) => a.id === "food")!.earned).toBe(false);
    expect(huntStats(food, 1).achievements.find((a) => a.id === "food")!.earned).toBe(true);
  });
  it("earns 'Curious mind' with one of each kind, and everything with all challenges", () => {
    const oneEach = HUNT_CATEGORIES.map((cat) => challenges.find((c) => c.category === cat)!.id);
    expect(huntStats(oneEach, 1).achievements.find((a) => a.id === "all-kinds")!.earned).toBe(true);
    const all = huntStats(challenges.map((c) => c.id), challenges.length);
    expect(all.achievements.every((a) => a.earned)).toBe(true);
    expect(all.points).toBe(all.maxPoints);
  });
  it("counts a challenge once it has a memory with a photo or words, and only once", () => {
    const done = completedChallenges([
      mem({ challengeId: "giza-scale", caption: "Tiny me" }),
      mem({ challengeId: "giza-scale", story: "Again" }),
      mem({ challengeId: "luxor-ankh", photo: new Blob(["x"], { type: "image/jpeg" }) }),
      mem({ challengeId: "aswan-karkade", caption: "   ", story: "" }), // empty: not done
      mem({ challengeId: null, caption: "No challenge" }),
    ]);
    expect(done.sort()).toEqual(["giza-scale", "luxor-ankh"]);
  });
});

describe("postcard templates and text", () => {
  it("has a name and mood for every template", () => {
    for (const t of TEMPLATES) expect(TEMPLATE_INFO[t].name.length).toBeGreaterThan(2);
  });
  it("prints at A6 with a 3 mm bleed at about 305 dpi", () => {
    expect(TRIM_MM).toEqual({ w: 148, h: 105 });
    expect(BLEED_MM).toBe(3);
    expect(CARD).toEqual({ w: 154 * MM, h: 111 * MM });
    expect(Math.round(MM * 25.4)).toBe(305);
  });
  const len = (s: string) => s.length;
  it("wraps words onto lines that fit", () => {
    expect(wrapText(len, "the first light on the river", 12, 5)).toEqual(["the first", "light on the", "river"]);
  });
  it("adds an ellipsis when the text runs out of lines", () => {
    const lines = wrapText(len, "one two three four five six seven", 9, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    expect(lines.every((l) => l.length <= 9)).toBe(true);
  });
  it("hard-breaks a word longer than the line", () => {
    const lines = wrapText(len, "supercalifragilistic", 8, 5);
    expect(lines.every((l) => l.length <= 8)).toBe(true);
    expect(lines.join("").replace(/-/g, "")).toBe("supercalifragilistic");
  });
  it("formats visit dates and ignores missing or invalid ones", () => {
    expect(formatVisitDate("2026-03-15")).toBe("15 March 2026");
    expect(formatVisitDate(null)).toBe("");
    expect(formatVisitDate("not-a-date")).toBe("");
  });
});

describe("photo processing removes metadata (EXIF / GPS)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubCanvas(out: Blob | null) {
    const drawImage = vi.fn();
    const created: HTMLCanvasElement[] = [];
    const real = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = real(tag);
      if (tag === "canvas") {
        (el as HTMLCanvasElement).getContext = (() => ({ drawImage })) as unknown as HTMLCanvasElement["getContext"];
        (el as HTMLCanvasElement).toBlob = (cb: BlobCallback, type?: string) => cb(out && new Blob([out], { type: type ?? "image/png" }));
        created.push(el as HTMLCanvasElement);
      }
      return el;
    });
    return { drawImage, created };
  }

  // A JPEG header followed by an APP1 "Exif" block, as a phone camera writes it (GPS lives in there).
  const exifJpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, ...new TextEncoder().encode("Exif\0\0GPS:30.0,31.2")])], "IMG_0001.jpg", { type: "image/jpeg" });

  it("re-encodes through a canvas: the output is a new JPEG, never the original bytes", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 4000, height: 3000, close })));
    const { drawImage, created } = stubCanvas(new Blob(["re-encoded pixels only"]));
    const file = exifJpeg();
    const out = await processPhoto(file);
    expect(out).not.toBe(file);
    expect(out.type).toBe("image/jpeg");
    const text = await out.text();
    expect(text).not.toContain("Exif");
    expect(text).not.toContain("GPS");
    // shrunk so the longest edge is PHOTO_MAX_EDGE, keeping the aspect ratio
    expect(created[0].width).toBe(PHOTO_MAX_EDGE);
    expect(created[0].height).toBe(1350);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalled();
    // createImageBitmap is asked to apply the camera's rotation before the metadata is dropped
    expect((createImageBitmap as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({ imageOrientation: "from-image" });
  });
  it("does not enlarge small photos", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })));
    const { created } = stubCanvas(new Blob(["x"]));
    await processPhoto(exifJpeg());
    expect([created[0].width, created[0].height]).toEqual([800, 600]);
  });
  it("rejects files that are not photos, too large, or unreadable", async () => {
    await expect(processPhoto(new File(["<svg/>"], "x.svg", { type: "text/html" }))).rejects.toBeInstanceOf(PhotoError);
    const big = new File([new Uint8Array(1)], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(big, "size", { value: 16 * 1024 * 1024 });
    await expect(processPhoto(big)).rejects.toThrow(/15 MB/);
    vi.stubGlobal("createImageBitmap", vi.fn(async () => Promise.reject(new Error("decode"))));
    await expect(processPhoto(exifJpeg())).rejects.toThrow(/couldn't read/);
  });
});

describe("collection codes", () => {
  it("are DE-XXXX-XXXX from an alphabet without look-alike characters", () => {
    expect(CODE_ALPHABET).not.toMatch(/[01OIL]/);
    for (let i = 0; i < 500; i++) expect(newCollectionCode()).toMatch(CODE_RE);
  });
  it("do not repeat in practice (about 40 bits of randomness)", () => {
    const codes = new Set(Array.from({ length: 5000 }, newCollectionCode));
    expect(codes.size).toBe(5000);
    expect(Math.log2(CODE_ALPHABET.length ** 8)).toBeGreaterThan(39);
  });
  it("use every character of the alphabet (no modulo bias toward a few)", () => {
    const seen = new Set(Array.from({ length: 2000 }, newCollectionCode).join("").replace(/DE|-/g, ""));
    expect(seen.size).toBe(CODE_ALPHABET.length);
  });
  it("normalise what people type", () => {
    expect(normaliseCode("de-7k3m-q9tx")).toBe("DE-7K3M-Q9TX");
    expect(normaliseCode(" DE 7K3M Q9TX ")).toBe("DE-7K3M-Q9TX");
    expect(normaliseCode("7k3mq9tx")).toBe("DE-7K3M-Q9TX");
    expect(CODE_RE.test(normaliseCode("DE-0000-0000"))).toBe(false); // 0 is not in the alphabet
  });
  it("cancel tokens are 48 hex characters and unique", () => {
    const a = newCancelToken();
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(newCancelToken()).not.toBe(a);
  });
  it("status links carry only the code", () => {
    expect(statusUrl("https://example.org/", "DE-7K3M-Q9TX")).toBe("https://example.org/memory-hunt/print/DE-7K3M-Q9TX");
  });
});

describe("printing partners and requests", () => {
  const partner: PrintPartner = { id: crypto.randomUUID(), name: "Nile View Hotel", kind: "hotel", destination: "aswan", address: "Corniche el-Nil, Aswan", openingHours: "Reception, 24 hours", verificationNote: "Signed letter from the manager, 12 Nov", verified: true, verifiedOn: "2026-11-12", active: true };
  it("is live only when verified, dated and active", () => {
    expect(isLive(partner)).toBe(true);
    expect(isLive({ ...partner, active: false })).toBe(false);
    expect(isLive({ ...partner, verified: false })).toBe(false);
    expect(isLive({ ...partner, verifiedOn: null })).toBe(false);
  });
  it("never sends the internal verification note to visitors", () => {
    expect(toPublic(partner)).not.toHaveProperty("verificationNote");
  });
  it("validates partners like the database does", () => {
    const { id: _id, ...input } = partner;
    void _id;
    expect(printPartnerSchema.safeParse(input).success).toBe(true);
    expect(printPartnerSchema.safeParse({ ...input, verifiedOn: null }).success).toBe(false); // verified needs a date
    expect(printPartnerSchema.safeParse({ ...input, verified: false, verifiedOn: null }).success).toBe(false); // active needs verified
    expect(printPartnerSchema.safeParse({ ...input, verificationNote: "ok" }).success).toBe(false); // note how it was verified
    expect(printPartnerSchema.safeParse({ ...input, verified: false, verifiedOn: null, active: false, verificationNote: "" }).success).toBe(true); // a draft
  });
  it("expires open requests after their window but keeps final statuses", () => {
    const past = "2026-01-01T00:00:00Z";
    const now = new Date("2026-02-01T00:00:00Z");
    expect(effectiveStatus("ready", past, now)).toBe("expired");
    expect(effectiveStatus("collected", past, now)).toBe("collected");
    expect(effectiveStatus("cancelled", past, now)).toBe("cancelled");
    expect(effectiveStatus("printing", "2026-03-01T00:00:00Z", now)).toBe("printing");
  });
});

describe("print requests remembered on the device", () => {
  const t: PrintTicket = { code: "DE-7K3M-Q9TX", cancelToken: "a".repeat(48), memoryId: "m1", partnerName: "Nile View Hotel", createdAt: "2026-11-17T10:00:00Z", expiresAt: "2026-12-17T10:00:00Z" };
  it("reads only well-formed tickets from storage", () => {
    expect(parseTickets(null)).toEqual([]);
    expect(parseTickets("not json")).toEqual([]);
    expect(parseTickets('{"code":"x"}')).toEqual([]);
    expect(parseTickets(JSON.stringify([t, { ...t, code: "DE-0000-0000" }, { ...t, cancelToken: "short" }, null]))).toEqual([t]);
  });
  it("keeps one entry per code, newest first, and can forget one", () => {
    const t2 = { ...t, code: "DE-AAAA-BBBB" };
    const list = addTicket(addTicket(addTicket([], t), t2), { ...t, partnerName: "Updated" });
    expect(list.map((x) => x.code)).toEqual(["DE-7K3M-Q9TX", "DE-AAAA-BBBB"]);
    expect(list[0].partnerName).toBe("Updated");
    expect(removeTicket(list, t.code).map((x) => x.code)).toEqual(["DE-AAAA-BBBB"]);
  });
  it("caps the list so storage cannot grow without limit", () => {
    let list: PrintTicket[] = [];
    for (let i = 0; i < 80; i++) list = addTicket(list, { ...t, code: `DE-${CODE_ALPHABET.slice(i % 20, (i % 20) + 4)}-${CODE_ALPHABET[i % 31]}${CODE_ALPHABET[Math.floor(i / 31)]}AA` });
    expect(list.length).toBeLessThanOrEqual(50);
  });
});
