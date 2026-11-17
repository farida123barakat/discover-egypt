"use client";
/** Admin screens for Memory Hunt printing: partners (add, verify, activate) and the print-job queue. */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PARTNER_KIND_LABEL, PARTNER_KINDS, PRINT_STATUS_LABEL, FINAL_STATUSES, isLive, type PrintPartner, type PrintStatus } from "@/lib/print";

async function send(url: string, method: "POST" | "DELETE", body: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  return { ok: r.ok, status: r.status, error: d.error, fields: d.fields ?? {} };
}

const today = () => new Date().toISOString().slice(0, 10);
type Msg = { text: string; ok: boolean } | null;

/* ---------------------------------------------------------------- partners */

export function PrintPartnerManager({ partners, destinations }: { partners: PrintPartner[]; destinations: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<(PrintPartner & { isNew: boolean }) | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Msg>(null);
  const destName = (s: string) => destinations.find((d) => d.slug === s)?.name ?? s;

  function payload(p: PrintPartner) {
    return { id: p.id || undefined, name: p.name, kind: p.kind, destination: p.destination, address: p.address, openingHours: p.openingHours, verificationNote: p.verificationNote ?? "", verified: p.verified, verifiedOn: p.verifiedOn, active: p.active };
  }

  async function quick(p: PrintPartner, change: Partial<PrintPartner>, label: string) {
    const r = await send("/api/admin/print-partners", "POST", payload({ ...p, ...change }));
    const firstField = Object.values(r.fields)[0];
    setMsg({ text: r.ok ? label : firstField ?? r.error ?? "Update failed", ok: r.ok });
    if (r.ok) router.refresh();
    else if (Object.keys(r.fields).length) {
      // e.g. verifying needs a note: open the form so the admin can add it
      setFields(r.fields);
      setEditing({ ...p, ...change, isNew: false });
    }
  }

  async function remove(p: PrintPartner) {
    if (!confirm(`Delete “${p.name}”? Closed print requests for this partner are deleted too. This cannot be undone.`)) return;
    const r = await send("/api/admin/print-partners", "DELETE", { id: p.id });
    setMsg({ text: r.ok ? `Deleted: ${p.name}` : r.error ?? "Delete failed", ok: r.ok });
    if (r.ok) router.refresh();
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    const verified = fd.get("verified") === "on";
    const p: PrintPartner = {
      id: editing.isNew ? "" : editing.id,
      name: String(fd.get("name") ?? ""),
      kind: String(fd.get("kind")) as PrintPartner["kind"],
      destination: String(fd.get("destination")),
      address: String(fd.get("address") ?? ""),
      openingHours: String(fd.get("openingHours") ?? ""),
      verificationNote: String(fd.get("verificationNote") ?? ""),
      verified,
      verifiedOn: String(fd.get("verifiedOn") ?? "") || null,
      active: fd.get("active") === "on",
    };
    const r = await send("/api/admin/print-partners", "POST", payload(p));
    setFields(r.fields);
    setMsg({ text: r.ok ? `${editing.isNew ? "Added" : "Saved"}: ${p.name}` : r.error ?? "Save failed", ok: r.ok });
    if (r.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  const err = (k: string) =>
    fields[k] ? (
      <p className="field-error" role="alert">
        {fields[k]}
      </p>
    ) : null;
  const blank = (): PrintPartner & { isNew: boolean } => ({ id: "", name: "", kind: "hotel", destination: destinations[0]?.slug ?? "cairo", address: "", openingHours: "", verificationNote: "", verified: false, verifiedOn: null, active: false, isNew: true });
  const live = partners.filter(isLive).length;

  return (
    <div className="mt-4">
      <p className="text-sm text-muted">
        {live} of {partners.length} {partners.length === 1 ? "partner is" : "partners are"} live. Printing is only offered to visitors while at least one partner is verified <em>and</em> active.
      </p>
      <p aria-live="polite" className={`mt-2 min-h-6 text-sm font-semibold ${msg?.ok === false ? "text-alert" : "text-ok"}`}>
        {msg?.text}
      </p>
      {partners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Printing partners</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2">Partner</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-t border-sand">
                  <td className="py-3 pr-3">
                    <strong>{p.name}</strong>
                    <span className="block text-xs text-muted">
                      {PARTNER_KIND_LABEL[p.kind]} · {destName(p.destination)} · {p.address}
                    </span>
                  </td>
                  <td className="pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.verified ? "bg-ok/10 text-ok" : "bg-sand text-muted"}`}>{p.verified ? `Verified ${p.verifiedOn}` : "Not verified"}</span>
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? "bg-gold/15 text-gold-ink" : "bg-sand text-muted"}`}>{p.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="py-2">
                    <span className="flex flex-wrap justify-end gap-1">
                      {!p.verified && (
                        <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => quick(p, { verified: true, verifiedOn: today() }, `${p.name}: verified today`)}>
                          Mark verified<span className="sr-only"> {p.name}</span>
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => quick(p, { active: !p.active }, `${p.name}: ${p.active ? "deactivated" : "activated"}`)}>
                        {p.active ? "Deactivate" : "Activate"}
                        <span className="sr-only"> {p.name}</span>
                      </button>
                      <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => { setFields({}); setEditing({ ...p, isNew: false }); }}>
                        Edit<span className="sr-only"> {p.name}</span>
                      </button>
                      <button type="button" className="btn btn-ghost !min-h-9 !py-1 text-alert" onClick={() => remove(p)}>
                        Delete<span className="sr-only"> {p.name}</span>
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl bg-limestone p-6 text-center text-muted">No printing partners yet. Visitors don&rsquo;t see the print option until you add and verify one.</p>
      )}
      {!editing && (
        <button type="button" className="btn btn-primary mt-4" onClick={() => { setFields({}); setEditing(blank()); }}>
          Add partner
        </button>
      )}

      {editing && (
        <form onSubmit={save} noValidate className="card mt-6 grid gap-4 p-6 md:grid-cols-2" aria-label={editing.isNew ? "New printing partner" : `Edit ${editing.name}`}>
          <h3 className="text-2xl md:col-span-2">{editing.isNew ? "New printing partner" : `Edit: ${editing.name}`}</h3>
          <div className="field">
            <label htmlFor="pp-name">Name</label>
            <input id="pp-name" name="name" required defaultValue={editing.name} className="input" aria-invalid={!!fields.name} />
            {err("name")}
          </div>
          <div className="field">
            <label htmlFor="pp-kind">Kind of place</label>
            <select id="pp-kind" name="kind" defaultValue={editing.kind} className="input">
              {PARTNER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {PARTNER_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pp-dest">Destination</label>
            <select id="pp-dest" name="destination" defaultValue={editing.destination} className="input">
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pp-hours">Opening hours for collection</label>
            <input id="pp-hours" name="openingHours" defaultValue={editing.openingHours} className="input" placeholder="e.g. Reception, 24 hours" aria-invalid={!!fields.openingHours} />
            {err("openingHours")}
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="pp-address">Address (shown to visitors)</label>
            <input id="pp-address" name="address" required defaultValue={editing.address} className="input" aria-invalid={!!fields.address} />
            {err("address")}
          </div>
          <fieldset className="rounded-xl border border-line p-4 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">Verification (never shown to visitors)</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="verified" defaultChecked={editing.verified} className="h-4 w-4 accent-[var(--color-gold)]" /> Partnership verified
              </label>
              <div className="field">
                <label htmlFor="pp-von">Verified on</label>
                <input id="pp-von" name="verifiedOn" type="date" max={today()} defaultValue={editing.verifiedOn ?? ""} className="input" aria-invalid={!!fields.verifiedOn} />
                {err("verifiedOn")}
              </div>
              <div className="field md:col-span-2">
                <label htmlFor="pp-note">How it was verified</label>
                <textarea id="pp-note" name="verificationNote" rows={2} defaultValue={editing.verificationNote ?? ""} className="input" placeholder="Who you spoke to, when, and how (e.g. signed agreement, visit)" aria-invalid={!!fields.verificationNote} />
                {err("verificationNote")}
              </div>
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.active} className="h-4 w-4 accent-[var(--color-gold)]" aria-invalid={!!fields.active} /> Active (visitors can choose this partner)
            </label>
            {err("active")}
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn btn-primary">
              {editing.isNew ? "Add partner" : "Save partner"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- print requests */

export type AdminPrintRequest = { id: string; code: string; partnerName: string; status: PrintStatus; hasImage: boolean; createdAt: string; expiresAt: string };

/** The next step for each open status. Final statuses delete the image on the server. */
export const NEXT_STATUS: Partial<Record<PrintStatus, { to: PrintStatus; label: string }>> = {
  requested: { to: "printing", label: "Start printing" },
  printing: { to: "ready", label: "Mark ready" },
  ready: { to: "collected", label: "Mark collected" },
};

export function PrintRequestQueue({ requests }: { requests: AdminPrintRequest[] }) {
  const router = useRouter();
  const [show, setShow] = useState<"open" | "all">("open");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const norm = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const list = requests.filter((r) => (show === "all" || !FINAL_STATUSES.includes(r.status)) && (!norm || r.code.replace(/-/g, "").includes(norm)));

  async function setStatus(r: AdminPrintRequest, status: PrintStatus) {
    if (FINAL_STATUSES.includes(status) && status !== "collected" && !confirm(`Mark ${r.code} as ${status}? The postcard image will be deleted.`)) return;
    const res = await send("/api/admin/print-requests", "POST", { id: r.id, status });
    setMsg({ text: res.ok ? `${r.code}: ${PRINT_STATUS_LABEL[status].toLowerCase()}` : res.error ?? "Update failed", ok: res.ok });
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="field">
          <label htmlFor="pr-q">Find a collection code</label>
          <input id="pr-q" type="search" className="input font-mono uppercase" value={q} onChange={(e) => setQ(e.target.value)} placeholder="DE-XXXX-XXXX" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="pr-show">Show</label>
          <select id="pr-show" className="input" value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
            <option value="open">Open requests</option>
            <option value="all">All, including closed</option>
          </select>
        </div>
      </div>
      <p aria-live="polite" className={`mt-3 min-h-6 text-sm font-semibold ${msg?.ok === false ? "text-alert" : "text-ok"}`}>
        {msg?.text}
      </p>
      {list.length ? (
        <ul className="divide-y divide-sand rounded-2xl bg-white px-5">
          {list.map((r) => {
            const next = NEXT_STATUS[r.status];
            const open = !FINAL_STATUSES.includes(r.status);
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" data-testid="print-request-row">
                <span>
                  <strong className="font-mono tracking-wider">{r.code}</strong> · {r.partnerName}
                  <span className="block text-muted">
                    {PRINT_STATUS_LABEL[r.status]} · requested {r.createdAt.slice(0, 10)}
                    {open && ` · expires ${r.expiresAt.slice(0, 10)}`}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1">
                  {r.hasImage && (
                    <a href={`/api/admin/print-requests/${r.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-9 !py-1">
                      Open postcard<span className="sr-only"> {r.code}</span>
                    </a>
                  )}
                  {next && (
                    <button type="button" className="btn btn-primary !min-h-9 !py-1" onClick={() => setStatus(r, next.to)}>
                      {next.label}
                      <span className="sr-only"> {r.code}</span>
                    </button>
                  )}
                  {open && (
                    <button type="button" className="btn btn-ghost !min-h-9 !py-1 text-alert" onClick={() => setStatus(r, "cancelled")}>
                      Cancel<span className="sr-only"> {r.code}</span>
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-limestone p-6 text-center text-muted">{requests.length ? "No requests match." : "No print requests yet."}</p>
      )}
    </div>
  );
}
