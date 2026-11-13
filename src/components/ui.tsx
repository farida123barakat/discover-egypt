"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { photo as getPhoto, type PhotoKey } from "@/content/images";
import type { Status } from "@/content/practical";

/* ---------- Photo with graceful fallback ---------- */
export function Photo({
  k,
  className = "",
  sizes,
  priority = false,
  label,
}: {
  k: PhotoKey | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  label?: string;
}) {
  const p = getPhoto(k);
  const [failed, setFailed] = useState(false);
  if (!p || failed) {
    return (
      <div
        role="img"
        aria-label={label ? `${label} — photo coming soon` : "Photo coming soon"}
        className={`grain flex items-start bg-gradient-to-br from-sand via-limestone to-sand-deep ${className}`}
      >
        <span className="m-4 rounded-full bg-ivory/80 px-3 py-1 text-xs font-medium text-muted">Licensed photo coming soon</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized Commons thumbnails; see next.config.ts
    <img
      src={p.src}
      srcSet={p.srcSet}
      alt={p.alt}
      sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

/* ---------- Entrance animation (respects reduced motion) ---------- */
/**
 * Reduced-motion preference, read only after hydration so server and client render the same markup.
 * Motion itself is already toned down globally by <MotionConfig reducedMotion="user">.
 */
export function usePrefersReducedMotion() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(reduce);
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Animated counter ---------- */
export function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) return setN(to);
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to]);
  return (
    <div>
      <span ref={ref} className="font-display block text-5xl text-midnight md:text-6xl" aria-hidden="true">
        {n.toLocaleString("en-GB")}
        {suffix}
      </span>
      <span className="sr-only">
        {to.toLocaleString("en-GB")}
        {suffix}
      </span>
      <span className="mt-2 block text-sm text-muted">{label}</span>
    </div>
  );
}

/* ---------- Verification badge ---------- */
export function StatusBadge({ status, lastVerified, source }: { status: Status; lastVerified?: string | null; source?: { name: string; url: string } }) {
  const styles: Record<Status, string> = {
    verified: "bg-ok/10 text-ok",
    estimate: "bg-gold/15 text-gold-ink",
    awaiting: "bg-alert/10 text-alert",
  };
  const label: Record<Status, string> = { verified: "Verified", estimate: "Estimate", awaiting: "Awaiting verification" };
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={`rounded-full px-2.5 py-1 font-semibold ${styles[status]}`}>{label[status]}</span>
      {lastVerified && <span className="text-muted">Last checked {formatDate(lastVerified)}</span>}
      {source && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-nile underline underline-offset-2">
          Source<span className="sr-only">: {source.name} (opens in a new tab)</span>
        </a>
      )}
    </span>
  );
}

export function formatDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function SectionHeading({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro?: string; id?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-4xl md:text-5xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
    </div>
  );
}

/* ---------- Live region for feedback ---------- */
export function Toast({ message, tone = "ok" }: { message: string | null; tone?: "ok" | "error" }) {
  return (
    <div aria-live="polite" role="status" className="min-h-6">
      {message && (
        <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{message}</p>
      )}
    </div>
  );
}
