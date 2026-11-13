"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GROUPS, signs, type Sign } from "@/content/hieroglyphs";
import { Glyph, SignDialog } from "./SignDetail";

export function SignLibrary() {
  const [group, setGroup] = useState<Sign["group"] | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return signs.filter(
      (s) =>
        (group === "all" || s.group === group) &&
        (!t || [s.gardiner, s.depicts, s.value, s.meaning, s.say].some((v) => v?.toLowerCase().includes(t))),
    );
  }, [group, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter signs">
          {[{ id: "all" as const, title: "All signs" }, ...GROUPS].map((g) => (
            <button key={g.id} type="button" aria-pressed={group === g.id} onClick={() => setGroup(g.id)} className="chip">
              {g.title}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search signs</span>
          <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Owl, life, G17, nfr…" className="input !pl-10" type="search" />
        </label>
      </div>
      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {list.length} of {signs.length} signs
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.map((s) => (
          <li key={s.gardiner}>
            <button
              type="button"
              onClick={() => setOpen(s.gardiner)}
              className="group flex h-full w-full flex-col items-center rounded-2xl bg-white p-4 text-center shadow-[var(--shadow-soft)] ring-1 ring-transparent transition hover:-translate-y-0.5 hover:ring-gold"
            >
              <Glyph code={s.gardiner} className="text-5xl text-midnight transition-colors group-hover:text-gold-ink" />
              <span className="mt-3 text-[11px] font-bold tracking-wider text-gold-ink">{s.gardiner}</span>
              <span className="mt-0.5 text-sm font-semibold text-midnight">{s.depicts.split(" — ")[0]}</span>
              <span className="text-xs text-muted">{s.value ? <em>{s.value}</em> : s.meaning?.split(";")[0]}</span>
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-6 rounded-2xl bg-limestone p-6 text-center text-muted">No signs match. Try a sound like “m” or a word like “sun”.</p>}
      <SignDialog code={open} onClose={() => setOpen(null)} />
    </div>
  );
}
