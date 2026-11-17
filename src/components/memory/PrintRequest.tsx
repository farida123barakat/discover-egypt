"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clock, MapPin, Printer, ShieldCheck, X } from "lucide-react";
import { getDestination } from "@/content/destinations";
import type { Memory } from "@/lib/memories";
import { PARTNER_KIND_LABEL, REQUEST_DAYS, statusUrl, type PublicPartner } from "@/lib/print";
import { postcardImage } from "@/lib/postcard-export";
import { addTicket, loadTickets, saveTickets, type PrintTicket } from "@/lib/print-tickets";
import { formatDate } from "../ui";

/** Verified, active partners. Empty means printing is not offered, so callers hide the option. */
export function usePrintPartners() {
  const [partners, setPartners] = useState<PublicPartner[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/print/partners")
      .then((r) => (r.ok ? r.json() : { partners: [] }))
      .then((d: { partners?: PublicPartner[] }) => alive && setPartners(d.partners ?? []))
      .catch(() => alive && setPartners([]));
    return () => {
      alive = false;
    };
  }, []);
  return partners;
}

/** What the visitor sees when a request fails, by HTTP status. Never a bare "error". */
export function printErrorMessage(status: number, serverMessage?: string) {
  switch (status) {
    case 501:
      return "Printing isn't switched on for this site yet (it needs the live back end). You can still download the print-ready PDF and print it at any photo shop.";
    case 409:
      return "That printing partner has just become unavailable. Please choose another one, or download the PDF instead.";
    case 429:
      return "You've asked for several prints in the last hour. Please try again a little later.";
    case 413:
    case 415:
      return "We couldn't prepare this postcard for printing. Try downloading the PDF instead.";
    case 422:
      return serverMessage ?? "Please check the highlighted fields.";
    default:
      return "Something went wrong and the request wasn't sent. Please try again, or download the PDF instead.";
  }
}

export function PrintRequestPanel({ memory, partners, onClose, onCreated }: { memory: Memory; partners: PublicPartner[]; onClose: () => void; onCreated: (t: PrintTicket) => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [partnerId, setPartnerId] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<PrintTicket | null>(null);

  useEffect(() => heading.current?.focus(), []);

  // Partners in the memory's destination first, then the rest by name.
  const sorted = [...partners].sort((a, b) => Number(b.destination === memory.destination) - Number(a.destination === memory.destination) || a.name.localeCompare(b.name));
  const chosen = partners.find((p) => p.id === partnerId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!partnerId) errs.partnerId = "Choose where you'd like to collect it.";
    if (!consent) errs.consent = "Please confirm that the partner may see and print this postcard.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMsg("Please fix the highlighted fields.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("partnerId", partnerId);
      fd.set("consent", "yes");
      fd.set("postcard", new File([await postcardImage(memory)], "postcard.jpg", { type: "image/jpeg" }));
      const r = await fetch("/api/print/requests", { method: "POST", body: fd });
      const d = (await r.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string>; code?: string; cancelToken?: string; expiresAt?: string; partner?: PublicPartner };
      if (!r.ok || !d.code || !d.cancelToken) {
        if (d.fields) setErrors((x) => ({ ...x, ...d.fields }));
        setMsg(printErrorMessage(r.status, d.error));
        return;
      }
      const t: PrintTicket = { code: d.code, cancelToken: d.cancelToken, memoryId: memory.id, partnerName: d.partner?.name ?? chosen?.name ?? "", createdAt: new Date().toISOString(), expiresAt: d.expiresAt ?? "" };
      saveTickets(addTicket(loadTickets(), t));
      setTicket(t);
      onCreated(t);
    } catch {
      setMsg(printErrorMessage(0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card relative p-6 md:p-8" aria-labelledby="print-h" data-testid="print-panel">
      <button type="button" onClick={onClose} className="btn btn-ghost absolute right-3 top-3 !min-h-10 !px-3" aria-label="Close printing">
        <X aria-hidden="true" size={18} />
      </button>
      <h2 id="print-h" ref={heading} tabIndex={-1} className="pr-12 text-3xl outline-none">
        {ticket ? "Your postcard is on its way" : "Print this postcard at a partner"}
      </h2>

      {ticket ? (
        <CollectionTicket ticket={ticket} partner={chosen ?? null} />
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-6" aria-label="Print request">
          <p className="flex items-start gap-2 rounded-xl bg-limestone p-4 text-sm">
            <ShieldCheck aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-ok" />
            <span>
              Only the <strong>front of the postcard</strong> is sent: the image you see in the preview. Your story, name, email and location are not. The image is deleted once you collect it, cancel, or after {REQUEST_DAYS} days.
            </span>
          </p>

          <fieldset aria-describedby={errors.partnerId ? "partner-err" : undefined}>
            <legend className="text-sm font-semibold text-midnight">Where would you like to collect it?</legend>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {sorted.map((p) => (
                <li key={p.id}>
                  <label className="flex h-full cursor-pointer gap-3 rounded-xl border-2 border-line p-4 transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold-200/30">
                    <input type="radio" name="partnerId" value={p.id} checked={partnerId === p.id} onChange={() => setPartnerId(p.id)} className="mt-1 h-4 w-4 accent-[var(--color-gold)]" />
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-sm text-muted">
                        {PARTNER_KIND_LABEL[p.kind]} · {getDestination(p.destination)?.name ?? p.destination}
                      </span>
                      <span className="mt-1 flex items-start gap-1 text-sm">
                        <MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0" /> {p.address}
                      </span>
                      {p.openingHours && (
                        <span className="flex items-start gap-1 text-sm">
                          <Clock aria-hidden="true" size={14} className="mt-0.5 shrink-0" /> {p.openingHours}
                        </span>
                      )}
                      {p.verifiedOn && <span className="mt-1 block text-xs text-muted">Partnership checked {formatDate(p.verifiedOn)}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {errors.partnerId && (
              <p id="partner-err" className="field-error" role="alert">
                {errors.partnerId}
              </p>
            )}
          </fieldset>

          <div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-gold)]" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-err" : undefined} />
              <span>
                I agree that staff at {chosen ? <strong>{chosen.name}</strong> : "the partner I choose"} will see and print this postcard image. Any cost is agreed with the partner; there is no payment on this site.
              </span>
            </label>
            {errors.consent && (
              <p id="consent-err" className="field-error" role="alert">
                {errors.consent}
              </p>
            )}
          </div>

          <div aria-live="polite">{msg && <p className="rounded-xl bg-alert/10 px-4 py-3 text-sm font-medium text-alert">{msg}</p>}</div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
              <Printer aria-hidden="true" size={16} /> {busy ? "Sending…" : "Request a print"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** The collection code, a QR code that encodes only the status link, and where to go. */
export function CollectionTicket({ ticket, partner }: { ticket: PrintTicket; partner: PublicPartner | null }) {
  const [qr, setQr] = useState<string | null>(null);
  const url = typeof window === "undefined" ? "" : statusUrl(window.location.origin, ticket.code);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: "M" }))
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-center" data-testid="collection-ticket">
      <div>
        <p className="text-sm text-muted">Your collection code</p>
        <p className="font-display mt-1 text-4xl tracking-widest text-midnight md:text-5xl" data-testid="collection-code">
          {ticket.code}
        </p>
        <p className="mt-3">
          Show this code{qr ? " or the QR code" : ""} at <strong>{partner?.name ?? ticket.partnerName}</strong>
          {partner ? `, ${partner.address}` : ""}.
          {ticket.expiresAt && <> Collect it by {formatDate(ticket.expiresAt.slice(0, 10))}.</>}
        </p>
        <p className="mt-2 text-sm text-muted">The code and QR code hold no personal details, only a link to the status page. This device remembers the request, so you can check it or cancel from your album.</p>
        <Link href={`/memory-hunt/print/${encodeURIComponent(ticket.code)}`} className="btn btn-outline mt-4">
          Check the status
        </Link>
      </div>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element -- generated data URL
        <img src={qr} width={180} height={180} alt={`QR code for the status page of ${ticket.code}`} className="rounded-lg bg-white p-2" />
      )}
    </div>
  );
}
