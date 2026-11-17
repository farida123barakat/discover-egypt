"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Clock, MapPin } from "lucide-react";
import { getDestination } from "@/content/destinations";
import { CODE_RE, FINAL_STATUSES, normaliseCode, PARTNER_KIND_LABEL, PRINT_STATUS_LABEL, type PartnerKind, type PrintStatus } from "@/lib/print";
import { loadTickets, removeTicket, saveTickets, ticketFor } from "@/lib/print-tickets";
import { formatDate } from "../ui";

type Status = {
  code: string;
  status: PrintStatus;
  partner: { name: string; kind: PartnerKind; address: string; openingHours: string; destination: string } | null;
  createdAt: string;
  expiresAt: string;
};

const STEPS: PrintStatus[] = ["requested", "printing", "ready", "collected"];

export function PrintStatusView({ code: raw }: { code: string }) {
  const code = normaliseCode(raw);
  const valid = CODE_RE.test(code);
  const [data, setData] = useState<Status | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "busy" | "error">(valid ? "loading" : "missing");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [canCancel, setCanCancel] = useState(false);

  const load = useCallback(async () => {
    if (!valid) return;
    try {
      const r = await fetch(`/api/print/requests/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (r.status === 404) return setState("missing");
      if (r.status === 429) return setState("busy");
      if (!r.ok) return setState("error");
      setData((await r.json()) as Status);
      setState("ok");
    } catch {
      setState("error");
    }
  }, [code, valid]);

  useEffect(() => {
    void load();
    setCanCancel(!!ticketFor(code));
  }, [load, code]);

  async function cancel() {
    const t = ticketFor(code);
    if (!t) return;
    if (!confirm("Cancel this print request? The postcard image will be deleted from our system.")) return;
    const r = await fetch(`/api/print/requests/${encodeURIComponent(code)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t.cancelToken }) });
    if (r.ok) {
      setMsg({ text: "Request cancelled. The postcard image has been deleted.", tone: "ok" });
      await load();
    } else if (r.status === 409) {
      setMsg({ text: "This request is already closed, so it can't be cancelled.", tone: "error" });
      await load();
    } else if (r.status === 403) {
      setMsg({ text: "This device's cancel key doesn't match the request, so it can't be cancelled from here.", tone: "error" });
    } else {
      setMsg({ text: "The request couldn't be cancelled. Please try again.", tone: "error" });
    }
  }

  const closed = data ? FINAL_STATUSES.includes(data.status) : false;

  return (
    <div className="space-y-10">
      {state === "loading" && <p className="text-muted">Checking…</p>}
      {state === "missing" && (
        <p role="alert" className="rounded-2xl bg-limestone p-6">
          We couldn&rsquo;t find a print request with the code <strong className="font-mono">{code || raw}</strong>. Check the code and try again. Codes look like <span className="font-mono">DE-7K3M-Q9TX</span>.
        </p>
      )}
      {state === "busy" && <p role="alert" className="rounded-2xl bg-alert/10 p-6 text-alert">Too many lookups from your connection. Please wait a minute and try again.</p>}
      {state === "error" && <p role="alert" className="rounded-2xl bg-alert/10 p-6 text-alert">We couldn&rsquo;t check the status right now. Please try again shortly.</p>}

      {state === "ok" && data && (
        <section className="card p-6 md:p-8" aria-labelledby="st-h">
          <p className="text-sm text-muted">Collection code</p>
          <p className="font-display mt-1 text-4xl tracking-widest text-midnight">{data.code}</p>
          <h2 id="st-h" className="mt-6 text-3xl" data-testid="print-status">
            {PRINT_STATUS_LABEL[data.status]}
          </h2>
          {!closed && (
            <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-xs" aria-label="Progress">
              {STEPS.map((s, i) => {
                const reached = STEPS.indexOf(data.status) >= i;
                return (
                  <li key={s} className={`rounded-lg px-2 py-2 font-semibold ${reached ? "bg-gold-200/60 text-midnight" : "bg-sand/60 text-muted"}`} aria-current={data.status === s ? "step" : undefined}>
                    {s === "requested" ? "Requested" : s === "printing" ? "Printing" : s === "ready" ? "Ready" : "Collected"}
                  </li>
                );
              })}
            </ol>
          )}
          {data.partner && (
            <div className="mt-6 rounded-xl bg-limestone p-4">
              <p className="font-semibold">{data.partner.name}</p>
              <p className="text-sm text-muted">
                {PARTNER_KIND_LABEL[data.partner.kind]} · {getDestination(data.partner.destination)?.name ?? data.partner.destination}
              </p>
              <p className="mt-1 flex items-start gap-1 text-sm">
                <MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0" /> {data.partner.address}
              </p>
              {data.partner.openingHours && (
                <p className="flex items-start gap-1 text-sm">
                  <Clock aria-hidden="true" size={14} className="mt-0.5 shrink-0" /> {data.partner.openingHours}
                </p>
              )}
            </div>
          )}
          <p className="mt-4 text-sm text-muted">
            Requested {formatDate(data.createdAt.slice(0, 10))}
            {!closed && <> · collect by {formatDate(data.expiresAt.slice(0, 10))}</>}
          </p>
          <div aria-live="polite">{msg && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}</div>
          {!closed && canCancel && (
            <button type="button" className="btn btn-ghost mt-4 text-alert" onClick={cancel}>
              Cancel this request
            </button>
          )}
          {closed && canCancel && (
            <button
              type="button"
              className="btn btn-ghost mt-4"
              onClick={() => {
                saveTickets(removeTicket(loadTickets(), data.code));
                setCanCancel(false);
                setMsg({ text: "Removed from this device's list.", tone: "ok" });
              }}
            >
              Remove from my list
            </button>
          )}
        </section>
      )}

      <CodeLookup />
    </div>
  );
}

export function CodeLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  function submit(e: FormEvent) {
    e.preventDefault();
    const c = normaliseCode(value);
    if (!CODE_RE.test(c)) return setError("Codes look like DE-7K3M-Q9TX: DE, then two groups of four letters and numbers.");
    setError(null);
    router.push(`/memory-hunt/print/${encodeURIComponent(c)}`);
  }
  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line p-6" aria-label="Check a collection code">
      <div className="field">
        <label htmlFor="code-lookup">Check another collection code</label>
        <div className="flex flex-wrap gap-3">
          <input id="code-lookup" className="input max-w-xs font-mono uppercase" value={value} onChange={(e) => setValue(e.target.value)} placeholder="DE-XXXX-XXXX" autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "code-err" : undefined} />
          <button type="submit" className="btn btn-primary">
            Check
          </button>
        </div>
        {error && (
          <p id="code-err" className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
