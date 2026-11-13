"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Captions, Download, ExternalLink, Play, ShieldCheck } from "lucide-react";
import { MEDIA_FILES, type MediaChapter, type MediaItem, type TranscriptLine } from "@/content/media";

export function clock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Index of the entry whose window [start, next start) contains t. */
export function activeIndex(list: { start: number }[], t: number) {
  let lo = 0, hi = list.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

export function MediaPlayer({ item }: { item: MediaItem }) {
  return item.kind === "original" ? <OriginalPlayer item={item} /> : <YouTubePlayer item={item} />;
}

/* ---------------- Our own films: native <video> with captions, chapters and a live transcript ---------------- */
function OriginalPlayer({ item }: { item: MediaItem }) {
  const files = MEDIA_FILES(item.id);
  const video = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [failed, setFailed] = useState(false);

  // Some browsers ignore `default` on dynamically rendered tracks; make sure captions start on.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const on = () => {
      for (const tr of Array.from(v.textTracks)) if (tr.kind === "captions") tr.mode = "showing";
    };
    on();
    v.textTracks.addEventListener?.("addtrack", on);
    return () => v.textTracks.removeEventListener?.("addtrack", on);
  }, []);

  const seek = useCallback((s: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = s + 0.01;
    void v.play().catch(() => undefined);
    v.focus({ preventScroll: true });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="overflow-hidden rounded-[1.25rem] bg-night shadow-[var(--shadow-lift)]">
          {failed ? (
            <div role="alert" className="flex aspect-video items-center justify-center p-8 text-center text-ivory">
              This video could not be loaded. The transcript beside it has the full content.
            </div>
          ) : (
            <video
              ref={video}
              controls
              playsInline
              preload="metadata"
              poster={files.poster}
              className="aspect-video w-full bg-night"
              onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
              onError={() => setFailed(true)}
              aria-describedby={`${item.id}-note`}
              data-testid="media-video"
            >
              <source src={files.src} type="video/mp4" />
              <track kind="captions" srcLang="en" label="English" src={files.captions} default />
              <track kind="chapters" srcLang="en" label="Chapters" src={files.chapters} />
            </video>
          )}
        </div>
        <p id={`${item.id}-note`} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Captions aria-hidden="true" size={16} /> No narration — captions carry the story and are on by default.
          </span>
          <a href={files.captions} download className="inline-flex items-center gap-1 font-semibold text-nile underline underline-offset-4">
            <Download aria-hidden="true" size={14} /> Captions (.vtt)
          </a>
        </p>
        <Chapters chapters={item.chapters} t={t} onSeek={seek} />
      </div>
      <Transcript lines={item.transcript} t={t} onSeek={seek} live />
    </div>
  );
}

function Chapters({ chapters, t, onSeek }: { chapters: MediaChapter[]; t: number; onSeek: (s: number) => void }) {
  if (!chapters.length) return null;
  const cur = activeIndex(chapters, t);
  return (
    <nav aria-labelledby="chapters-h" className="mt-8">
      <h2 id="chapters-h" className="text-2xl">
        Chapters
      </h2>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {chapters.map((c, i) => (
          <li key={c.start}>
            <button
              type="button"
              onClick={() => onSeek(c.start)}
              aria-current={i === cur ? "true" : undefined}
              className="flex w-full items-baseline gap-3 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-gold aria-[current=true]:border-gold aria-[current=true]:bg-gold-200/30"
            >
              <span className="w-12 shrink-0 font-mono text-sm text-muted">{clock(c.start)}</span>
              <span className="font-medium">
                <span className="sr-only">Play from </span>
                {c.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Transcript({ lines, t, onSeek, live }: { lines: TranscriptLine[]; t: number; onSeek?: (s: number) => void; live?: boolean }) {
  const [follow, setFollow] = useState(true);
  const box = useRef<HTMLOListElement>(null);
  const cur = live ? activeIndex(lines, t) : -1;

  useEffect(() => {
    if (!follow || cur < 0 || !box.current) return;
    const el = box.current.children[cur] as HTMLElement | undefined;
    if (!el) return;
    // Scroll only inside the panel so the page never jumps.
    const top = el.offsetTop - box.current.clientHeight / 3;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.current.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [cur, follow]);

  const text = useMemo(() => lines.map((l) => `[${clock(l.start)}] ${l.text}`).join("\n"), [lines]);
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    setHref(url);
    return () => URL.revokeObjectURL(url);
  }, [text]);

  return (
    <section aria-labelledby="transcript-h" className="card flex max-h-[34rem] flex-col p-5 lg:max-h-[40rem]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="transcript-h" className="text-2xl">
          Transcript
        </h2>
        {live && (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
            Follow along
          </label>
        )}
      </div>
      {lines.length ? (
        <>
          <ol ref={box} className="relative mt-4 flex-1 space-y-1 overflow-y-auto pr-1" tabIndex={0} aria-label="Transcript lines">
            {lines.map((l, i) => (
              <li key={`${l.start}-${i}`}>
                {onSeek ? (
                  <button
                    type="button"
                    onClick={() => onSeek(l.start)}
                    aria-current={i === cur ? "true" : undefined}
                    className="flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-[0.95rem] leading-relaxed hover:bg-limestone aria-[current=true]:bg-gold-200/40"
                  >
                    <span className="w-11 shrink-0 pt-0.5 font-mono text-xs text-muted">{clock(l.start)}</span>
                    <span>{l.text}</span>
                  </button>
                ) : (
                  <p className="flex gap-3 px-2 py-1.5 text-[0.95rem] leading-relaxed">
                    <span className="w-11 shrink-0 pt-0.5 font-mono text-xs text-muted">{clock(l.start)}</span>
                    <span>{l.text}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
          {href && (
            <a href={href} download="transcript.txt" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-nile underline underline-offset-4">
              <Download aria-hidden="true" size={14} /> Download transcript (.txt)
            </a>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">No transcript has been added for this video yet. Captions may be available in the player.</p>
      )}
    </section>
  );
}

/* ---------------- Other people's videos: embedded from the creator's channel, click to load ---------------- */
function YouTubePlayer({ item }: { item: MediaItem }) {
  const [start, setStart] = useState<number | null>(null);
  const id = item.youtubeId!;
  const src = start == null ? null : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&cc_load_policy=1&rel=0&start=${Math.floor(start)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="overflow-hidden rounded-[1.25rem] bg-night shadow-[var(--shadow-lift)]">
          {src ? (
            <iframe
              key={src}
              src={src}
              title={item.title}
              className="aspect-video w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          ) : (
            <div className="on-dark relative flex aspect-video flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_30%_20%,#2a2f45,transparent_60%),linear-gradient(135deg,#0a1220,#2a1d14)] p-6 text-center text-ivory">
              <p className="eyebrow !text-gold-300">{item.channel}</p>
              <p className="max-w-lg font-display text-2xl !text-ivory md:text-3xl">{item.title}</p>
              <button type="button" onClick={() => setStart(0)} className="btn btn-gold">
                <Play aria-hidden="true" size={18} /> Load video from YouTube
              </button>
              <p className="flex max-w-md items-start gap-2 text-left text-xs text-ivory/75">
                <ShieldCheck aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
                Nothing loads from YouTube until you press play. It then plays in YouTube&apos;s privacy-enhanced mode with captions on where the creator provides them.
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {item.captionsNote && (
            <span className="inline-flex items-center gap-1.5">
              <Captions aria-hidden="true" size={16} /> {item.captionsNote}
            </span>
          )}
          <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-nile underline underline-offset-4">
            Watch on YouTube <ExternalLink aria-hidden="true" size={14} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
        <Chapters chapters={item.chapters} t={start ?? -1} onSeek={(s) => setStart(s)} />
      </div>
      <Transcript lines={item.transcript} t={0} />
    </div>
  );
}
