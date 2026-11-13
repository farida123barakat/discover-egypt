/**
 * Synthetic benchmark for the experimental hieroglyph recogniser.
 * Run: npx tsx scripts/eval-glyphs.ts
 * Test images are rendered from the same font as the references but with DIFFERENT distortions
 * (rotation, stroke weight, scale, offset, noise, uneven lighting, low contrast, inverted relief, blur).
 * This measures robustness, not real-world accuracy on photographed inscriptions.
 */
import path from "node:path";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { glyph, signs } from "../src/content/hieroglyphs";
import { buildReferences, judge, rank, extract, type CanvasFactory, type Pixels } from "../src/lib/glyph-recognition";

const fontDir = path.join(__dirname, "..", "node_modules/@fontsource/noto-sans-egyptian-hieroglyphs/files");
GlobalFonts.registerFromPath(path.join(fontDir, "noto-sans-egyptian-hieroglyphs-egyptian-hieroglyphs-400-normal.woff2"), "NotoHiero");
export const make: CanvasFactory = (w, h) => createCanvas(w, h) as unknown as ReturnType<CanvasFactory>;

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const between = (a: number, b: number) => a + (b - a) * rnd();
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

export function sample(ch: string, hard = false): Pixels {
  const S = 160;
  const c = createCanvas(S, S);
  const ctx = c.getContext("2d");
  const invert = rnd() < 0.3;
  const paper = between(0.75, 1),
    ink = between(0, 0.3);
  const [bg, fg] = invert ? [ink, paper] : [paper, ink];
  const grad = ctx.createLinearGradient(0, 0, S, S);
  const shade = hard ? 0.25 : 0.12;
  grad.addColorStop(0, `rgb(${Array(3).fill(Math.round(255 * Math.min(1, bg + shade))).join(",")})`);
  grad.addColorStop(1, `rgb(${Array(3).fill(Math.round(255 * Math.max(0, bg - shade))).join(",")})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  ctx.save();
  ctx.translate(S / 2 + between(-14, 14), S / 2 + between(-14, 14));
  ctx.rotate((between(-12, 12) * Math.PI) / 180);
  const size = Math.round(between(55, 100));
  ctx.font = `${size}px "NotoHiero"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const col = `rgb(${Array(3).fill(Math.round(255 * fg)).join(",")})`;
  ctx.fillStyle = col;
  ctx.fillText(ch, 0, 0);
  const stroke = between(0, hard ? 9 : 6);
  if (stroke > 0.5) {
    ctx.strokeStyle = col;
    ctx.lineWidth = stroke;
    ctx.lineJoin = "round";
    ctx.strokeText(ch, 0, 0);
  }
  ctx.restore();
  // blur by down/up-scaling
  const scale = between(hard ? 0.3 : 0.45, 1);
  const small = createCanvas(Math.max(8, Math.round(S * scale)), Math.max(8, Math.round(S * scale)));
  small.getContext("2d").drawImage(c, 0, 0, small.width, small.height);
  const out = createCanvas(S, S);
  out.getContext("2d").drawImage(small, 0, 0, S, S);
  const img = out.getContext("2d").getImageData(0, 0, S, S);
  const sigma = between(0.02, hard ? 0.16 : 0.09) * 255;
  for (let i = 0; i < img.data.length; i += 4) {
    const n = gauss() * sigma;
    for (let k = 0; k < 3; k++) img.data[i + k] = Math.max(0, Math.min(255, img.data[i + k] + n));
  }
  return img as unknown as Pixels;
}

export function references() {
  return buildReferences(make, signs.map((s) => ({ code: s.gardiner, ch: glyph(s) })), "NotoHiero");
}

function run() {
  const refs = references();
  for (const hard of [false, true]) {
    const results: { ok1: boolean; ok3: boolean; top: number; margin: number }[] = [];
    let empty = 0;
    for (let rep = 0; rep < 10; rep++)
      for (const s of signs) {
        const e = extract(sample(glyph(s), hard));
        if (!e) {
          empty++;
          continue;
        }
        const m = rank(e.f, refs, 3);
        results.push({ ok1: m[0].code === s.gardiner, ok3: m.some((x) => x.code === s.gardiner), top: m[0].score, margin: m[0].score - (m[1]?.score ?? 0) });
      }
    const n = results.length + empty;
    const pct = (x: number) => `${((100 * x) / n).toFixed(1)}%`;
    console.log(`\n${hard ? "HARD" : "STANDARD"} set — ${n} images, ${signs.length} signs`);
    console.log(`top-1 ${pct(results.filter((r) => r.ok1).length)} · top-3 ${pct(results.filter((r) => r.ok3).length)} · no sign found ${pct(empty)}`);
    for (const [T, M] of [[0.8, 0.01], [0.84, 0.02], [0.86, 0.025], [0.88, 0.03], [0.9, 0.04]]) {
      const conf = results.filter((r) => r.top >= T && r.margin >= M);
      const correct = conf.filter((r) => r.ok1).length;
      console.log(`  recognise if score≥${T} & margin≥${M}: answers ${pct(conf.length)} of images, precision ${conf.length ? ((100 * correct) / conf.length).toFixed(1) : "–"}%`);
    }
    const v = results.map((r) => judge([{ code: "x", score: r.top }, { code: "y", score: r.top - r.margin }]).status);
    console.log(`  current thresholds → recognised ${pct(v.filter((x) => x === "recognised").length)}, uncertain ${pct(v.filter((x) => x === "uncertain").length)}, unrecognised ${pct(v.filter((x) => x === "unrecognised").length)}`);
  }
}

/** Non-hieroglyph images: the recogniser should not claim a confident match. */
export function negatives(count = 120): Pixels[] {
  const out: Pixels[] = [];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789&%@#".split("");
  for (let i = 0; i < count; i++) {
    const S = 160;
    const c = createCanvas(S, S);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "#222";
    if (i % 2 === 0) {
      ctx.font = `${Math.round(between(70, 120))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letters[i % letters.length], S / 2, S / 2);
    } else {
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.ellipse(between(20, 140), between(20, 140), between(5, 35), between(5, 35), between(0, 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    out.push(ctx.getImageData(0, 0, S, S) as unknown as Pixels);
  }
  return out;
}

function runNegatives() {
  const refs = references();
  const v = negatives().map((px) => {
    const e = extract(px);
    return e ? judge(rank(e.f, refs)).status : "empty";
  });
  const n = v.length;
  console.log(`\nNON-HIEROGLYPHS — ${n} images (Latin letters, digits, random blobs)`);
  console.log(`  wrongly "recognised" ${((100 * v.filter((x) => x === "recognised").length) / n).toFixed(1)}% · uncertain ${((100 * v.filter((x) => x === "uncertain").length) / n).toFixed(1)}% · unrecognised/empty ${((100 * v.filter((x) => x === "unrecognised" || x === "empty").length) / n).toFixed(1)}%`);
}

if (process.argv[1]?.endsWith("eval-glyphs.ts")) {
  run();
  runNegatives();
}
