"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brush, Check, Eraser, RefreshCw, Trophy, X } from "lucide-react";
import { glyph, nameToSigns, signByCode, signs, type Sign } from "@/content/hieroglyphs";
import { extract, rank } from "@/lib/glyph-recognition";
import { loadReferences } from "@/lib/glyph-browser";
import { Glyph } from "./SignDetail";

/* ---------------- Quiz ---------------- */
type Q = { kind: "sound" | "meaning" | "find"; sign: Sign; options: string[]; answer: string; prompt: string };

function shuffle<T>(a: T[], rnd = Math.random) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function buildQuiz(n = 8, rnd = Math.random): Q[] {
  const sound = signs.filter((s) => s.kind === "uniliteral");
  const meaning = signs.filter((s) => s.meaning && s.kind !== "uniliteral");
  const qs: Q[] = [];
  for (const s of shuffle(signs, rnd)) {
    if (qs.length >= n) break;
    const kind = qs.length % 3 === 0 ? "find" : s.kind === "uniliteral" ? "sound" : s.meaning ? "meaning" : "find";
    if (kind === "sound") {
      const opts = shuffle([s.value!, ...shuffle(sound.filter((x) => x !== s), rnd).slice(0, 3).map((x) => x.value!)], rnd);
      qs.push({ kind, sign: s, options: opts, answer: s.value!, prompt: "Which sound does this sign stand for?" });
    } else if (kind === "meaning") {
      const opts = shuffle([s.meaning!, ...shuffle(meaning.filter((x) => x !== s), rnd).slice(0, 3).map((x) => x.meaning!)], rnd);
      qs.push({ kind, sign: s, options: opts, answer: s.meaning!, prompt: "What does this sign mean as a word?" });
    } else {
      const opts = shuffle([s.gardiner, ...shuffle(signs.filter((x) => x !== s), rnd).slice(0, 3).map((x) => x.gardiner)], rnd);
      qs.push({ kind, sign: s, options: opts, answer: s.gardiner, prompt: `Which sign shows: ${s.depicts.split(" — ")[0].toLowerCase()}?` });
    }
  }
  return qs;
}

export function Quiz() {
  const [seed, setSeed] = useState(0);
  const [qs, setQs] = useState<Q[]>([]);
  useEffect(() => setQs(buildQuiz()), [seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q = qs[i];
  const done = qs.length > 0 && i >= qs.length;

  function choose(o: string) {
    if (picked) return;
    setPicked(o);
    if (o === q.answer) setScore((s) => s + 1);
  }
  function next() {
    setPicked(null);
    setI((x) => x + 1);
  }
  function restart() {
    setI(0);
    setScore(0);
    setPicked(null);
    setSeed((s) => s + 1);
  }

  if (!qs.length) return <div className="h-80 animate-pulse rounded-[1.5rem] bg-white" />;
  if (done)
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <Trophy aria-hidden="true" size={40} strokeWidth={1.4} className="text-gold" />
        <p className="mt-4 font-display text-4xl text-midnight">
          {score} / {qs.length}
        </p>
        <p className="mt-2 text-muted">{score === qs.length ? "A scribe in the making." : score >= qs.length / 2 ? "Well read! Try another round." : "Every scribe started somewhere. Have another go."}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={restart}>
          <RefreshCw aria-hidden="true" size={16} /> New round
        </button>
      </div>
    );

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Question {i + 1} of {qs.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-sand">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(i / qs.length) * 100}%` }} />
      </div>
      <p className="mt-6 font-display text-2xl text-midnight">{q.prompt}</p>
      {q.kind !== "find" && (
        <p className="mt-4 flex justify-center">
          <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-limestone text-7xl text-midnight">
            <Glyph code={q.sign.gardiner} />
          </span>
          <span className="sr-only">Sign {q.sign.gardiner}</span>
        </p>
      )}
      <div className={`mt-6 grid gap-3 ${q.kind === "find" ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2"}`} role="group" aria-label="Answers">
        {q.options.map((o) => {
          const right = picked && o === q.answer;
          const wrong = picked === o && o !== q.answer;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              aria-disabled={!!picked}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-center transition ${
                right ? "border-ok bg-ok/10 text-ok" : wrong ? "border-alert bg-alert/10 text-alert" : "border-sand hover:border-gold"
              }`}
            >
              {q.kind === "find" ? (
                <>
                  <Glyph code={o} className="text-5xl text-midnight" />
                  <span className="sr-only">Sign {o}</span>
                </>
              ) : q.kind === "sound" ? (
                <span className="font-display text-2xl italic">{o}</span>
              ) : (
                <span>{o}</span>
              )}
              {right && <Check aria-hidden="true" size={18} />}
              {wrong && <X aria-hidden="true" size={18} />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-5 min-h-[3rem]">
        {picked && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-limestone p-4">
            <p className="text-sm">
              <strong>{picked === q.answer ? "Correct!" : "Not quite."}</strong> <Glyph code={q.sign.gardiner} className="mx-1 text-2xl" /> {q.sign.gardiner} shows {q.sign.depicts.split(" — ")[0].toLowerCase()}
              {q.sign.value ? `, read ${q.sign.value}` : ""}
              {q.sign.meaning ? ` — “${q.sign.meaning}”` : ""}.
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={next} autoFocus>
              {i + 1 === qs.length ? "See score" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Draw-the-sign challenge (uses the recogniser) ---------------- */
const DRAWABLE = ["D21", "N35", "X1", "N5", "S34", "O1", "N1", "V30", "D46", "Q3", "O4", "Z4"];

export function DrawChallenge() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [target, setTarget] = useState(DRAWABLE[0]);
  const [verdict, setVerdict] = useState<{ ok: boolean; guess: string; close: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const s = signByCode(target)!;

  useEffect(() => {
    setTarget(DRAWABLE[Math.floor(Math.random() * DRAWABLE.length)]);
  }, []);

  function clear() {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setVerdict(null);
    setHasInk(false);
  }
  useEffect(clear, [target]);

  function pos(e: React.PointerEvent) {
    const c = canvas.current!,
      r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height] as const;
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const ctx = canvas.current!.getContext("2d")!;
    const [x, y] = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    style(ctx);
    ctx.stroke();
    setHasInk(true);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const [x, y] = pos(e);
    ctx.lineTo(x, y);
    style(ctx);
    ctx.stroke();
  }
  function style(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "#0f1b2d";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  async function check() {
    setBusy(true);
    const refs = (await loadReferences()).filter((r) => DRAWABLE.includes(r.code));
    const c = canvas.current!;
    const e = extract(c.getContext("2d")!.getImageData(0, 0, c.width, c.height), false);
    setBusy(false);
    if (!e) return setVerdict({ ok: false, guess: "", close: false });
    const m = rank(e.f, refs, 3);
    setVerdict({ ok: m[0].code === target, guess: m[0].code, close: m.slice(1).some((x) => x.code === target) });
  }

  return (
    <div className="card grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
      <div>
        <canvas
          ref={canvas}
          width={280}
          height={280}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          className="h-[280px] w-[280px] touch-none rounded-2xl bg-white ring-2 ring-sand"
          aria-label={`Drawing area. Draw the sign: ${s.depicts}.`}
          role="img"
        />
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            <Eraser aria-hidden="true" size={15} /> Clear
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={check} disabled={!hasInk || busy}>
            <Brush aria-hidden="true" size={15} /> {busy ? "Checking…" : "Check my drawing"}
          </button>
        </div>
      </div>
      <div>
        <p className="eyebrow">Recognition challenge</p>
        <p className="mt-2 font-display text-3xl text-midnight">Draw the {s.depicts.split(" — ")[0].toLowerCase()}</p>
        <p className="mt-1 text-muted">
          Sound <em>{s.value ?? "—"}</em>
          {s.meaning ? ` · meaning “${s.meaning}”` : ""}. Use the reference if you need it.
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-nile">Show the reference sign</summary>
          <Glyph code={target} className="mt-3 block text-6xl text-midnight" />
        </details>
        <div aria-live="polite" className="mt-5 min-h-[4rem]">
          {verdict &&
            (verdict.ok ? (
              <p className="rounded-2xl bg-ok/10 p-4 text-ok">
                <strong>Recognised!</strong> The computer agrees: that&rsquo;s {target}.
              </p>
            ) : verdict.guess ? (
              <p className="rounded-2xl bg-gold/15 p-4 text-gold-ink">
                {verdict.close ? "Close — it was a second guess. " : "Hmm. "}
                It looks more like <Glyph code={verdict.guess} className="mx-1 text-2xl" /> ({signByCode(verdict.guess)!.depicts.split(" — ")[0].toLowerCase()}) to the computer. Try bolder lines.
              </p>
            ) : (
              <p className="rounded-2xl bg-alert/10 p-4 text-alert">Draw a bit bigger, then check again.</p>
            ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setTarget(DRAWABLE[(DRAWABLE.indexOf(target) + 1 + Math.floor(Math.random() * (DRAWABLE.length - 1))) % DRAWABLE.length])}>
          <RefreshCw aria-hidden="true" size={15} /> Another sign
        </button>
      </div>
    </div>
  );
}

/* ---------------- Your name in a cartouche ---------------- */
export function NameCartouche() {
  const [name, setName] = useState("");
  const out = useMemo(() => nameToSigns(name.slice(0, 16)), [name]);
  return (
    <div className="card grid gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
      <div>
        <label htmlFor="cartouche-name" className="font-display text-2xl text-midnight">
          Your name, in hieroglyphs
        </label>
        <input id="cartouche-name" className="input mt-4" maxLength={16} value={name} onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z ]/g, ""))} placeholder="Type your first name" autoComplete="given-name" />
        <p className="mt-3 text-sm text-muted">A modern, playful spelling using sound signs. Ancient scribes didn&rsquo;t write vowels this way — this is not how a real Egyptian would have written your name.</p>
      </div>
      <div className="flex min-h-40 items-center justify-center rounded-2xl bg-midnight p-6 on-dark">
        {out.length ? (
          <div className="flex items-stretch" aria-label={`Hieroglyph spelling: ${out.map((s) => s.gardiner).join(", ")}`} role="img">
            <div className="flex items-center gap-1 rounded-full border-[3px] border-gold-300 px-6 py-4 text-5xl text-gold-200">
              {out.map((s, i) => (
                <span key={i} className="font-hiero" aria-hidden="true">
                  {glyph(s)}
                </span>
              ))}
            </div>
            <div aria-hidden="true" className="my-2 ml-1 w-[3px] rounded bg-gold-300" />
          </div>
        ) : (
          <p className="text-ivory/70">Your cartouche appears here.</p>
        )}
      </div>
    </div>
  );
}
