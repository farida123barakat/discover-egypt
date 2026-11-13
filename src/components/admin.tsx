"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getDestination } from "@/content/destinations";
import type { EventItem, Price } from "@/content/practical";
import type { Submission } from "@/lib/store";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { formatDate } from "./ui";

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, error: (d as { error?: string }).error };
}

export function AdminLogin({ mode }: { mode: "local" | "supabase" }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    if (mode === "local") {
      const r = await post("/api/admin/login", { password: fd.get("password") });
      if (!r.ok) setErr(r.error ?? "Sign in failed");
      else router.refresh();
    } else {
      const sb = supabaseBrowser();
      const { error } = (await sb?.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) })) ?? { error: { message: "Unavailable" } };
      if (error) setErr("Incorrect email or password");
      else router.refresh();
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {mode === "supabase" && (
        <div className="field">
          <label htmlFor="a-email">Email</label>
          <input id="a-email" name="email" type="email" autoComplete="username" required className="input" />
        </div>
      )}
      <div className="field">
        <label htmlFor="a-pass">Password</label>
        <input id="a-pass" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p role="alert" className="field-error">
        {err}
      </p>
      {mode === "local" && <p className="text-sm text-muted">Local demo mode: the password is LOCAL_ADMIN_PASSWORD from your .env.local file.</p>}
    </form>
  );
}

export function LogoutButton({ mode }: { mode: "local" | "supabase" }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={async () => {
        if (mode === "supabase") await supabaseBrowser()?.auth.signOut();
        else await post("/api/admin/logout", {});
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

export function ModerationQueue({ initial }: { initial: Submission[] }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function act(s: Submission, action: "approve" | "reject", answer?: string) {
    if (action === "approve" && s.kind === "question" && !answer?.trim()) {
      setMsg("Write an answer before publishing a question.");
      return;
    }
    const r = await post("/api/admin/moderate", { kind: s.kind, id: s.id, action, answer });
    if (!r.ok) return setMsg(r.error ?? "Action failed");
    setItems((x) => x.filter((i) => i.id !== s.id));
    setMsg(action === "approve" ? "Published." : "Rejected.");
    router.refresh();
  }

  return (
    <div className="mt-4">
      <p aria-live="polite" className="min-h-6 text-sm font-semibold text-ok">
        {msg}
      </p>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-limestone p-8 text-center text-muted">The queue is empty. Nice work.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((s) => (
            <ModerationItem key={s.id} s={s} onAct={act} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ModerationItem({ s, onAct }: { s: Submission; onAct: (s: Submission, a: "approve" | "reject", answer?: string) => void }) {
  const [answer, setAnswer] = useState("");
  const id = `ans-${s.id}`;
  return (
    <li className="card p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold-ink">
        {s.kind} · {getDestination(s.destination)?.name ?? "General"} · {formatDate(s.created_at.slice(0, 10))}
      </p>
      {s.title && <h3 className="mt-2 text-2xl">{s.title}</h3>}
      <p className="mt-2 whitespace-pre-line">{s.body}</p>
      <p className="mt-2 text-sm text-muted">
        From {s.name}
        {s.country ? `, ${s.country}` : ""} · {s.email} (private)
      </p>
      {s.kind === "question" && (
        <div className="field mt-4">
          <label htmlFor={id}>Answer (published with the question)</label>
          <textarea id={id} className="input" rows={3} maxLength={2000} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => onAct(s, "approve", answer)}>
          {s.kind === "question" ? "Answer & publish" : "Publish"}
        </button>
        <button type="button" className="btn btn-ghost text-alert" onClick={() => onAct(s, "reject")}>
          Reject
        </button>
      </div>
    </li>
  );
}

export function PriceEditor({ prices }: { prices: Price[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="mt-4 overflow-x-auto">
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">
        {msg}
      </p>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Min EGP</th>
            <th scope="col">Max EGP</th>
            <th scope="col">Last checked</th>
            <th scope="col">
              <span className="sr-only">Save</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p.id} className="border-t border-sand">
              <td className="py-2 pr-3">{p.item}</td>
              <td colSpan={4} className="py-2">
                <form
                  className="flex items-center gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const r = await post("/api/admin/prices", { id: p.id, min: Number(fd.get("min")), max: Number(fd.get("max")) });
                    setMsg(r.ok ? `Saved: ${p.item}` : r.error ?? "Save failed");
                    if (r.ok) router.refresh();
                  }}
                >
                  <label className="sr-only" htmlFor={`min-${p.id}`}>Minimum for {p.item}</label>
                  <input id={`min-${p.id}`} name="min" type="number" min={0} defaultValue={p.egp[0]} className="input !min-h-9 w-24" />
                  <label className="sr-only" htmlFor={`max-${p.id}`}>Maximum for {p.item}</label>
                  <input id={`max-${p.id}`} name="max" type="number" min={0} defaultValue={p.egp[1]} className="input !min-h-9 w-24" />
                  <span className="w-28 text-muted">{p.lastVerified ? formatDate(p.lastVerified) : "—"}</span>
                  <button type="submit" className="btn btn-ghost !min-h-9 !py-1">
                    Save<span className="sr-only"> {p.item}</span>
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PhotoUpload({ enabled }: { enabled: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (!enabled) return <p className="mt-2 text-sm text-muted">Photo storage needs Supabase Storage. It is disabled in local demo mode.</p>;
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/admin/upload", { method: "POST", body: new FormData(e.currentTarget) });
        const d = await r.json().catch(() => ({}));
        setMsg(r.ok ? `Uploaded as ${d.path}` : d.error ?? "Upload failed");
      }}
    >
      <div className="field">
        <label htmlFor="up-file">Image (JPEG, PNG or WebP, max 5 MB)</label>
        <input id="up-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="input" />
      </div>
      <div className="field">
        <label htmlFor="up-alt">Alt text</label>
        <input id="up-alt" name="alt" required minLength={10} className="input" />
      </div>
      <button type="submit" className="btn btn-primary">Upload</button>
      <p aria-live="polite" className="text-sm">{msg}</p>
    </form>
  );
}

async function send(url: string, method: "POST" | "DELETE", body: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  return { ok: r.ok, error: d.error, fields: d.fields ?? {} };
}

const EMPTY_EVENT: EventItem = { id: "", name: "", where: "", when: "", dateISO: null, description: "", status: "awaiting", lastVerified: null };

export function EventManager({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const isNew = editing ? !events.some((e) => e.id === editing.id) : false;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      id: String(fd.get("id") ?? ""),
      name: String(fd.get("name") ?? ""),
      where: String(fd.get("where") ?? ""),
      when: String(fd.get("when") ?? ""),
      dateISO: String(fd.get("dateISO") ?? "") || null,
      description: String(fd.get("description") ?? ""),
      status: String(fd.get("status")),
      sourceName: String(fd.get("sourceName") ?? ""),
      sourceUrl: String(fd.get("sourceUrl") ?? ""),
    };
    const r = await send("/api/admin/events", "POST", body);
    setFields(r.fields);
    setMsg(r.ok ? `Saved: ${body.name}` : r.error ?? "Save failed");
    if (r.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  async function remove(ev: EventItem) {
    if (!confirm(`Delete "${ev.name}"? This cannot be undone.`)) return;
    const r = await send("/api/admin/events", "DELETE", { id: ev.id });
    setMsg(r.ok ? `Deleted: ${ev.name}` : r.error ?? "Delete failed");
    if (r.ok) router.refresh();
  }

  const err = (k: string) => (fields[k] ? <p className="field-error">{fields[k]}</p> : null);

  return (
    <div className="mt-4">
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">{msg}</p>
      <ul className="divide-y divide-sand rounded-2xl bg-white px-5">
        {events.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>
              <strong>{ev.name}</strong> · {ev.when} <span className="text-muted">({ev.status})</span>
            </span>
            <span className="flex gap-2">
              <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => { setFields({}); setEditing(ev); }}>
                Edit<span className="sr-only"> {ev.name}</span>
              </button>
              <button type="button" className="btn btn-ghost !min-h-9 !py-1 text-alert" onClick={() => remove(ev)}>
                Delete<span className="sr-only"> {ev.name}</span>
              </button>
            </span>
          </li>
        ))}
      </ul>
      {!editing && (
        <button type="button" className="btn btn-primary mt-4" onClick={() => { setFields({}); setEditing({ ...EMPTY_EVENT }); }}>
          Add event
        </button>
      )}
      {editing && (
        <form onSubmit={save} className="card mt-6 grid gap-4 p-6 md:grid-cols-2" aria-label={isNew ? "New event" : `Edit ${editing.name}`}>
          <div className="field">
            <label htmlFor="ev-id">ID (url-safe)</label>
            <input id="ev-id" name="id" required defaultValue={editing.id} readOnly={!isNew} pattern="[a-z0-9-]{2,60}" className="input" />
            {err("id")}
          </div>
          <div className="field">
            <label htmlFor="ev-name">Name</label>
            <input id="ev-name" name="name" required defaultValue={editing.name} className="input" />
            {err("name")}
          </div>
          <div className="field">
            <label htmlFor="ev-where">Location</label>
            <input id="ev-where" name="where" required defaultValue={editing.where} className="input" />
            {err("where")}
          </div>
          <div className="field">
            <label htmlFor="ev-when">When (as shown to visitors)</label>
            <input id="ev-when" name="when" required defaultValue={editing.when} className="input" />
            {err("when")}
          </div>
          <div className="field">
            <label htmlFor="ev-date">Date for sorting (optional)</label>
            <input id="ev-date" name="dateISO" type="date" defaultValue={editing.dateISO ?? ""} className="input" />
            {err("dateISO")}
          </div>
          <div className="field">
            <label htmlFor="ev-status">Verification status</label>
            <select id="ev-status" name="status" defaultValue={editing.status} className="input">
              <option value="verified">Verified (needs source)</option>
              <option value="estimate">Estimate</option>
              <option value="awaiting">Awaiting verification</option>
            </select>
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="ev-desc">Description</label>
            <textarea id="ev-desc" name="description" required rows={3} defaultValue={editing.description} className="input" />
            {err("description")}
          </div>
          <div className="field">
            <label htmlFor="ev-sname">Source name</label>
            <input id="ev-sname" name="sourceName" defaultValue={editing.source?.name ?? ""} className="input" />
          </div>
          <div className="field">
            <label htmlFor="ev-surl">Source link (https)</label>
            <input id="ev-surl" name="sourceUrl" type="url" defaultValue={editing.source?.url ?? ""} className="input" />
            {err("sourceUrl")}
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn btn-primary">Save event</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function FeaturedPicker({ options, current }: { options: { slug: string; name: string }[]; current: string[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="mt-4 grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const slugs = [0, 1, 2, 3, 4].map((i) => String(fd.get(`slot${i}`)));
        const r = await send("/api/admin/featured", "POST", { slugs });
        setMsg(r.ok ? "Homepage updated." : r.fields.slugs ?? r.error ?? "Save failed");
        if (r.ok) router.refresh();
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="field">
          <label htmlFor={`slot${i}`}>{`Position ${i + 1}`}</label>
          <select id={`slot${i}`} name={`slot${i}`} defaultValue={current[i]} className="input">
            {options.map((o) => (
              <option key={o.slug} value={o.slug}>{o.name}</option>
            ))}
          </select>
        </div>
      ))}
      <div className="sm:col-span-2 flex items-center gap-4">
        <button type="submit" className="btn btn-primary">Save featured</button>
        <p aria-live="polite" className="text-sm font-semibold">{msg}</p>
      </div>
    </form>
  );
}
