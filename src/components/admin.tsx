"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getDestination } from "@/content/destinations";
import type { EventItem, Price } from "@/content/practical";
import type { BucketActivity } from "@/content/bucket";
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
      else {
        // Go to the dashboard directly rather than relying on the login page's redirect after a refresh.
        router.replace("/admin");
        router.refresh();
      }
    } else {
      const sb = supabaseBrowser();
      const { error } = (await sb?.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) })) ?? { error: { message: "Unavailable" } };
      if (error) setErr("Incorrect email or password");
      else {
        router.replace("/admin");
        router.refresh();
      }
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

export function RecipeReview({ items }: { items: { slug: string; name: string; status: "draft" | "approved"; lastReviewed: string; reviewer?: string }[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  async function set(slug: string, name: string, status: "draft" | "approved") {
    if (status === "draft" && !confirm(`Unpublish "${name}"? It will disappear from the live site.`)) return;
    const r = await send("/api/admin/recipes", "POST", { slug, status });
    setMsg(r.ok ? `${name}: ${status === "approved" ? "approved and published" : "returned to draft"}.` : r.error ?? "Update failed");
    if (r.ok) router.refresh();
  }
  return (
    <div className="mt-4">
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">{msg}</p>
      <ul className="divide-y divide-sand rounded-2xl bg-white px-5">
        {items.map((r) => (
          <li key={r.slug} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>
              <a href={`/taste/${r.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-nile underline">{r.name}</a>{" "}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "approved" ? "bg-ok/10 text-ok" : "bg-gold/15 text-gold-ink"}`}>{r.status === "approved" ? "Published" : "Draft"}</span>
              <span className="ml-2 text-muted">reviewed {r.lastReviewed}{r.reviewer ? ` by ${r.reviewer}` : ""}</span>
            </span>
            {r.status === "draft" ? (
              <button type="button" className="btn btn-primary !min-h-9 !py-1" onClick={() => set(r.slug, r.name, "approved")}>
                Approve & publish<span className="sr-only"> {r.name}</span>
              </button>
            ) : (
              <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => set(r.slug, r.name, "draft")}>
                Unpublish<span className="sr-only"> {r.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const BUCKET_CATS = ["history", "adventure", "food", "culture", "nature", "photography", "relaxation", "family", "hidden-gems"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PAGE = 8;

export function BucketManager({ items, destinations, photoKeys }: { items: BucketActivity[]; destinations: { slug: string; name: string }[]; photoKeys: { key: string; alt: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "hidden" | "featured">("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<BucketActivity | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const filtered = items.filter(
    (a) =>
      (status === "all" || (status === "published" && a.published) || (status === "hidden" && !a.published) || (status === "featured" && a.featured)) &&
      (!q.trim() || `${a.title} ${a.id} ${a.categories.join(" ")} ${a.destination ?? a.place}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  function blank(): BucketActivity {
    const today = new Date().toISOString().slice(0, 10);
    return { id: "", title: "", description: "", destination: destinations[0]?.slug ?? null, categories: [], effort: "easy", duration: "", bestMonths: [], tips: [], photo: null, published: false, featured: false, createdAt: today, lastReviewed: today };
  }

  async function quick(a: BucketActivity, change: Partial<BucketActivity>, label: string) {
    const { createdAt: _c, lastReviewed: _l, ...rest } = { ...a, ...change };
    void _c;
    void _l;
    const r = await send("/api/admin/bucket", "POST", rest);
    setMsg({ text: r.ok ? label : r.error ?? "Update failed", ok: r.ok });
    if (r.ok) router.refresh();
  }

  async function remove(a: BucketActivity) {
    if (!confirm(`Delete “${a.title}”? Visitors who added it will no longer see it. This cannot be undone.`)) return;
    const r = await send("/api/admin/bucket", "DELETE", { id: a.id });
    setMsg({ text: r.ok ? `Deleted: ${a.title}` : r.error ?? "Delete failed", ok: r.ok });
    if (r.ok) router.refresh();
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const seasonNote = String(fd.get("seasonNote") ?? "").trim();
    const seasonUrl = String(fd.get("seasonUrl") ?? "").trim();
    const linkHref = String(fd.get("linkHref") ?? "").trim();
    const dest = String(fd.get("destination"));
    const body = {
      id: String(fd.get("id") ?? "").trim(),
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      destination: dest === "" ? null : dest,
      place: String(fd.get("place") ?? "").trim() || undefined,
      categories: fd.getAll("categories").map(String),
      effort: String(fd.get("effort")),
      duration: String(fd.get("duration") ?? ""),
      bestMonths: fd.getAll("months").map(Number),
      season: seasonNote
        ? { note: seasonNote, verified: fd.get("seasonVerified") === "on", source: seasonUrl ? { name: String(fd.get("seasonSource") || seasonUrl), url: seasonUrl } : undefined }
        : undefined,
      tips: String(fd.get("tips") ?? "").split("\n").map((t) => t.trim()).filter(Boolean),
      photo: String(fd.get("photo") ?? "") || null,
      link: linkHref ? { href: linkHref, label: String(fd.get("linkLabel") || "More") } : undefined,
      published: fd.get("published") === "on",
      featured: fd.get("featured") === "on",
    };
    const r = await send("/api/admin/bucket", "POST", body);
    setFields(r.fields);
    setMsg({ text: r.ok ? `${isNew ? "Created" : "Saved"}: ${body.title}` : r.error ?? "Save failed", ok: r.ok });
    if (r.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  const err = (k: string) => (fields[k] ? <p className="field-error" role="alert">{fields[k]}</p> : null);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="field min-w-56 flex-1">
          <label htmlFor="bk-q">Search activities</label>
          <input id="bk-q" type="search" className="input" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Title, category, destination…" />
        </div>
        <div className="field">
          <label htmlFor="bk-status">Show</label>
          <select id="bk-status" className="input" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="hidden">Unpublished</option>
            <option value="featured">Featured</option>
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { setFields({}); setIsNew(true); setEditing(blank()); }}>
          New activity
        </button>
      </div>
      <p aria-live="polite" className={`mt-3 min-h-6 text-sm font-semibold ${msg?.ok === false ? "text-alert" : "text-ok"}`}>{msg?.text}</p>

      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Bucket-list activities</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2">Activity</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {shown.map((a) => (
            <tr key={a.id} className="border-t border-sand">
              <td className="py-3 pr-3">
                <strong>{a.title}</strong>
                <span className="block text-xs text-muted">{a.categories.join(", ")} · reviewed {a.lastReviewed}</span>
              </td>
              <td className="pr-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.published ? "bg-ok/10 text-ok" : "bg-sand text-muted"}`}>{a.published ? "Published" : "Hidden"}</span>
                {a.featured && <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-ink">Featured</span>}
              </td>
              <td className="py-2">
                <span className="flex flex-wrap justify-end gap-1">
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => quick(a, { published: !a.published }, `${a.title}: ${a.published ? "unpublished" : "published"}`)}>
                    {a.published ? "Unpublish" : "Publish"}<span className="sr-only"> {a.title}</span>
                  </button>
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => quick(a, { featured: !a.featured }, `${a.title}: ${a.featured ? "no longer featured" : "featured"}`)}>
                    {a.featured ? "Unfeature" : "Feature"}<span className="sr-only"> {a.title}</span>
                  </button>
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => { setFields({}); setIsNew(false); setEditing(a); }}>
                    Edit<span className="sr-only"> {a.title}</span>
                  </button>
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1 text-alert" onClick={() => remove(a)}>
                    Delete<span className="sr-only"> {a.title}</span>
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="rounded-2xl bg-limestone p-6 text-center text-muted">No activities match.</p>}
      {pages > 1 && (
        <nav aria-label="Activity pages" className="mt-4 flex items-center justify-between text-sm">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </nav>
      )}

      {editing && (
        <form onSubmit={save} noValidate className="card mt-6 grid gap-4 p-6 md:grid-cols-2" aria-label={isNew ? "New bucket-list activity" : `Edit ${editing.title}`}>
          <h3 className="text-2xl md:col-span-2">{isNew ? "New activity" : `Edit: ${editing.title}`}</h3>
          <div className="field">
            <label htmlFor="bk-id">ID (url-safe)</label>
            <input id="bk-id" name="id" required defaultValue={editing.id} readOnly={!isNew} className="input" aria-invalid={!!fields.id} />
            {err("id")}
          </div>
          <div className="field">
            <label htmlFor="bk-title">Title</label>
            <input id="bk-title" name="title" required defaultValue={editing.title} className="input" aria-invalid={!!fields.title} />
            {err("title")}
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="bk-desc">Description</label>
            <textarea id="bk-desc" name="description" rows={2} defaultValue={editing.description} className="input" aria-invalid={!!fields.description} />
            {err("description")}
          </div>
          <div className="field">
            <label htmlFor="bk-dest">Destination</label>
            <select id="bk-dest" name="destination" defaultValue={editing.destination ?? ""} className="input">
              <option value="">Not a single destination (describe the place)</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bk-place">Place (if no destination)</label>
            <input id="bk-place" name="place" defaultValue={editing.place ?? ""} className="input" aria-invalid={!!fields.place} />
            {err("place")}
          </div>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-semibold text-midnight">Categories</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUCKET_CATS.map((c) => (
                <label key={c} className="chip cursor-pointer !min-h-9 text-sm capitalize">
                  <input type="checkbox" name="categories" value={c} defaultChecked={editing.categories.includes(c)} className="sr-only" />
                  {c.replace("-", " ")}
                </label>
              ))}
            </div>
            {err("categories")}
          </fieldset>
          <div className="field">
            <label htmlFor="bk-effort">Effort</label>
            <select id="bk-effort" name="effort" defaultValue={editing.effort} className="input">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bk-duration">Duration</label>
            <input id="bk-duration" name="duration" defaultValue={editing.duration} className="input" aria-invalid={!!fields.duration} placeholder="e.g. Half day" />
            {err("duration")}
          </div>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-semibold text-midnight">Best months (typical weather)</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MONTH_SHORT.map((m, i) => (
                <label key={m} className="chip cursor-pointer !min-h-9 !px-3 text-sm">
                  <input type="checkbox" name="months" value={i + 1} defaultChecked={editing.bestMonths.includes(i + 1)} className="sr-only" />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field md:col-span-2">
            <label htmlFor="bk-season">Seasonal note (optional)</label>
            <input id="bk-season" name="seasonNote" defaultValue={editing.season?.note ?? ""} className="input" />
            <label className="mt-2 flex items-center gap-2 text-sm font-normal">
              <input type="checkbox" name="seasonVerified" defaultChecked={editing.season?.verified} className="h-4 w-4" /> Verified against an official source
            </label>
            {err("season")}
          </div>
          <div className="field">
            <label htmlFor="bk-ssrc">Season source name</label>
            <input id="bk-ssrc" name="seasonSource" defaultValue={editing.season?.source?.name ?? ""} className="input" />
          </div>
          <div className="field">
            <label htmlFor="bk-surl">Season source link (https)</label>
            <input id="bk-surl" name="seasonUrl" type="url" defaultValue={editing.season?.source?.url ?? ""} className="input" />
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="bk-tips">Practical tips (one per line, up to 5)</label>
            <textarea id="bk-tips" name="tips" rows={3} defaultValue={editing.tips.join("\n")} className="input" />
          </div>
          <div className="field">
            <label htmlFor="bk-photo">Photo</label>
            <select id="bk-photo" name="photo" defaultValue={editing.photo ?? ""} className="input">
              <option value="">No photo</option>
              {photoKeys.map((p) => <option key={p.key} value={p.key}>{p.alt}</option>)}
            </select>
            {err("photo")}
          </div>
          <div className="field">
            <label htmlFor="bk-link">Link inside the site (optional)</label>
            <input id="bk-link" name="linkHref" defaultValue={editing.link?.href ?? ""} className="input" placeholder="/taste" />
            <label htmlFor="bk-linklabel" className="sr-only">Link label</label>
            <input id="bk-linklabel" name="linkLabel" defaultValue={editing.link?.label ?? ""} className="input mt-2" placeholder="Link label" />
            {err("link.href")}
          </div>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={editing.published} className="h-4 w-4" /> Published (visible to visitors)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={editing.featured} className="h-4 w-4" /> Featured</label>
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn btn-primary">{isNew ? "Create activity" : "Save changes"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
