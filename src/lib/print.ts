/**
 * Postcard printing at partner locations — shared types and pure helpers.
 *
 * Printing is only offered when at least one partner is both verified (with a date) and active.
 * A request gets a random collection code. The code (and the QR code that encodes it) contains no
 * name, email, photo or caption — only a link to a status page that shows the status and the partner.
 */
export const PARTNER_KINDS = ["hotel", "museum", "tourism-office", "cafe"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];
export const PARTNER_KIND_LABEL: Record<PartnerKind, string> = { hotel: "Hotel", museum: "Museum", "tourism-office": "Tourism office", cafe: "Café" };

export type PrintPartner = {
  id: string;
  name: string;
  kind: PartnerKind;
  destination: string;
  address: string;
  openingHours: string;
  /** internal: how the partnership was verified. Never sent to visitors. */
  verificationNote?: string;
  verified: boolean;
  verifiedOn: string | null;
  active: boolean;
};
export type PublicPartner = Omit<PrintPartner, "verificationNote">;

export const PRINT_STATUSES = ["requested", "printing", "ready", "collected", "cancelled", "expired"] as const;
export type PrintStatus = (typeof PRINT_STATUSES)[number];
export const PRINT_STATUS_LABEL: Record<PrintStatus, string> = {
  requested: "Requested — waiting for the partner",
  printing: "Being printed",
  ready: "Ready to collect",
  collected: "Collected",
  cancelled: "Cancelled",
  expired: "Expired",
};
/** Once a request reaches one of these, its postcard image is deleted from the server. */
export const FINAL_STATUSES: PrintStatus[] = ["collected", "cancelled", "expired"];
export const REQUEST_DAYS = 30;

export function isLive(p: Pick<PrintPartner, "verified" | "verifiedOn" | "active">) {
  return p.verified && !!p.verifiedOn && p.active;
}

export function toPublic(p: PrintPartner): PublicPartner {
  const { verificationNote: _n, ...rest } = p;
  void _n;
  return rest;
}

// No 0/O, 1/I/L: easy to read aloud and type at a hotel desk.
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_RE = new RegExp(`^DE-[${CODE_ALPHABET}]{4}-[${CODE_ALPHABET}]{4}$`);

function randomChars(n: number) {
  const out: string[] = [];
  const max = 256 - (256 % CODE_ALPHABET.length); // rejection sampling: no modulo bias
  while (out.length < n) {
    const buf = new Uint8Array(n * 2);
    globalThis.crypto.getRandomValues(buf);
    for (const b of buf) if (b < max && out.length < n) out.push(CODE_ALPHABET[b % CODE_ALPHABET.length]);
  }
  return out.join("");
}

/** e.g. DE-7K3M-Q9TX — about 40 bits of randomness. */
export function newCollectionCode() {
  const s = randomChars(8);
  return `DE-${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Normalise what someone typed: case, spaces and missing dashes. */
export function normaliseCode(raw: string) {
  const s = raw.toUpperCase().replace(/[\s_]/g, "");
  const m = s.replace(/^DE-?/, "").replace(/-/g, "");
  return m.length === 8 ? `DE-${m.slice(0, 4)}-${m.slice(4)}` : s;
}

export function newCancelToken() {
  const b = new Uint8Array(24);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function statusUrl(siteUrl: string, code: string) {
  return `${siteUrl.replace(/\/$/, "")}/memory-hunt/print/${encodeURIComponent(code)}`;
}

/** A request is past its collection window if it never got collected or cancelled. */
export function effectiveStatus(status: PrintStatus, expiresAt: string, now = new Date()): PrintStatus {
  if (FINAL_STATUSES.includes(status)) return status;
  return new Date(expiresAt).getTime() < now.getTime() ? "expired" : status;
}
