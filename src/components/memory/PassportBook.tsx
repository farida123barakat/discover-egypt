"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import type { Memory } from "@/lib/memories";
import { closePhotos, drawPassportPage, loadPhotos, type PhotoMap } from "@/lib/passport";
import { describePage, planPassport, spreads, type PassportPage } from "@/lib/passport-plan";
import { download } from "@/lib/postcard-export";
import { loadPostcardFonts } from "@/lib/postcard";

const NAME_KEY = "discover-egypt-passport-name";

function readName() {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

/** One page of the booklet, drawn with the same renderer as the PDF. */
function PageCanvas({ page, index, memories, photos, label }: { page: PassportPage; index: number; memories: Memory[]; photos: PhotoMap | null; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!photos || !ref.current) return;
    let alive = true;
    const t = setTimeout(async () => {
      await loadPostcardFonts();
      if (alive && ref.current) {
        drawPassportPage(ref.current, page, index, memories, photos);
        setReady(true);
      }
    }, 60);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [page, index, memories, photos]);
  return (
    <div className="relative aspect-[94/131] w-full overflow-hidden bg-[#f6efe2]">
      <canvas ref={ref} role="img" aria-label={label} className={`h-full w-full transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`} data-testid="passport-page" data-ready={ready} data-kind={page.kind} />
    </div>
  );
}

export function PassportBook({ memories }: { memories: Memory[] }) {
  const [name, setName] = useState("");
  const [at, setAt] = useState(0);
  const [photos, setPhotos] = useState<PhotoMap | null>(null);
  const [busy, setBusy] = useState<"booklet" | "pages" | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  useEffect(() => setName(readName()), []);
  useEffect(() => {
    let alive = true;
    let loaded: PhotoMap | null = null;
    void loadPhotos(memories).then((m) => {
      if (alive) {
        loaded = m;
        setPhotos(m);
      } else closePhotos(m);
    });
    return () => {
      alive = false;
      if (loaded) closePhotos(loaded);
    };
  }, [memories]);

  const plan = useMemo(() => planPassport(memories, { name }), [memories, name]);
  const views = useMemo(() => spreads(plan.pages.length), [plan.pages.length]);
  const view = views[Math.min(at, views.length - 1)] ?? [0];

  function saveName(v: string) {
    setName(v);
    try {
      window.localStorage.setItem(NAME_KEY, v.slice(0, 40));
    } catch {
      /* storage blocked: the name still works for this download */
    }
  }

  async function get(layout: "booklet" | "pages") {
    setBusy(layout);
    setMsg(null);
    try {
      const { passportFileName, passportPdf } = await import("@/lib/passport-export");
      download(await passportPdf(memories, { name, layout }), passportFileName(layout));
      setMsg({ text: layout === "booklet" ? "Your passport booklet has been downloaded. See the printing steps below." : "Your print-shop pages have been downloaded.", tone: "ok" });
    } catch {
      setMsg({ text: "We couldn't make the passport PDF. Please try again.", tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  const range = view.length === 2 ? `Pages ${view[0] + 1}–${view[1] + 1}` : `Page ${view[0] + 1}`;

  return (
    <section aria-labelledby="pp-book-h" className="overflow-hidden rounded-[1.75rem] bg-midnight text-ivory on-dark" data-testid="passport-book">
      <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center">
        <div>
          <p className="eyebrow">Print it like a passport</p>
          <h2 id="pp-book-h" className="font-display mt-3 text-4xl !text-ivory md:text-5xl">
            Your Memory Passport
          </h2>
          <p className="mt-3 text-ivory/80">
            Every memory becomes an ink stamp, each photo gets its own page, and your achievements are sealed in gold. {plan.pages.length} pages at passport size (88 × 125 mm).
          </p>
          <div className="field mt-6">
            <label htmlFor="pp-name" className="!text-ivory">
              Name in your passport (optional)
            </label>
            <input id="pp-name" className="input" value={name} maxLength={40} onChange={(e) => saveName(e.target.value)} placeholder="Leave blank to write it by hand" autoComplete="name" aria-describedby="pp-name-help" />
            <p id="pp-name-help" className="mt-1 text-xs text-ivory/70">
              Kept only on this device and printed on the traveller page.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" disabled={!!busy} aria-busy={busy === "booklet"} onClick={() => get("booklet")}>
              <Printer aria-hidden="true" size={16} /> {busy === "booklet" ? "Binding your passport…" : "Download booklet (A4, fold & staple)"}
            </button>
            <button type="button" className="btn btn-outline-light" disabled={!!busy} aria-busy={busy === "pages"} onClick={() => get("pages")}>
              <Download aria-hidden="true" size={16} /> {busy === "pages" ? "Preparing…" : "Pages for a print shop"}
            </button>
          </div>
          <div aria-live="polite" className="min-h-6">
            {msg && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/20 text-ivory" : "bg-alert/20 text-ivory"}`}>{msg.text}</p>}
          </div>
          <details className="mt-4 rounded-xl border border-ivory/15 p-4 text-sm">
            <summary className="cursor-pointer font-semibold">
              <BookOpen aria-hidden="true" size={14} className="mr-1 inline" /> How to print and bind the booklet
            </summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-ivory/85">
              <li>Print on A4, double-sided, <strong>flip on short edge</strong>, at <strong>actual size (100%)</strong>, not &ldquo;fit to page&rdquo;.</li>
              <li>Keep the sheets in order and stack them, first sheet on the outside.</li>
              <li>Trim along the corner marks, fold in half along the dotted fold marks, and staple twice on the fold.</li>
            </ol>
            <p className="mt-3 text-ivory/70">&ldquo;Pages for a print shop&rdquo; gives one page per sheet with 3 mm bleed, for professional booklet printing.</p>
          </details>
        </div>

        <div>
          <div className={`mx-auto grid gap-0 shadow-[0_30px_60px_rgb(0_0_0/0.45)] ${view.length === 2 ? "max-w-[640px] grid-cols-2" : "max-w-[320px] grid-cols-1"}`} aria-live="polite">
            {view.map((i) => (
              <div key={i} className={view.length === 2 ? (i === view[0] ? "border-r border-black/20" : "") : ""}>
                <PageCanvas page={plan.pages[i]} index={i} memories={memories} photos={photos} label={`Page ${i + 1} of ${plan.pages.length}. ${describePage(plan.pages[i], memories)}`} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setAt((a) => Math.max(0, a - 1))} disabled={at === 0}>
              <ChevronLeft aria-hidden="true" size={16} /> Previous
            </button>
            <p className="min-w-36 text-center text-sm" role="status" data-testid="passport-range">
              {range} of {plan.pages.length}
            </p>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setAt((a) => Math.min(views.length - 1, a + 1))} disabled={at >= views.length - 1}>
              Next <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
