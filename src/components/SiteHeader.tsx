"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, UserRound, X } from "lucide-react";
import { NAV } from "@/content/navigation";
import { useMyEgypt } from "@/lib/client-store";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Logo } from "./design";
import { SearchDialog } from "./SearchDialog";

/** Whether a visitor is signed in (Supabase only). Follows sign-in and sign-out in any tab. */
function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    sb.auth.getSession().then(({ data }: { data: { session: unknown } }) => setSignedIn(!!data.session));
    const sub = sb.auth.onAuthStateChange((_e: string, session: unknown) => setSignedIn(!!session));
    return () => sub.data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export function SiteHeader() {
  const path = usePathname();
  const signedIn = useSignedIn();
  const accountLabel = signedIn ? "My account" : "Sign in";
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { stamps, favourites } = useMyEgypt();
  const navRef = useRef<HTMLElement>(null);
  const overHero = path === "/" && !scrolled && !mobile;
  const count = stamps.length + favourites.length;

  useEffect(() => {
    setMobile(false);
    setMenu(null);
  }, [path]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobile(false);
      }
      const typing = e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName);
      if (((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [searchOpen]);

  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const pill = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
      active ? (overHero ? "bg-gold-300 text-midnight" : "bg-midnight text-ivory") : "hover:bg-current/10"
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-500 ${
        overHero ? "on-dark bg-gradient-to-b from-night/60 to-transparent text-ivory" : "bg-ivory/95 text-midnight shadow-[0_1px_0_rgb(15_27_45/0.08)] backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="shrink-0">
          <Logo tone={overHero ? "light" : "dark"} />
          <span className="sr-only"> — home</span>
        </Link>

        <nav ref={navRef} aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            <li>
              <Link href="/" aria-current={path === "/" ? "page" : undefined} className={pill(path === "/")}>
                Home
              </Link>
            </li>
            {NAV.map((g) => {
              const open = menu === g.label;
              const id = `menu-${g.label.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <li key={g.label} className="relative" onMouseLeave={() => open && setMenu(null)}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() => setMenu(open ? null : g.label)}
                    onMouseEnter={() => setMenu(g.label)}
                    className={pill(isActive(g.href))}
                  >
                    {g.label}
                    <ChevronDown aria-hidden="true" size={15} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div id={id} hidden={!open} className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-3">
                    <ul className="rounded-2xl bg-ivory p-2 text-midnight shadow-[var(--shadow-lift)] ring-1 ring-sand">
                      <li>
                        <Link href={g.href} className="block rounded-xl px-4 py-3 font-display text-lg hover:bg-limestone">
                          {g.label} overview
                        </Link>
                      </li>
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="block rounded-xl px-4 py-2.5 hover:bg-limestone" onClick={() => setMenu(null)}>
                            <span className="block text-sm font-semibold">{l.label}</span>
                            {l.hint && <span className="block text-xs text-muted">{l.hint}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
            <li>
              <Link href="/my-egypt" aria-current={isActive("/my-egypt") ? "page" : undefined} className={pill(isActive("/my-egypt"))}>
                My Egypt
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-gold px-1.5 text-[11px] font-bold text-midnight">
                    {count}
                    <span className="sr-only"> saved items and stamps</span>
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setSearchOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-current/10" aria-keyshortcuts="Control+K /">
            <Search aria-hidden="true" size={20} strokeWidth={1.75} />
            <span className="sr-only">Search the site</span>
          </button>
          <Link href="/account" className={`btn btn-sm hidden sm:inline-flex ${overHero ? "btn-outline-light" : "btn-ghost"}`}>
            <UserRound aria-hidden="true" size={16} strokeWidth={1.75} />
            {accountLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-current/10 xl:hidden"
            aria-expanded={mobile}
            aria-controls="mobile-nav"
            onClick={() => setMobile((v) => !v)}
          >
            <span className="sr-only">{mobile ? "Close menu" : "Open menu"}</span>
            {mobile ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>

      {mobile && (
        <nav id="mobile-nav" aria-label="Main mobile" className="max-h-[calc(100svh-5rem)] overflow-y-auto border-t border-sand bg-ivory px-5 pb-8 text-midnight xl:hidden">
          <ul className="py-2">
            {[{ label: "Home", href: "/", links: [] }, ...NAV, { label: "My Egypt", href: "/my-egypt", links: [] }].map((g) => (
              <li key={g.href} className="border-b border-sand/60">
                <Link href={g.href} aria-current={path === g.href ? "page" : undefined} className="font-display block py-4 text-2xl">
                  {g.label}
                </Link>
                {g.links.length > 0 && (
                  <ul className="grid grid-cols-2 gap-x-4 pb-4">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="block py-1.5 text-sm text-muted">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <Link href="/account" className="btn btn-primary mt-6 w-full sm:hidden">
            <UserRound aria-hidden="true" size={16} /> {accountLabel}
          </Link>
        </nav>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
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
