"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloudUpload, Download, FileDown, FileUp, ImageDown, Pencil, Plus, Printer, RotateCcw, Save, Share2, Trash2 } from "lucide-react";
import { challengeById } from "@/content/hunt";
import { deleteAllMemories, deleteMemory, refreshMemories, saveMemory, useMemories, type Memory } from "@/lib/memories";
import { albumPdf, download, fileSlug, placeName, postcardImage, postcardPdf } from "@/lib/postcard-export";
import { formatVisitDate } from "@/lib/postcard";
import { PRINT_STATUS_LABEL, type PrintStatus } from "@/lib/print";
import { supabaseConfigured } from "@/lib/env";
import { loadTickets, removeTicket, saveTickets, type PrintTicket } from "@/lib/print-tickets";
import { Achievements } from "./Hunt";
import { PassportBook } from "./PassportBook";
import { PostcardPreview } from "./PostcardPreview";
import { PrintRequestPanel, usePrintPartners } from "./PrintRequest";
import { Toast } from "../ui";

type Msg = { text: string; tone: "ok" | "error" } | null;

/** An error whose message is written for the visitor; anything else gets the generic failure text. */
class Notice extends Error {}

export function Album() {
  const { status, memories } = useMemories();
  const params = useSearchParams();
  const savedId = params.get("saved");
  const partners = usePrintPartners();
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [printing, setPrinting] = useState<Memory | null>(null);
  const [tickets, setTickets] = useState<PrintTicket[]>([]);

  useEffect(() => setTickets(loadTickets()), []);
  useEffect(() => {
    if (savedId && status === "ready" && memories.some((m) => m.id === savedId)) setMsg({ text: "Memory saved to your album.", tone: "ok" });
  }, [savedId, status, memories]);

  async function run(key: string, fn: () => Promise<void>, failure: string) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setMsg({ text: e instanceof Notice ? e.message : failure, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") return <p className="text-muted">Opening your album…</p>;
  if (status === "unavailable")
    return (
      <div role="alert" className="rounded-2xl bg-alert/10 p-6 text-alert">
        Your browser is blocking storage on this site, so memories can&rsquo;t be saved or shown here. Private browsing often does this. Try a normal window.
      </div>
    );

  const canPrint = !!partners && partners.length > 0;

  return (
    <div className="space-y-16">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/memory-hunt/new" className="btn btn-primary">
            <Plus aria-hidden="true" size={16} /> New memory
          </Link>
          {memories.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={busy === "album"}
              aria-busy={busy === "album"}
              onClick={() =>
                run(
                  "album",
                  async () => {
                    download(await albumPdf(memories), "discover-egypt-my-album.pdf");
                    setMsg({ text: "Your album PDF has been downloaded.", tone: "ok" });
                  },
                  "We couldn't make the album PDF. Please try again.",
                )
              }
            >
              <FileDown aria-hidden="true" size={16} /> {busy === "album" ? "Making your album…" : "Postcard album (A4 PDF)"}
            </button>
          )}
          <Link href="/memory-hunt#challenges" className="btn btn-ghost">
            Find a challenge
          </Link>
        </div>
        <Toast message={msg?.text ?? null} tone={msg?.tone} />
      </div>

      {printing && (
        <PrintRequestPanel
          memory={printing}
          partners={partners ?? []}
          onClose={() => setPrinting(null)}
          onCreated={(t) => {
            setTickets((l) => [t, ...l.filter((x) => x.code !== t.code)]);
          }}
        />
      )}

      {memories.length > 0 && <PassportBook memories={memories} />}

      <section aria-labelledby="mem-h">
        <h2 id="mem-h" className="text-4xl">
          {memories.length} {memories.length === 1 ? "memory" : "memories"}
        </h2>
        {memories.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-limestone p-10 text-center">
            <p className="text-lg">Your album is empty.</p>
            <p className="mt-1 text-muted">Pick a challenge, or save any moment from your trip. Each memory becomes a postcard.</p>
            <Link href="/memory-hunt#challenges" className="btn btn-primary mt-6">
              Browse challenges
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-10 md:grid-cols-2" data-testid="album-list">
            {memories.map((m) => (
              <li key={m.id}>
                <MemoryCard
                  m={m}
                  highlight={m.id === savedId}
                  busy={busy}
                  canPrint={canPrint}
                  onPrint={() => setPrinting(m)}
                  run={run}
                  setMsg={setMsg}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {tickets.length > 0 && (
        <PrintTickets
          tickets={tickets}
          onForget={(code) => {
            const next = removeTicket(loadTickets(), code);
            saveTickets(next);
            setTickets(next);
          }}
        />
      )}

      <section aria-labelledby="alb-ach-h">
        <h2 id="alb-ach-h" className="text-4xl">
          Achievements
        </h2>
        <div className="mt-6">
          <Achievements />
        </div>
      </section>

      <FileBackup memories={memories} setMsg={setMsg} />

      <CloudBackup memories={memories} setMsg={setMsg} />

      {memories.length > 0 && (
        <section aria-labelledby="del-h" className="rounded-2xl border border-line p-6">
          <h2 id="del-h" className="text-2xl">
            Delete everything on this device
          </h2>
          <p className="mt-1 text-sm text-muted">Removes every memory and photo stored in this browser. A cloud backup, if you made one, is not touched; delete it from the backup section above.</p>
          <button
            type="button"
            className="btn btn-ghost mt-4 text-alert"
            onClick={() => {
              if (!confirm(`Delete all ${memories.length} memories from this device? This cannot be undone.`)) return;
              void run(
                "all",
                async () => {
                  await deleteAllMemories();
                  setMsg({ text: "All memories were deleted from this device.", tone: "ok" });
                },
                "Your memories couldn't be deleted. Please try again.",
              );
            }}
          >
            <Trash2 aria-hidden="true" size={16} /> Delete all memories
          </button>
        </section>
      )}
    </div>
  );
}

function MemoryCard({
  m,
  highlight,
  busy,
  canPrint,
  onPrint,
  run,
  setMsg,
}: {
  m: Memory;
  highlight: boolean;
  busy: string | null;
  canPrint: boolean;
  onPrint: () => void;
  run: (key: string, fn: () => Promise<void>, failure: string) => Promise<void>;
  setMsg: (m: Msg) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const ch = challengeById(m.challengeId);
  const place = placeName(m);
  const title = m.caption || ch?.title || `A memory from ${place}`;
  const date = formatVisitDate(m.visitDate);

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "center" });
  }, [highlight]);

  const canShare = typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

  return (
    <article ref={ref} className={`card overflow-hidden ${highlight ? "ring-2 ring-gold" : ""}`} aria-labelledby={`mem-${m.id}`} data-testid="memory-card">
      <PostcardPreview memory={m} eager={false} className="!rounded-none !shadow-none" />
      <div className="p-5">
        <h3 id={`mem-${m.id}`} className="text-2xl leading-snug">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {place}
          {date && ` · ${date}`}
          {ch && ` · Challenge: ${ch.title}`}
          {m.backedUpAt && " · Backed up"}
        </p>
        {m.story && <p className="mt-3 line-clamp-3 text-[0.95rem]">{m.story}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary !min-h-10 !py-2"
            disabled={busy === `pdf:${m.id}`}
            aria-busy={busy === `pdf:${m.id}`}
            onClick={() => run(`pdf:${m.id}`, async () => download(await postcardPdf(m), `${fileSlug(m)}.pdf`), "We couldn't make the PDF. Please try again.")}
          >
            <Download aria-hidden="true" size={16} /> {busy === `pdf:${m.id}` ? "Preparing…" : "Print-ready PDF"}
            <span className="sr-only">: {title}</span>
          </button>
          <button type="button" className="btn btn-ghost !min-h-10 !py-2" onClick={() => run(`img:${m.id}`, async () => download(await postcardImage(m), `${fileSlug(m)}.jpg`), "We couldn't make the image. Please try again.")}>
            <ImageDown aria-hidden="true" size={16} /> Image
            <span className="sr-only">: {title}</span>
          </button>
          {canShare && (
            <button
              type="button"
              className="btn btn-ghost !min-h-10 !py-2"
              onClick={() =>
                run(
                  `share:${m.id}`,
                  async () => {
                    const file = new File([await postcardImage(m)], `${fileSlug(m)}.jpg`, { type: "image/jpeg" });
                    if (!navigator.canShare({ files: [file] })) throw new Notice("Your browser can't share images. Download the image instead.");
                    try {
                      await navigator.share({ files: [file], title: `Postcard from ${place}` });
                    } catch (e) {
                      if (e instanceof DOMException && e.name === "AbortError") return; // the visitor closed the share sheet
                      throw e;
                    }
                  },
                  "Sharing didn't work. Download the image instead.",
                )
              }
            >
              <Share2 aria-hidden="true" size={16} /> Share
              <span className="sr-only">: {title}</span>
            </button>
          )}
          {canPrint && (
            <button type="button" className="btn btn-ghost !min-h-10 !py-2" onClick={onPrint}>
              <Printer aria-hidden="true" size={16} /> Print at a partner
              <span className="sr-only">: {title}</span>
            </button>
          )}
          <Link href={`/memory-hunt/new?id=${m.id}`} className="btn btn-ghost !min-h-10 !py-2">
            <Pencil aria-hidden="true" size={16} /> Edit
            <span className="sr-only">: {title}</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost !min-h-10 !py-2 text-alert"
            onClick={() => {
              if (!confirm(`Delete “${title}” from this device? This cannot be undone.`)) return;
              void run(
                `del:${m.id}`,
                async () => {
                  await deleteMemory(m.id);
                  let cloud = "";
                  if (m.backedUpAt) {
                    try {
                      const { deleteCloudMemory } = await import("@/lib/memory-cloud");
                      await deleteCloudMemory(m.id);
                      cloud = " Its backup was deleted too.";
                    } catch {
                      cloud = " Its cloud backup could not be deleted; sign in and try again from the backup section.";
                    }
                  }
                  setMsg({ text: `Deleted “${title}”.${cloud}`, tone: "ok" });
                },
                "That memory couldn't be deleted. Please try again.",
              );
            }}
          >
            <Trash2 aria-hidden="true" size={16} /> Delete
            <span className="sr-only">: {title}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function PrintTickets({ tickets, onForget }: { tickets: PrintTicket[]; onForget: (code: string) => void }) {
  const [statuses, setStatuses] = useState<Record<string, PrintStatus | "missing">>({});
  useEffect(() => {
    let alive = true;
    for (const t of tickets) {
      fetch(`/api/print/requests/${encodeURIComponent(t.code)}`)
        .then(async (r) => {
          const body = (await r.json().catch(() => null)) as { status?: PrintStatus } | null; // always drain the body
          return r.ok ? (body?.status ?? null) : r.status === 404 ? ("missing" as const) : null;
        })
        .then((s) => alive && s && setStatuses((x) => ({ ...x, [t.code]: s })))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [tickets]);

  return (
    <section aria-labelledby="tk-h">
      <h2 id="tk-h" className="text-4xl">
        Print requests from this device
      </h2>
      <ul className="mt-6 divide-y divide-sand rounded-2xl bg-white px-5">
        {tickets.map((t) => {
          const s = statuses[t.code];
          return (
            <li key={t.code} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>
                <strong className="font-mono tracking-wider">{t.code}</strong> · {t.partnerName}
                <span className="block text-muted">{s === "missing" ? "No longer on our system" : s ? PRINT_STATUS_LABEL[s] : "Checking…"}</span>
              </span>
              <span className="flex gap-2">
                <Link href={`/memory-hunt/print/${encodeURIComponent(t.code)}`} className="btn btn-ghost !min-h-9 !py-1">
                  Details<span className="sr-only"> for {t.code}</span>
                </Link>
                {(s === "missing" || s === "collected" || s === "cancelled" || s === "expired") && (
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => onForget(t.code)}>
                    Remove from list<span className="sr-only"> {t.code}</span>
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Backup as a file the visitor keeps. Works with no accounts or database: save it, then open it
 * on another phone or after clearing the browser. Restoring adds memories; it never overwrites.
 */
function FileBackup({ memories, setMsg }: { memories: Memory[]; setMsg: (m: Msg) => void }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function act(fn: () => Promise<string>) {
    setBusy(true);
    try {
      setMsg({ text: await fn(), tone: "ok" });
    } catch (e) {
      const { AlbumFileError } = await import("@/lib/memory-file");
      setMsg({ text: e instanceof AlbumFileError ? e.message : "Something went wrong. Please try again.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="file-h" className="rounded-2xl bg-limestone p-6 md:p-8" data-testid="file-backup">
      <h2 id="file-h" className="text-2xl">
        Keep a backup file
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Your memories live only in this browser. Save them, photos included, to a file on your device. Open that file here on another phone, or after clearing your browser, to bring them back. The file never leaves your device unless you share it.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || memories.length === 0}
          onClick={() =>
            act(async () => {
              const { albumFileName, albumToJson } = await import("@/lib/memory-file");
              download(new Blob([await albumToJson(memories)], { type: "application/json" }), albumFileName());
              return `Saved ${memories.length} ${memories.length === 1 ? "memory" : "memories"} to a backup file.`;
            })
          }
        >
          <Save aria-hidden="true" size={16} /> {busy ? "Working…" : "Save backup file"}
        </button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => input.current?.click()}>
          <FileUp aria-hidden="true" size={16} /> Restore from a file
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choose an album backup file"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            void act(async () => {
              const { MAX_FILE_BYTES, AlbumFileError, albumFromJson } = await import("@/lib/memory-file");
              if (f.size > MAX_FILE_BYTES) throw new AlbumFileError("That file is too large to be an album backup.");
              const list = albumFromJson(await f.text());
              const have = new Set(memories.map((m) => m.id));
              const fresh = list.filter((m) => !have.has(m.id));
              for (const m of fresh) await saveMemory(m);
              await refreshMemories();
              if (!list.length) throw new AlbumFileError("That backup file has no memories in it.");
              return fresh.length ? `Restored ${fresh.length} ${fresh.length === 1 ? "memory" : "memories"} from your file.` : "Everything in that file is already in your album.";
            });
          }}
        />
      </div>
    </section>
  );
}

/** Optional backup to the visitor's own account (Supabase). Hidden behind a clear explanation when accounts aren't set up. */
function CloudBackup({ memories, setMsg }: { memories: Memory[]; setMsg: (m: Msg) => void }) {
  // supabaseConfigured() reads build-time public settings, so server and browser agree on the first render.
  const [state, setState] = useState<"checking" | "off" | "signed-out" | "signed-in">(() => (supabaseConfigured() ? "checking" : "off"));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    import("@/lib/memory-cloud")
      .then(async ({ cloudUser }) => {
        if (!supabaseConfigured()) return alive && setState("off"); // no accounts: the file backup above is the way
        const u = await cloudUser();
        if (alive) setState(u ? "signed-in" : "signed-out");
      })
      .catch(() => alive && setState("off"));
    return () => {
      alive = false;
    };
  }, []);

  async function act(fn: () => Promise<string>) {
    setBusy(true);
    try {
      setMsg({ text: await fn(), tone: "ok" });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Something went wrong. Please try again.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (state === "off") return null; // front-end only: no accounts, so only the file backup is offered
  return (
    <section aria-labelledby="cloud-h" className="rounded-2xl bg-limestone p-6 md:p-8">
      <h2 id="cloud-h" className="text-2xl">
        Back up to your account (optional)
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Memories live only in this browser, so clearing it or changing phone loses them. A backup copies them, with their photos, to your own account. Only you can see it; our administrators can&rsquo;t.
      </p>
      {state === "checking" && <p className="mt-4 text-sm text-muted">Checking your account…</p>}
      {state === "signed-out" && (
        <p className="mt-4 text-sm">
          <Link href="/account" className="font-semibold text-nile underline underline-offset-4">
            Sign in with your email
          </Link>{" "}
          to back up or restore your memories.
        </p>
      )}
      {state === "signed-in" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || memories.length === 0}
            onClick={() =>
              act(async () => {
                const { backupMemory } = await import("@/lib/memory-cloud");
                const now = new Date().toISOString();
                for (const m of memories) {
                  await backupMemory(m);
                  await saveMemory({ ...m, backedUpAt: now });
                }
                return `${memories.length} ${memories.length === 1 ? "memory" : "memories"} backed up.`;
              })
            }
          >
            <CloudUpload aria-hidden="true" size={16} /> {busy ? "Working…" : "Back up now"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() =>
              act(async () => {
                const { restoreMemories } = await import("@/lib/memory-cloud");
                const list = await restoreMemories();
                const have = new Set(memories.map((m) => m.id));
                const fresh = list.filter((m) => !have.has(m.id));
                for (const m of fresh) await saveMemory(m);
                await refreshMemories();
                return fresh.length ? `Restored ${fresh.length} ${fresh.length === 1 ? "memory" : "memories"} from your backup.` : "Everything in your backup is already on this device.";
              })
            }
          >
            <RotateCcw aria-hidden="true" size={16} /> Restore from backup
          </button>
          <button
            type="button"
            className="btn btn-ghost text-alert"
            disabled={busy}
            onClick={() => {
              if (!confirm("Delete your whole cloud backup? Memories on this device are kept.")) return;
              void act(async () => {
                const { deleteAllCloudMemories } = await import("@/lib/memory-cloud");
                await deleteAllCloudMemories();
                for (const m of memories) if (m.backedUpAt) await saveMemory({ ...m, backedUpAt: null });
                return "Your cloud backup was deleted.";
              });
            }}
          >
            <Trash2 aria-hidden="true" size={16} /> Delete my backup
          </button>
        </div>
      )}
    </section>
  );
}
