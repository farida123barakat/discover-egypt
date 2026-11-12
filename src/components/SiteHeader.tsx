"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMyEgypt } from "@/lib/client-store";

const NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/plan", label: "Plan" },
  { href: "/experience", label: "Experience" },
  { href: "/travel-smart", label: "Travel Smart" },
  { href: "/community", label: "Ask a Local" },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { stamps, favourites } = useMyEgypt();
  const overHero = path === "/" && !scrolled && !open;

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        overHero ? "on-dark bg-transparent text-ivory" : "bg-ivory/95 text-midnight shadow-[0_1px_0_rgb(15_27_45/0.08)] backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="Discover Egypt — home">
          <span className="font-display text-2xl font-semibold tracking-tight" style={{ color: "inherit" }}>
            Discover Egypt
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-current/10 underline decoration-2 underline-offset-8" : "hover:bg-current/10"}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/my-egypt" className={`btn ${overHero ? "btn-ghost" : "btn-primary"} !min-h-10 !px-4 !py-2 text-sm`}>
            My Egypt
            <span className="rounded-full bg-gold px-2 text-xs text-midnight" aria-label={`${stamps.length} stamps, ${favourites.length} saved`}>
              {stamps.length + favourites.length}
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-current/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main mobile" className="border-t border-sand bg-ivory px-5 pb-6 text-midnight lg:hidden">
          <ul className="flex flex-col py-2">
            {[...NAV, { href: "/my-egypt", label: "My Egypt" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} className="font-display block border-b border-sand/60 py-4 text-2xl">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export function AccessibilityControls() {
  const [text, setText] = useState("normal");
  const [contrast, setContrast] = useState("normal");
  useEffect(() => {
    try {
      setText(localStorage.getItem("de:text") ?? "normal");
      setContrast(localStorage.getItem("de:contrast") ?? "normal");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.text = text;
    document.documentElement.dataset.contrast = contrast;
    try {
      localStorage.setItem("de:text", text);
      localStorage.setItem("de:contrast", contrast);
    } catch {}
  }, [text, contrast]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm" role="group" aria-label="Display settings">
      <span className="font-semibold">Text size</span>
      {[
        ["normal", "A", "Normal text"],
        ["large", "A+", "Large text"],
        ["xlarge", "A++", "Extra large text"],
      ].map(([v, l, aria]) => (
        <button key={v} type="button" aria-pressed={text === v} onClick={() => setText(v)} className="chip !min-h-9 !px-3 !border-sand/50">
          {l}
          <span className="sr-only"> ({aria})</span>
        </button>
      ))}
      <button type="button" aria-pressed={contrast === "high"} onClick={() => setContrast(contrast === "high" ? "normal" : "high")} className="chip !min-h-9 !border-sand/50">
        High contrast
      </button>
    </div>
  );
}
