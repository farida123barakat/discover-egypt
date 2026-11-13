"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, MapPin, Search, Utensils, FileText } from "lucide-react";
import { buildIndex, search, type SearchItem } from "@/lib/search";

const ICON = { Destination: MapPin, Dish: Utensils, Page: FileText } as const;
const SUGGESTED = ["Luxor", "Diving", "Koshari", "Emergency", "Budget"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const results: SearchItem[] = useMemo(() => search(index, q), [index, q]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  function go(item?: SearchItem) {
    if (!item) return;
    onClose();
    router.push(item.href);
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="search-title"
      className="m-auto mt-[12vh] w-[min(640px,calc(100vw-2rem))] rounded-3xl bg-ivory p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-night/60 backdrop:backdrop-blur-sm"
    >
      <h2 id="search-title" className="sr-only">
        Search Discover Egypt
      </h2>
      <div className="flex items-center gap-3 border-b border-sand px-5">
        <Search aria-hidden="true" size={20} className="text-muted" />
        <label htmlFor="site-search" className="sr-only">
          Search destinations, dishes and guides
        </label>
        <input
          ref={input}
          id="site-search"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${active}` : undefined}
          placeholder="Search destinations, dishes, guides…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[active]);
            }
          }}
          className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded-md border border-sand-deep px-2 py-0.5 text-xs text-muted sm:block">Esc</kbd>
      </div>

      <div className="max-h-[55vh] overflow-y-auto p-3">
        {q && results.length === 0 && <p className="px-3 py-6 text-center text-muted">No matches for &ldquo;{q}&rdquo;. Try a place, a dish or a topic.</p>}
        {!q && (
          <div className="px-3 py-4">
            <p className="eyebrow">Try</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul id="search-results" role="listbox" aria-label="Search results">
          {results.map((r, i) => {
            const Icon = ICON[r.kind];
            return (
              <li key={r.href + r.title} id={`sr-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={r.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(r);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${i === active ? "bg-limestone" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gold-ink">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-midnight">{r.title}</span>
                    <span className="block truncate text-xs text-muted">{r.kind}</span>
                  </span>
                  {i === active && <CornerDownLeft aria-hidden="true" size={16} className="text-muted" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
