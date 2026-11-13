"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { glyph, signByCode, SIGN_SOURCES, type Sign } from "@/content/hieroglyphs";

export const KIND_LABEL: Record<Sign["kind"], string> = {
  uniliteral: "Sound sign — one consonant",
  biliteral: "Sound sign — two consonants",
  triliteral: "Sound sign — three consonants",
  logogram: "Word sign",
  determinative: "Determinative (silent)",
};

export function Glyph({ code, className = "" }: { code: string; className?: string }) {
  const s = signByCode(code);
  if (!s) return null;
  return (
    <span lang="egy" className={`font-hiero leading-none ${className}`} aria-hidden="true">
      {glyph(s)}
    </span>
  );
}

export function SignFacts({ s }: { s: Sign }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      <Fact term="What it shows">{s.depicts}</Fact>
      <Fact term="Type">{KIND_LABEL[s.kind]}</Fact>
      {s.value && (
        <Fact term="Transliteration">
          <span className="font-display text-xl italic">{s.value}</span>
        </Fact>
      )}
      {s.say && <Fact term="Say it like">{s.say}</Fact>}
      {s.meaning && <Fact term="Meaning as a word">{s.meaning}</Fact>}
      <Fact term="How it is used">{s.usage}</Fact>
      {s.example && (
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Example</dt>
          <dd className="mt-2 flex flex-wrap items-center gap-4 rounded-2xl bg-limestone p-4">
            <span className="flex gap-1 text-4xl text-midnight">
              {s.example.signs.map((c, i) => (
                <Glyph key={i} code={c} />
              ))}
            </span>
            <span>
              <strong>{s.example.word}</strong> · <em>{s.example.translit}</em>
              <span className="block text-sm text-muted">{s.example.gloss}</span>
            </span>
          </dd>
          {s.example.signs.length === 1 && s.example.signs[0] === s.gardiner && (
            <p className="mt-2 text-xs text-muted">Shows only the sign itself; the full name uses more signs.</p>
          )}
        </div>
      )}
    </dl>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{term}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

export function SignDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const s = code ? signByCode(code) : null;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (s && !d.open) d.showModal();
    if (!s && d.open) d.close();
  }, [s]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sign-title"
      className="m-auto w-[min(720px,calc(100vw-2rem))] rounded-3xl bg-ivory p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-night/60 backdrop:backdrop-blur-sm"
    >
      {s && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="on-dark relative flex items-center gap-6 bg-midnight px-7 py-8 text-ivory">
            <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-ivory/5 text-7xl text-gold-200 ring-1 ring-gold/30">
              <Glyph code={s.gardiner} />
            </span>
            <div>
              <p className="eyebrow">Gardiner {s.gardiner} · U+{s.cp}</p>
              <h2 id="sign-title" className="mt-2 text-3xl !text-ivory">
                {s.depicts}
              </h2>
              {s.value && <p className="mt-1 font-display text-xl italic text-gold-200">{s.value}</p>}
            </div>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ivory/10">
              <X aria-hidden="true" size={20} />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="space-y-6 p-7">
            <SignFacts s={s} />
            <details className="rounded-2xl border border-sand p-4 text-sm">
              <summary className="cursor-pointer font-semibold">Sources and review status</summary>
              <p className="mt-2 text-muted">
                Status: <strong>{s.review.status === "specialist-reviewed" ? "Reviewed by a specialist" : "Editorial draft — awaiting review by an Egyptologist"}</strong>, last reviewed {s.review.lastReviewed}.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {SIGN_SOURCES.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-nile underline">
                      {src.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}
    </dialog>
  );
}
