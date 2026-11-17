/**
 * Print requests made from this device. The collection code and the one-time cancel token are
 * returned once by the server; keeping them in localStorage lets the visitor check the status and
 * cancel later. Nothing here is personal: no name, email, photo or caption.
 */
import { CODE_RE } from "./print";

export type PrintTicket = {
  code: string;
  cancelToken: string;
  memoryId: string;
  partnerName: string;
  createdAt: string;
  expiresAt: string;
};

export const TICKETS_KEY = "discover-egypt-print-tickets";
const TOKEN_RE = /^[0-9a-f]{48}$/;
const MAX_TICKETS = 50;

/** Read tickets defensively: storage can hold anything, including data from an older version. */
export function parseTickets(raw: string | null): PrintTicket[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.filter(
    (t): t is PrintTicket =>
      !!t &&
      typeof t === "object" &&
      typeof t.code === "string" &&
      CODE_RE.test(t.code) &&
      typeof t.cancelToken === "string" &&
      TOKEN_RE.test(t.cancelToken) &&
      typeof t.memoryId === "string" &&
      typeof t.partnerName === "string" &&
      typeof t.createdAt === "string" &&
      typeof t.expiresAt === "string",
  );
}

/** Newest first, one entry per code, capped so storage cannot grow without limit. */
export function addTicket(list: PrintTicket[], t: PrintTicket): PrintTicket[] {
  return [t, ...list.filter((x) => x.code !== t.code)].slice(0, MAX_TICKETS);
}

export function removeTicket(list: PrintTicket[], code: string): PrintTicket[] {
  return list.filter((x) => x.code !== code);
}

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // blocked (e.g. some private-browsing modes)
  }
}

export function loadTickets() {
  return parseTickets(storage()?.getItem(TICKETS_KEY) ?? null);
}

export function saveTickets(list: PrintTicket[]) {
  try {
    storage()?.setItem(TICKETS_KEY, JSON.stringify(list));
  } catch {
    /* full or blocked: the visitor still sees the code on screen */
  }
}

export function ticketFor(code: string) {
  return loadTickets().find((t) => t.code === code) ?? null;
}
