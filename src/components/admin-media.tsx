"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatDuration, publishBlockers, type MediaItem } from "@/content/media";
import { parseTimedLines } from "@/lib/validation";

async function send(url: string, method: "POST" | "DELETE", body: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  return { ok: r.ok, error: d.error, fields: d.fields ?? {} };
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function toSeconds(v: string): number | null | "bad" {
  const t = v.trim();
  if (!t) return null;
  const m = t.match(/^(?:(\d{1,2}):)?(\d{1,3}):(\d{2})$/);
  if (!m || Number(m[3]) > 59) return "bad";
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}
/** Strip server-managed fields before sending an item back. */
function payload(m: MediaItem) {
  const { provenance: _p, createdAt: _c, lastReviewed: _l, reviewer: _r, ...rest } = m;
  void _p;
  void _c;
  void _l;
  void _r;
  return rest;
}

export function MediaManager({ items, destinations, explainers }: { items: MediaItem[]; destinations: { slug: string; name: string }[]; explainers: { id: string; title: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [kind, setKind] = useState<MediaItem["kind"]>("youtube");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const shown = items.filter((m) => filter === "all" || m.status === filter);

  function blank(): MediaItem {
    const today = new Date().toISOString().slice(0, 10);
    return { id: "", title: "", summary: "", kind: "youtube", destinations: [], period: "", durationSec: null, credit: "", license: "Standard YouTube licence — embedded from the creator's channel, not re-uploaded", chapters: [], transcript: [], sources: [], status: "draft", featured: false, provenance: "curated-embed", lastReviewed: null, createdAt: today };
  }
  function open(m: MediaItem, fresh: boolean) {
    setFields({});
    setIsNew(fresh);
    setKind(m.kind);
    setEditing(m);
  }

  async function quick(m: MediaItem, change: Partial<MediaItem>, label: string) {
    const r = await send("/api/admin/media", "POST", payload({ ...m, ...change }));
    setMsg({ text: r.ok ? label : r.error ?? "Update failed", ok: r.ok });
    if (r.ok) router.refresh();
  }
  async function remove(m: MediaItem) {
    if (!confirm(`Delete “${m.title}”? This cannot be undone.`)) return;
    const r = await send("/api/admin/media", "DELETE", { id: m.id });
    setMsg({ text: r.ok ? `Deleted: ${m.title}` : r.error ?? "Delete failed", ok: r.ok });
    if (r.ok) router.refresh();
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const local: Record<string, string> = {};
    const dur = kind === "original" ? editing?.durationSec ?? null : toSeconds(String(fd.get("duration") ?? ""));
    if (dur === "bad") local.durationSec = "Use minutes:seconds, like 12:30";
    const chapters = kind === "youtube" ? parseTimedLines(String(fd.get("chapters") ?? "")) : [];
    if ("error" in chapters) local.chapters = chapters.error;
    const transcript = kind === "youtube" ? parseTimedLines(String(fd.get("transcript") ?? "")) : [];
    if ("error" in transcript) local.transcript = transcript.error;
    const sources: { name: string; url: string }[] = [];
    for (const [i, line] of String(fd.get("sources") ?? "").split("\n").entries()) {
      if (!line.trim()) continue;
      const [name, url] = line.split("|").map((x) => x.trim());
      if (!name || !url) local.sources = `Line ${i + 1}: write it as Name | https://link`;
      else sources.push({ name, url });
    }
    if (Object.keys(local).length) {
      setFields(local);
      setMsg({ text: "Please fix the highlighted fields.", ok: false });
      return;
    }
    const body = {
      id: String(fd.get("id") ?? "").trim(),
      kind,
      explainerId: kind === "original" ? String(fd.get("explainerId") ?? "") : undefined,
      youtubeId: kind === "youtube" ? String(fd.get("youtubeId") ?? "").trim() || undefined : undefined,
      channel: kind === "youtube" ? String(fd.get("channel") ?? "") : undefined,
      captionsNote: kind === "youtube" ? String(fd.get("captionsNote") ?? "") : undefined,
      title: String(fd.get("title") ?? ""),
      summary: String(fd.get("summary") ?? ""),
      destinations: fd.getAll("destinations").map(String),
      period: String(fd.get("period") ?? ""),
      durationSec: dur,
      credit: String(fd.get("credit") ?? ""),
      license: String(fd.get("license") ?? ""),
      chapters: Array.isArray(chapters) ? chapters.map((c) => ({ start: c.start, title: c.text })) : [],
      transcript: Array.isArray(transcript) ? transcript : [],
      sources,
      status: String(fd.get("status")) === "published" ? "published" : "draft",
      featured: fd.get("featured") === "on",
    };
    const r = await send("/api/admin/media", "POST", body);
    setFields(r.fields);
    setMsg({ text: r.ok ? `${isNew ? "Added" : "Saved"}: ${body.title}` : r.error ?? "Save failed", ok: r.ok });
    if (r.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  const err = (k: string) => (fields[k] ? <p className="field-error" role="alert">{fields[k]}</p> : null);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="field">
          <label htmlFor="md-filter">Show</label>
          <select id="md-filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => open(blank(), true)}>
          Add a video
        </button>
      </div>
      <p aria-live="polite" className={`mt-3 min-h-6 text-sm font-semibold ${msg?.ok === false ? "text-alert" : "text-ok"}`}>{msg?.text}</p>

      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Watch &amp; discover videos</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2">Video</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {shown.map((m) => {
            const blockers = publishBlockers(m);
            return (
              <tr key={m.id} className="border-t border-sand align-top">
                <td className="py-3 pr-3">
                  <strong>{m.title}</strong>
                  <span className="block text-xs text-muted">
                    {m.kind === "original" ? "Original film" : `YouTube · ${m.channel ?? "unknown channel"}`} · {formatDuration(m.durationSec)} · {m.destinations.join(", ")}
                  </span>
                  {m.status === "draft" && blockers.length > 0 && <span className="mt-1 block text-xs text-alert">Before publishing: {blockers.join(" ")}</span>}
                </td>
                <td className="py-3 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.status === "published" ? "bg-ok/10 text-ok" : "bg-sand text-muted"}`}>{m.status === "published" ? "Published" : "Draft"}</span>
                  {m.featured && <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-ink">Featured</span>}
                </td>
                <td className="py-2">
                  <span className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost !min-h-9 !py-1"
                      disabled={m.status === "draft" && blockers.length > 0}
                      onClick={() => quick(m, { status: m.status === "published" ? "draft" : "published" }, `${m.title}: ${m.status === "published" ? "back to draft" : "published"}`)}
                    >
                      {m.status === "published" ? "Unpublish" : "Publish"}
                      <span className="sr-only"> {m.title}</span>
                    </button>
                    <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => quick(m, { featured: !m.featured }, `${m.title}: ${m.featured ? "no longer featured" : "featured"}`)}>
                      {m.featured ? "Unfeature" : "Feature"}
                      <span className="sr-only"> {m.title}</span>
                    </button>
                    <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => open(m, false)}>
                      Edit<span className="sr-only"> {m.title}</span>
                    </button>
                    <button type="button" className="btn btn-ghost !min-h-9 !py-1 text-alert" onClick={() => remove(m)}>
                      Delete<span className="sr-only"> {m.title}</span>
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {shown.length === 0 && <p className="rounded-2xl bg-limestone p-6 text-center text-muted">No videos here.</p>}

      {editing && (
        <form onSubmit={save} noValidate className="card mt-6 grid gap-4 p-6 md:grid-cols-2" aria-label={isNew ? "Add a video" : `Edit ${editing.title}`}>
          <h3 className="text-2xl md:col-span-2">{isNew ? "Add a video" : `Edit: ${editing.title}`}</h3>
          <p className="text-sm text-muted md:col-span-2">
            Only embed videos from the creator&apos;s own channel. Never upload someone else&apos;s video. Watch it in full and check its facts before publishing.
          </p>
          <div className="field">
            <label htmlFor="md-id">ID (url-safe)</label>
            <input id="md-id" name="id" required defaultValue={editing.id} readOnly={!isNew} className="input" aria-invalid={!!fields.id} />
            {err("id")}
          </div>
          <div className="field">
            <label htmlFor="md-kind">Type</label>
            <select id="md-kind" value={kind} onChange={(e) => setKind(e.target.value as MediaItem["kind"])} disabled={!isNew} className="input">
              <option value="youtube">Embedded YouTube video</option>
              <option value="original">Original film (from an explainer script)</option>
            </select>
          </div>
          {kind === "original" ? (
            <div className="field md:col-span-2">
              <label htmlFor="md-exp">Explainer script</label>
              <select id="md-exp" name="explainerId" defaultValue={editing.explainerId ?? explainers[0]?.id} className="input" aria-invalid={!!fields.explainerId}>
                {explainers.map((x) => (
                  <option key={x.id} value={x.id}>{x.title}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">Captions, transcript, chapters and length come from the script. Render it with scripts/render-explainers.ts.</p>
              {err("explainerId")}
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="md-yt">YouTube video id</label>
                <input id="md-yt" name="youtubeId" defaultValue={editing.youtubeId ?? ""} className="input" placeholder="11 characters, e.g. dQw4w9WgXcQ" aria-invalid={!!fields.youtubeId} />
                {err("youtubeId")}
              </div>
              <div className="field">
                <label htmlFor="md-ch">Channel (who published it)</label>
                <input id="md-ch" name="channel" defaultValue={editing.channel ?? ""} className="input" />
              </div>
              <div className="field md:col-span-2">
                <label htmlFor="md-cc">Captions</label>
                <input id="md-cc" name="captionsNote" defaultValue={editing.captionsNote ?? ""} className="input" placeholder="e.g. Creator's English captions on YouTube" />
              </div>
            </>
          )}
          <div className="field md:col-span-2">
            <label htmlFor="md-title">Title</label>
            <input id="md-title" name="title" required defaultValue={editing.title} className="input" aria-invalid={!!fields.title} />
            {err("title")}
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="md-summary">Summary</label>
            <textarea id="md-summary" name="summary" rows={2} defaultValue={editing.summary} className="input" aria-invalid={!!fields.summary} />
            {err("summary")}
          </div>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-semibold text-midnight">Destinations</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {destinations.map((d) => (
                <label key={d.slug} className="chip cursor-pointer !min-h-9 text-sm">
                  <input type="checkbox" name="destinations" value={d.slug} defaultChecked={editing.destinations.includes(d.slug)} className="sr-only" />
                  {d.name}
                </label>
              ))}
            </div>
            {err("destinations")}
          </fieldset>
          <div className="field">
            <label htmlFor="md-period">Period</label>
            <input id="md-period" name="period" defaultValue={editing.period} className="input" placeholder="e.g. New Kingdom, 18th Dynasty" aria-invalid={!!fields.period} />
            {err("period")}
          </div>
          <div className="field">
            <label htmlFor="md-dur">Length (minutes:seconds)</label>
            <input id="md-dur" name="duration" defaultValue={editing.durationSec != null ? clock(editing.durationSec) : ""} readOnly={kind === "original"} className="input" placeholder="12:30" aria-invalid={!!fields.durationSec} />
            {err("durationSec")}
          </div>
          <div className="field">
            <label htmlFor="md-credit">Credit</label>
            <input id="md-credit" name="credit" defaultValue={editing.credit} className="input" aria-invalid={!!fields.credit} />
            {err("credit")}
          </div>
          <div className="field">
            <label htmlFor="md-lic">Licence</label>
            <input id="md-lic" name="license" defaultValue={editing.license} className="input" aria-invalid={!!fields.license} />
            {err("license")}
          </div>
          {kind === "youtube" && (
            <>
              <div className="field md:col-span-2">
                <label htmlFor="md-chap">Chapters (one per line: 0:00 Title)</label>
                <textarea id="md-chap" name="chapters" rows={4} defaultValue={editing.chapters.map((c) => `${clock(c.start)} ${c.title}`).join("\n")} className="input font-mono text-sm" aria-invalid={!!fields.chapters} />
                {err("chapters")}
              </div>
              <div className="field md:col-span-2">
                <label htmlFor="md-tr">Transcript (one line per caption: 0:00 Text)</label>
                <textarea id="md-tr" name="transcript" rows={5} defaultValue={editing.transcript.map((c) => `${clock(c.start)} ${c.text}`).join("\n")} className="input font-mono text-sm" aria-invalid={!!fields.transcript} />
                <p className="mt-1 text-xs text-muted">Only paste a transcript you have the right to publish, such as the creator&apos;s own.</p>
                {err("transcript")}
              </div>
            </>
          )}
          <div className="field md:col-span-2">
            <label htmlFor="md-src">Sources (one per line: Name | https://link)</label>
            <textarea id="md-src" name="sources" rows={3} defaultValue={editing.sources.map((s) => `${s.name} | ${s.url}`).join("\n")} className="input text-sm" aria-invalid={!!fields.sources} />
            {err("sources")}
          </div>
          <div className="field">
            <label htmlFor="md-status">Status</label>
            <select id="md-status" name="status" defaultValue={editing.status} className="input" aria-invalid={!!fields.status}>
              <option value="draft">Draft (hidden from visitors)</option>
              <option value="published">Published</option>
            </select>
            {err("status")}
          </div>
          <label className="flex items-center gap-2 self-end pb-3">
            <input type="checkbox" name="featured" defaultChecked={editing.featured} className="h-4 w-4" /> Featured
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn btn-primary">{isNew ? "Add video" : "Save changes"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
