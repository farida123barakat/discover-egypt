"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Camera, ImagePlus, LocateFixed, Trash2 } from "lucide-react";
import { challenges, challengeById } from "@/content/hunt";
import { destinations } from "@/content/destinations";
import { nearestRegion } from "@/lib/geo";
import { CAPTION_MAX, getMemory, newId, PhotoError, processPhoto, saveMemory, STORY_MAX, TEMPLATES, type Memory, type TemplateId } from "@/lib/memories";
import { TEMPLATE_INFO } from "@/lib/postcard";
import { PostcardPreview } from "./PostcardPreview";

const SWATCH: Record<TemplateId, string> = {
  "golden-hour": "linear-gradient(90deg,#b5733d 0 60%,#f3e9d6 60%)",
  papyrus: "repeating-linear-gradient(0deg,#dcc48f 0 6px,#cfb47c 6px 8px)",
  nile: "linear-gradient(135deg,#123f58,#0b2433)",
  "cairo-night": "radial-gradient(circle at 70% 30%,#c9a35a33,#0a1220 60%)",
  desert: "linear-gradient(180deg,#f6e3bf,#d2a86a)",
};

const today = () => new Date().toISOString().slice(0, 10);

export function MemoryEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const [draft, setDraft] = useState<Memory | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  // Start from an existing memory (edit) or a fresh one, pre-filled from the challenge.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (editId) {
        try {
          const m = await getMemory(editId);
          if (!alive) return;
          if (m) setDraft(m);
          else setMsg({ text: "That memory could not be found on this device.", tone: "error" });
        } catch {
          if (alive) setMsg({ text: "Your browser is blocking storage, so memories can't be saved here. Private browsing often does this.", tone: "error" });
        }
        return;
      }
      const ch = challengeById(params.get("challenge"));
      const now = new Date().toISOString();
      setDraft({ id: newId(), challengeId: ch?.id ?? null, destination: ch?.destination ?? null, visitDate: today(), caption: "", story: "", template: "golden-hour", arabic: true, photo: null, createdAt: now, updatedAt: now });
    })();
    return () => {
      alive = false;
    };
  }, [editId, params]);

  useEffect(() => {
    if (!draft?.photo) return setPhotoUrl(null);
    const u = URL.createObjectURL(draft.photo);
    setPhotoUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [draft?.photo]);

  const preview = useMemo(() => draft, [draft]);
  if (!draft) {
    return msg ? (
      <div role="alert" className="rounded-2xl bg-alert/10 p-6 text-alert">
        {msg.text}{" "}
        <Link href="/memory-hunt/album" className="font-semibold underline">
          Go to my album
        </Link>
      </div>
    ) : (
      <p className="text-muted">Loading…</p>
    );
  }

  const set = <K extends keyof Memory>(k: K, v: Memory[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const challenge = challengeById(draft.challengeId);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, photo: "" }));
    setBusy(true);
    try {
      set("photo", await processPhoto(file));
      setMsg({ text: "Photo added. Its location data was removed on your device.", tone: "ok" });
    } catch (e) {
      setErrors((x) => ({ ...x, photo: e instanceof PhotoError ? e.message : "We couldn't use that photo." }));
    } finally {
      setBusy(false);
    }
  }

  function locate() {
    if (!("geolocation" in navigator)) return setMsg({ text: "Your browser can't share a location. Choose the destination from the list.", tone: "error" });
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const near = nearestRegion(pos.coords.latitude, pos.coords.longitude);
        if (!near) return setMsg({ text: "You don't seem to be near any of our destinations. Choose one from the list.", tone: "error" });
        set("destination", near.destination);
        setMsg({ text: `Set to ${destinations.find((d) => d.slug === near.destination)?.name}. Your exact location was not saved.`, tone: "ok" });
      },
      () => {
        setLocating(false);
        setMsg({ text: "Location wasn't shared — that's fine. Choose the destination from the list.", tone: "error" });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const d = draft!;
    const errs: Record<string, string> = {};
    if (!d.photo && !d.caption.trim() && !d.story.trim()) errs.caption = "Add a photo or write a few words — a memory needs one of them.";
    if (d.caption.length > CAPTION_MAX) errs.caption = `Keep the caption to ${CAPTION_MAX} characters.`;
    if (d.story.length > STORY_MAX) errs.story = `Keep the story to ${STORY_MAX} characters.`;
    if (d.visitDate && (d.visitDate > today() || d.visitDate < "1950-01-01")) errs.visitDate = "Choose a date that isn't in the future.";
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setMsg({ text: "Please fix the highlighted fields.", tone: "error" });
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    setBusy(true);
    try {
      await saveMemory({ ...d, caption: d.caption.trim(), story: d.story.trim(), updatedAt: new Date().toISOString() });
      router.push(`/memory-hunt/album?saved=${d.id}`);
    } catch {
      setBusy(false);
      setMsg({ text: "Your memory couldn't be saved. Your browser may be out of space or blocking storage (private browsing often does this).", tone: "error" });
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-err`} className="field-error" role="alert">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={save} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" aria-label={editId ? "Edit memory" : "New memory"}>
      <div className="space-y-6">
        <div ref={errorSummary} tabIndex={-1} aria-live="polite" className="outline-none">
          {msg && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-midnight">Photo (optional)</legend>
          {photoUrl ? (
            <div className="mt-2 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={photoUrl} alt="Your photo" className="h-24 w-32 rounded-lg object-cover" />
              <button type="button" className="btn btn-ghost" onClick={() => set("photo", null)}>
                <Trash2 aria-hidden="true" size={16} /> Remove photo
              </button>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="btn btn-outline cursor-pointer">
              <Camera aria-hidden="true" size={18} /> Take a photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} aria-describedby="photo-help" />
            </label>
            <label className="btn btn-outline cursor-pointer">
              <ImagePlus aria-hidden="true" size={18} /> Choose a photo
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} aria-describedby="photo-help" data-testid="photo-input" />
            </label>
          </div>
          <p id="photo-help" className="mt-2 text-xs text-muted">
            The camera is only used if you choose it. Photos stay on this device; we remove their location data.
          </p>
          {err("photo")}
        </fieldset>

        <div className="field">
          <label htmlFor="m-challenge">Challenge</label>
          <select id="m-challenge" className="input" value={draft.challengeId ?? ""} onChange={(e) => {
            const c = challengeById(e.target.value);
            setDraft((d) => (d ? { ...d, challengeId: c?.id ?? null, destination: c ? c.destination : d.destination } : d));
          }}>
            <option value="">No challenge — just a memory</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {challenge && <p className="mt-1 text-sm text-muted">{challenge.prompt}</p>}
        </div>

        <div className="field">
          <label htmlFor="m-caption">Caption</label>
          <input id="m-caption" className="input" value={draft.caption} maxLength={CAPTION_MAX + 20} onChange={(e) => set("caption", e.target.value)} aria-invalid={!!errors.caption} aria-describedby={`caption-count${errors.caption ? " caption-err" : ""}`} placeholder="e.g. The first light on the river" />
          <p id="caption-count" className={`mt-1 text-xs ${draft.caption.length > CAPTION_MAX ? "text-alert" : "text-muted"}`}>
            {draft.caption.length} / {CAPTION_MAX} — shown on the front of the postcard
          </p>
          {err("caption")}
        </div>

        <div className="field">
          <label htmlFor="m-story">Your story (optional)</label>
          <textarea id="m-story" className="input" rows={4} value={draft.story} onChange={(e) => set("story", e.target.value)} aria-invalid={!!errors.story} aria-describedby={`story-count${errors.story ? " story-err" : ""}`} placeholder="What happened, who you were with, what you'll remember…" />
          <p id="story-count" className={`mt-1 text-xs ${draft.story.length > STORY_MAX ? "text-alert" : "text-muted"}`}>
            {draft.story.length} / {STORY_MAX} — printed on the back
          </p>
          {err("story")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="m-dest">Destination (optional)</label>
            <select id="m-dest" className="input" value={draft.destination ?? ""} onChange={(e) => set("destination", e.target.value || null)}>
              <option value="">Somewhere in Egypt</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={locate} disabled={locating} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-nile underline underline-offset-4 disabled:opacity-60">
              <LocateFixed aria-hidden="true" size={14} /> {locating ? "Finding the nearest destination…" : "Use my location (optional)"}
            </button>
          </div>
          <div className="field">
            <label htmlFor="m-date">Visit date (optional)</label>
            <input id="m-date" type="date" className="input" max={today()} value={draft.visitDate ?? ""} onChange={(e) => set("visitDate", e.target.value || null)} aria-invalid={!!errors.visitDate} />
            {err("visitDate")}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-midnight">Postcard design</legend>
          <div role="radiogroup" aria-label="Postcard design" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={draft.template === t} onClick={() => set("template", t)} className="rounded-xl border-2 border-line p-2 text-left transition-colors hover:border-gold aria-checked:border-gold aria-checked:bg-gold-200/30">
                <span aria-hidden="true" className="block h-12 rounded-md" style={{ background: SWATCH[t] }} />
                <span className="mt-2 block text-sm font-semibold">{TEMPLATE_INFO[t].name}</span>
                <span className="block text-xs text-muted">{TEMPLATE_INFO[t].mood}</span>
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.arabic} onChange={(e) => set("arabic", e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
            Add Arabic calligraphy: <span className="arabic text-base" lang="ar" dir="rtl">ذكريات من مصر</span> <span className="text-muted">(“Memories from Egypt”)</span>
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Working…" : editId ? "Save changes" : "Save to my album"}
          </button>
          <Link href={editId ? "/memory-hunt/album" : "/memory-hunt"} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-muted">Saved privately on this device. Nothing is uploaded unless you choose to back up, share or print.</p>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">Live preview</p>
        <PostcardPreview memory={preview!} className="mt-3" />
        <p className="mt-3 text-sm text-muted">Print size: 148 × 105 mm postcard (A6), with a 3 mm bleed. The back carries your story.</p>
      </div>
    </form>
  );
}
