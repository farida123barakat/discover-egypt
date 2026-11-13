import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { formatDuration, MEDIA_FILES, type MediaItem } from "@/content/media";

/** A film in a list: poster, length, who made it, and a draft label when it isn't reviewed yet. */
export function MediaCard({ item, className = "" }: { item: MediaItem; className?: string }) {
  const draft = item.status !== "published";
  return (
    <Link href={`/watch/${item.id}`} className={`group block ${className}`} data-testid="media-card">
      <div className="photo-zoom relative aspect-video overflow-hidden rounded-[1.25rem] bg-night shadow-[var(--shadow-soft)]">
        {item.kind === "original" ? (
          // eslint-disable-next-line @next/next/no-img-element -- static poster rendered with the film
          <img src={MEDIA_FILES(item.id).poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2a2f45,transparent_60%),linear-gradient(135deg,#0a1220,#2a1d14)]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-midnight transition-transform group-hover:scale-110">
          <Play aria-hidden="true" size={22} className="translate-x-0.5" />
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-night/80 px-2.5 py-1 text-xs font-semibold text-ivory">
          <Clock aria-hidden="true" size={12} /> {formatDuration(item.durationSec)}
        </span>
        <span className="absolute right-3 top-3 flex gap-1.5">
          {draft && <span className="rounded-full bg-[#8a3f14] px-2.5 py-1 text-xs font-semibold text-ivory">Draft · awaiting review</span>}
          <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-xs font-semibold text-midnight">{item.kind === "original" ? "Original" : item.channel}</span>
        </span>
      </div>
      <h3 className="mt-4 text-xl leading-snug group-hover:underline group-hover:underline-offset-4">{item.title}</h3>
      <p className="mt-1 text-sm text-muted">{item.period}</p>
    </Link>
  );
}
