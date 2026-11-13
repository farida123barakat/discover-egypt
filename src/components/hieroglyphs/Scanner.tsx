"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AlertTriangle, Camera, CheckCircle2, CircleHelp, ImageUp, Loader2, RotateCcw, RotateCw, ScanSearch, ShieldCheck, Sparkles, X } from "lucide-react";
import { signByCode } from "@/content/hieroglyphs";
import { SIZE, THRESHOLDS, type Verdict } from "@/lib/glyph-recognition";
import { loadReferences, practiceImage, recogniseCanvas } from "@/lib/glyph-browser";
import { Glyph, SignDialog } from "./SignDetail";

type Stage = "start" | "camera" | "edit" | "result";
type Crop = { x: number; y: number; w: number; h: number };
type Ink = "auto" | "dark" | "light";
const MAX = 1400;
const PRACTICE = ["G17", "S34", "D21", "N5", "I9", "G5"];

export function Scanner() {
  const [stage, setStage] = useState<Stage>("start");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [practice, setPractice] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [ink, setInk] = useState<Ink>("auto");
  const [crop, setCrop] = useState<Crop>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(Verdict & { preview?: Float32Array }) | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const work = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const status = useRef<HTMLDivElement>(null);

  // Warm up the reference set in the background.
  useEffect(() => {
    const id = setTimeout(() => void loadReferences(), 800);
    return () => clearTimeout(id);
  }, []);

  // Attach the camera stream after React has rendered the <video> element (avoids a black preview).
  useEffect(() => {
    const v = video.current;
    if (stage !== "camera" || !v || !stream.current) return;
    v.srcObject = stream.current;
    v.play().catch(() => setError("The camera preview could not start. Try again, or upload a photo instead."));
  }, [stage]);

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  function reset() {
    stopCamera();
    setSource(null);
    setResult(null);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInk("auto");
    setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setPractice(false);
    setError(null);
    setStage("start");
  }

  async function startCamera() {
    setError(null);
    if (!window.isSecureContext) return setError("The camera only works on a secure (https) connection. Upload a photo instead.");
    if (!navigator.mediaDevices?.getUserMedia) return setError("This browser can't open the camera. Upload a photo instead.");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      stream.current = s;
      setStage("camera"); // the effect below attaches the stream once the <video> element exists
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. You can allow it in your browser's site settings — or upload a photo instead."
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "No camera was found on this device. Upload a photo instead."
            : name === "NotReadableError"
              ? "The camera is being used by another app. Close it and try again, or upload a photo."
              : "The camera could not be started. Upload a photo instead.",
      );
    }
  }

  function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, MAX / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    stopCamera();
    load(c, false);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPEG, PNG, HEIC or WebP).");
    if (file.size > 25 * 1024 * 1024) return setError("That image is larger than 25 MB. Please choose a smaller one.");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      load(c, false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("This image could not be opened. Try a JPEG or PNG.");
    };
    img.src = url;
  }

  async function usePractice() {
    await loadReferences(); // ensures the font is ready
    load(practiceImage(PRACTICE[Math.floor(Math.random() * PRACTICE.length)]), true);
  }

  function load(c: HTMLCanvasElement, isPractice: boolean) {
    setSource(c);
    setPractice(isPractice);
    setResult(null);
    setError(null);
    setCrop(isPractice ? { x: 0.08, y: 0.08, w: 0.84, h: 0.84 } : { x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
    setStage("edit");
  }

  // Render rotation + brightness/contrast into the working canvas (pixel maths: works in every browser).
  useEffect(() => {
    const c = work.current;
    if (!source || !c) return;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad)),
      sin = Math.abs(Math.sin(rad));
    c.width = Math.round(source.width * cos + source.height * sin);
    c.height = Math.round(source.width * sin + source.height * cos);
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    ctx.restore();
    if (brightness !== 100 || contrast !== 100) {
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const b = brightness / 100,
        k = contrast / 100;
      for (let i = 0; i < img.data.length; i += 4)
        for (let j = 0; j < 3; j++) img.data[i + j] = Math.max(0, Math.min(255, ((img.data[i + j] * b) / 255 - 0.5) * k * 255 + 127.5));
      ctx.putImageData(img, 0, 0);
    }
  }, [source, rotation, brightness, contrast, stage]);

  async function analyse() {
    const c = work.current;
    if (!c) return;
    setBusy(true);
    const out = document.createElement("canvas");
    const sx = Math.round(crop.x * c.width),
      sy = Math.round(crop.y * c.height),
      sw = Math.max(8, Math.round(crop.w * c.width)),
      sh = Math.max(8, Math.round(crop.h * c.height));
    const scale = Math.min(1, 420 / Math.max(sw, sh));
    out.width = Math.round(sw * scale);
    out.height = Math.round(sh * scale);
    out.getContext("2d")!.drawImage(c, sx, sy, sw, sh, 0, 0, out.width, out.height);
    const v = await recogniseCanvas(out, ink === "auto" ? undefined : ink === "light");
    setResult(v);
    setBusy(false);
    setStage("result");
    requestAnimationFrame(() => status.current?.focus());
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] bg-night text-ivory on-dark">
        {stage === "start" && (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-6 p-8 text-center">
            <ScanSearch aria-hidden="true" size={46} strokeWidth={1.25} className="text-gold-300" />
            <div>
              <p className="font-display text-3xl !text-ivory">Point, crop, discover.</p>
              <p className="mx-auto mt-2 max-w-sm text-ivory/75">Photograph one hieroglyph — on a wall, a statue or in a museum — and we&rsquo;ll suggest which sign it is.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="btn btn-gold" onClick={startCamera}>
                <Camera aria-hidden="true" size={18} /> Use camera
              </button>
              <button type="button" className="btn btn-outline-light" onClick={() => fileInput.current?.click()}>
                <ImageUp aria-hidden="true" size={18} /> Upload a photo
              </button>
            </div>
            <button type="button" className="text-sm text-ivory/75 underline underline-offset-4 hover:text-ivory" onClick={usePractice}>
              No inscription nearby? Try a practice image
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        )}

        {stage === "camera" && (
          <div className="relative">
            <video ref={video} playsInline muted className="block max-h-[520px] w-full bg-black object-contain" aria-label="Camera preview" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-dashed border-gold-300/80" />
            <p className="absolute inset-x-0 top-3 text-center text-sm text-ivory/90 [text-shadow:0_1px_6px_#000]">Fit one sign inside the frame</p>
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-night/90 p-5">
              <button type="button" className="btn btn-gold" onClick={capture}>
                <Camera aria-hidden="true" size={18} /> Take photo
              </button>
              <button type="button" className="btn btn-outline-light" onClick={reset}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {(stage === "edit" || stage === "result") && source && (
          <div className="p-4 md:p-6">
            <CropBox crop={crop} onChange={setCrop} disabled={stage === "result"}>
              <canvas ref={work} className="block h-auto max-h-[460px] w-full object-contain" aria-label={practice ? "Practice image" : "Your photo"} role="img" />
            </CropBox>
            {practice && <p className="mt-3 text-xs text-ivory/70">Practice image drawn from a font — not a real inscription.</p>}
          </div>
        )}

        {error && (
          <div role="alert" className="absolute inset-x-4 bottom-4 flex items-start gap-3 rounded-2xl bg-ivory p-4 text-sm text-midnight shadow-[var(--shadow-lift)]">
            <AlertTriangle aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-alert" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} className="shrink-0">
              <X aria-hidden="true" size={16} />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        )}
      </div>

      <div>
        {stage === "edit" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl">Adjust your photo</h3>
              <p className="mt-1 text-sm text-muted">Drag the frame (or use the arrow keys) so it fits tightly around one sign.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRotation((r) => r - 90)}>
                <RotateCcw aria-hidden="true" size={15} /> Rotate left
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRotation((r) => r + 90)}>
                <RotateCw aria-hidden="true" size={15} /> Rotate right
              </button>
            </div>
            <Slider id="fine" label="Straighten" value={rotation % 90} min={-20} max={20} unit="°" onChange={(v) => setRotation(Math.round(rotation / 90) * 90 + v)} />
            <Slider id="bright" label="Brightness" value={brightness} min={50} max={160} unit="%" onChange={setBrightness} />
            <Slider id="contrast" label="Contrast" value={contrast} min={50} max={250} unit="%" onChange={setContrast} />
            <fieldset>
              <legend className="text-sm font-semibold text-midnight">The sign is…</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["auto", "Detect for me"],
                    ["dark", "Darker than the stone"],
                    ["light", "Lighter than the stone"],
                  ] as const
                ).map(([v, l]) => (
                  <label key={v} className="chip cursor-pointer">
                    <input type="radio" name="ink" value={v} checked={ink === v} onChange={() => setInk(v)} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={analyse} disabled={busy} aria-busy={busy}>
                {busy ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : <Sparkles aria-hidden="true" size={18} />}
                {busy ? "Analysing…" : "Identify sign"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Start again
              </button>
            </div>
          </div>
        )}

        {stage === "result" && result && <Result v={result} statusRef={status} onOpen={setOpen} onRetry={() => setStage("edit")} onReset={reset} />}

        {(stage === "start" || stage === "camera") && (
          <div className="space-y-5">
            <h3 className="text-2xl">How it works</h3>
            <ol className="space-y-4">
              {[
                ["Photograph one sign", "Fill the frame with a single hieroglyph. Even, side-on light helps carved signs stand out."],
                ["Crop and adjust", "Fit the frame tightly, straighten, and boost contrast if the stone is worn."],
                ["See likely matches", "We compare its shape with the 57 signs in our library and show how sure we are."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-midnight font-display text-ivory">{i + 1}</span>
                  <span>
                    <strong className="block text-midnight">{t}</strong>
                    <span className="text-sm text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="flex items-start gap-2 rounded-2xl bg-ok/10 p-4 text-sm text-ok">
              <ShieldCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
              Your photo is analysed on this device. Nothing is uploaded or stored.
            </p>
          </div>
        )}
      </div>
      <SignDialog code={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Result({ v, statusRef, onOpen, onRetry, onReset }: { v: Verdict & { preview?: Float32Array }; statusRef: React.RefObject<HTMLDivElement | null>; onOpen: (c: string) => void; onRetry: () => void; onReset: () => void }) {
  const top = v.matches[0] ? signByCode(v.matches[0].code) : null;
  const second = v.matches[1] ? signByCode(v.matches[1].code) : null;
  const tone = { recognised: "bg-ok/10 text-ok", uncertain: "bg-gold/15 text-gold-ink", unrecognised: "bg-alert/10 text-alert", empty: "bg-alert/10 text-alert" }[v.status];
  const Icon = v.status === "recognised" ? CheckCircle2 : v.status === "uncertain" ? CircleHelp : AlertTriangle;
  const headline =
    v.status === "recognised" && top
      ? `Most likely: ${top.depicts.split(" — ")[0]} (${top.gardiner})`
      : v.status === "uncertain" && top
        ? `Not sure — it could be ${top.depicts.split(" — ")[0].toLowerCase()}${second ? ` or ${second.depicts.split(" — ")[0].toLowerCase()}` : ""}`
        : v.status === "empty"
          ? "We couldn't find a clear sign in the frame"
          : "We can't match this to a sign in our library";

  return (
    <div className="space-y-6">
      <div ref={statusRef} tabIndex={-1} role="status" className={`flex items-start gap-3 rounded-2xl p-4 outline-none ${tone}`}>
        <Icon aria-hidden="true" size={22} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">{headline}</p>
          {v.status !== "recognised" && (
            <p className="mt-1 text-sm opacity-90">
              {v.status === "empty" ? "Crop tighter around one sign, or raise the contrast." : "Try a tighter crop, straighten the photo, or tell us whether the sign is darker or lighter than the stone."}
            </p>
          )}
        </div>
      </div>

      {v.matches.length > 0 && (
        <div>
          <h3 className="text-xl">Closest matches</h3>
          <ul className="mt-3 space-y-2">
            {v.matches.map((m, i) => {
              const s = signByCode(m.code)!;
              const pct = Math.round(Math.max(0, Math.min(1, (m.score - THRESHOLDS.floor) / (1 - THRESHOLDS.floor))) * 100);
              return (
                <li key={m.code}>
                  <button type="button" onClick={() => onOpen(m.code)} className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-[var(--shadow-soft)] hover:ring-1 hover:ring-gold">
                    <Glyph code={m.code} className="w-12 text-center text-4xl text-midnight" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-midnight">
                        {s.depicts.split(" — ")[0]} <span className="text-xs font-bold text-gold-ink">{s.gardiner}</span>
                      </span>
                      <span className="block text-sm text-muted">{s.value ? <em>{s.value}</em> : s.meaning}</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                        <span className={`block h-full rounded-full ${i === 0 && v.status === "recognised" ? "bg-ok" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <span className="text-right text-sm tabular-nums text-muted">
                      {pct}%<span className="block text-[10px] uppercase tracking-wider">match</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {v.preview && (
        <div className="flex items-center gap-4 rounded-2xl bg-limestone p-4">
          <Preview data={v.preview} />
          <p className="text-sm text-muted">
            <strong className="text-midnight">What the computer saw.</strong> If this doesn&rsquo;t look like your sign, adjust the crop or contrast and try again.
          </p>
        </div>
      )}

      <p className="text-xs text-muted">
        Experimental. This suggests single signs from a library of 57 common ones; it does not translate inscriptions. Reading a real text needs context — signs combine into words, and direction and spelling vary.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Adjust and retry
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          New photo
        </button>
      </div>
    </div>
  );
}

function Preview({ data }: { data: Float32Array }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < data.length; i++) {
      const v = 255 - Math.round(data[i] * 255);
      img.data.set([v, v, v, 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [data]);
  return <canvas ref={ref} width={SIZE} height={SIZE} className="h-20 w-20 shrink-0 rounded-lg bg-white [image-rendering:pixelated]" aria-label="Simplified black-and-white version of your sign" role="img" />;
}

function Slider({ id, label, value, min, max, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="font-semibold text-midnight">
          {label}
        </label>
        <span className="tabular-nums text-muted">
          {value}
          {unit}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-nile)]" />
    </div>
  );
}

/** Draggable, resizable crop frame. Keyboard: arrows move, Shift+arrows resize. */
function CropBox({ crop, onChange, disabled, children }: { crop: Crop; onChange: (c: Crop) => void; disabled: boolean; children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "nw" | "ne" | "sw" | "se"; x: number; y: number; start: Crop } | null>(null);
  const clamp = (c: Crop): Crop => {
    const w = Math.min(1, Math.max(0.05, c.w)),
      h = Math.min(1, Math.max(0.05, c.h));
    return { w, h, x: Math.min(1 - w, Math.max(0, c.x)), y: Math.min(1 - h, Math.max(0, c.y)) };
  };
  function down(mode: NonNullable<typeof drag.current>["mode"], e: RPointerEvent) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: crop };
  }
  function move(e: RPointerEvent) {
    const d = drag.current,
      el = wrap.current;
    if (!d || !el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - d.x) / r.width,
      dy = (e.clientY - d.y) / r.height;
    const s = d.start;
    if (d.mode === "move") onChange(clamp({ ...s, x: s.x + dx, y: s.y + dy }));
    else {
      let { x, y, w, h } = s;
      if (d.mode.includes("w")) {
        x = s.x + dx;
        w = s.w - dx;
      }
      if (d.mode.includes("e")) w = s.w + dx;
      if (d.mode.includes("n")) {
        y = s.y + dy;
        h = s.h - dy;
      }
      if (d.mode.includes("s")) h = s.h + dy;
      onChange(clamp({ x, y, w, h }));
    }
  }
  function key(e: React.KeyboardEvent) {
    const step = 0.02;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = map[e.key];
    if (!m || disabled) return;
    e.preventDefault();
    onChange(clamp(e.shiftKey ? { ...crop, w: crop.w + m[0], h: crop.h + m[1] } : { ...crop, x: crop.x + m[0], y: crop.y + m[1] }));
  }
  return (
    <div ref={wrap} className="relative mx-auto w-fit touch-none select-none" onPointerMove={move} onPointerUp={() => (drag.current = null)}>
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-night/55" style={{ clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 ${crop.y * 100}%,${crop.x * 100}% ${crop.y * 100}%,${crop.x * 100}% ${(crop.y + crop.h) * 100}%,${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%,${(crop.x + crop.w) * 100}% ${crop.y * 100}%,0 ${crop.y * 100}%)` }} />
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Crop frame. Arrow keys move it, Shift and arrow keys resize it."
        aria-valuetext={`${Math.round(crop.w * 100)}% wide, ${Math.round(crop.h * 100)}% high`}
        aria-valuenow={Math.round(crop.x * 100)}
        onKeyDown={key}
        onPointerDown={(e) => down("move", e)}
        className={`absolute rounded-md border-2 border-gold-300 shadow-[0_0_0_1px_rgb(10_18_32/0.5)] ${disabled ? "" : "cursor-move"}`}
        style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
      >
        {!disabled &&
          (["nw", "ne", "sw", "se"] as const).map((c) => (
            <span
              key={c}
              onPointerDown={(e) => down(c, e)}
              className={`absolute h-6 w-6 rounded-full border-2 border-night bg-gold-300 ${c.includes("n") ? "-top-3" : "-bottom-3"} ${c.includes("w") ? "-left-3" : "-right-3"} ${c === "nw" || c === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`}
            />
          ))}
      </div>
    </div>
  );
}
