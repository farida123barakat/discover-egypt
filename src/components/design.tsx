/**
 * Design-system building blocks (see docs/DESIGN.md).
 * Server-safe: no hooks, so these render on the server and ship no JS.
 */
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { photo as getPhoto, type PhotoKey } from "@/content/images";
import { Photo } from "./ui";

/** Original mark: the sun on the horizon above the Nile. */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const ink = tone === "light" ? "text-ivory" : "text-midnight";
  return (
    <span className={`flex items-center gap-3 ${ink}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="text-gold">
        <circle cx="20" cy="17" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M20 4.5v3M9.5 9l2 2M30.5 9l-2 2M5 17h3M32 17h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 26.5h32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 31c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 5-1.6 7.5 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className="block text-[10px] font-semibold tracking-[0.34em]">DISCOVER</span>{" "}
        <span className="font-display block text-[1.6rem] font-medium tracking-[0.06em]" style={{ color: "inherit" }}>
          EGYPT
        </span>
      </span>
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  id,
  action,
  tone = "dark",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  id?: string;
  action?: { href: string; label: string };
  tone?: "dark" | "light";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <span aria-hidden="true" className="mb-5 block h-0.5 w-12 bg-gold" />
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className={`mt-3 text-4xl md:text-5xl ${tone === "light" ? "!text-ivory" : ""}`}>
          {title}
        </h2>
        {intro && <p className={`mt-4 text-lg ${tone === "light" ? "text-ivory/80" : "text-muted"}`}>{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`btn ${tone === "light" ? "btn-outline-light" : "btn-primary"}`}>
          {action.label} <ArrowRight aria-hidden="true" size={16} />
        </Link>
      )}
    </div>
  );
}

/** Full-bleed photo card with pin, name and tagline (homepage rail, listings). */
export function PhotoCard({ href, photo, title, subtitle, className = "", aspect = "aspect-[4/5]" }: { href: string; photo: PhotoKey | null; title: string; subtitle?: string; className?: string; aspect?: string }) {
  const p = getPhoto(photo);
  return (
    <Link href={href} className={`photo-zoom group relative block overflow-hidden rounded-[1.25rem] bg-midnight shadow-[var(--shadow-soft)] ${aspect} ${className}`}>
      {p ? (
        // eslint-disable-next-line @next/next/no-img-element -- Commons thumbnails with srcset
        <img src={p.src} srcSet={p.srcSet} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 80vw" alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="grain absolute inset-0 bg-gradient-to-br from-sand to-sand-deep" />
      )}
      <span className="photo-scrim absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-5 text-ivory">
        <span className="flex items-center gap-1.5 font-display text-2xl !text-ivory">
          <MapPin aria-hidden="true" size={18} strokeWidth={1.75} className="text-gold-300" />
          {title}
        </span>
        {subtitle && <span className="mt-1 block text-sm text-ivory/85">{subtitle}</span>}
      </span>
    </Link>
  );
}

export type Feature = { href: string; label: string; sub: string; icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }> };

/** Dark strip of feature shortcuts with gold line icons. */
export function FeatureStrip({ items, label }: { items: Feature[]; label: string }) {
  return (
    <nav aria-label={label} className="on-dark bg-night text-ivory">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:grid-cols-3 md:px-8 lg:grid-cols-6">
        {items.map(({ href, label: l, sub, icon: Icon }, i) => (
          <li key={href} className={`border-ivory/10 ${i % 2 ? "" : "border-r"} sm:border-r lg:[&:nth-child(6)]:border-r-0`}>
            <Link href={href} className="group flex items-center gap-4 px-3 py-6 transition-colors hover:bg-ivory/5 md:px-5">
              <Icon aria-hidden={true} size={30} strokeWidth={1.25} className="shrink-0 text-gold transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="text-sm leading-tight">
                <span className="block font-semibold">{l}</span>
                <span className="block text-ivory/70">{sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Credit({ k, className = "" }: { k: PhotoKey; className?: string }) {
  const p = getPhoto(k);
  if (!p) return null;
  return (
    <a href={p.sourcePage} target="_blank" rel="noopener noreferrer" className={`text-[11px] text-ivory/70 hover:text-ivory ${className}`}>
      Photo: {p.author} · {p.license}
      <span className="sr-only"> (opens Wikimedia Commons in a new tab)</span>
    </a>
  );
}

/**
 * Photo header for a page: the photo darkened behind ivory text, the same pattern as Discover.
 * The scrim keeps text contrast above 4.5:1 whatever the photo.
 */
export function PhotoHero({
  k,
  eyebrow,
  title,
  intro,
  children,
}: {
  k: PhotoKey;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-midnight pb-16 pt-36 text-ivory md:pb-20 md:pt-40">
      <Photo k={k} priority sizes="100vw" className="absolute inset-0 -z-10 h-full w-full opacity-55" />
      <div className="photo-scrim absolute inset-0 -z-10 bg-gradient-to-t from-midnight via-midnight/70 to-midnight/25" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-5xl !text-ivory md:text-7xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg text-ivory/85">{intro}</p>}
        {children}
      </div>
      <Credit k={k} className="absolute bottom-3 right-4" />
    </section>
  );
}

/** A strip of captioned photos between sections. Captions come from each photo's alt text. */
export function PhotoStrip({ keys, className = "" }: { keys: PhotoKey[]; className?: string }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 ${keys.length > 2 ? "lg:grid-cols-3" : ""} ${className}`}>
      {keys.map((k) => {
        const p = getPhoto(k);
        if (!p) return null;
        return (
          <li key={k}>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-sand">
                <Photo k={k} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0 h-full w-full" />
              </div>
              <figcaption className="mt-2 text-sm text-muted">
                {p.alt}.{" "}
                <a href={p.sourcePage} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-xs underline-offset-2 hover:underline">
                  Photo: {p.author} · {p.license}
                  <span className="sr-only"> (opens Wikimedia Commons in a new tab)</span>
                </a>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
