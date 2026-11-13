/**
 * Experimental single-sign hieroglyph recogniser. Runs entirely in the browser (or in Node for tests):
 * no server, no paid API, and the photo never leaves the device.
 *
 * Method (classic computer vision, no machine-learning model):
 *  1. grayscale → Otsu threshold → "ink" is the minority side (works for dark-on-light and light-on-dark);
 *  2. crop to the ink's bounding box, pad to a square, resample to 40×40;
 *  3. features = 8×8 ink-density zones + 4×4×8 gradient-orientation histograms (HOG-style) + aspect ratio;
 *  4. compare (cosine similarity) with reference renderings of every sign in several styles;
 *  5. report the top matches with a confidence level, and say "not sure" when the evidence is weak.
 *
 * Limits: one sign per image, reasonably tight crop. References come from a modern font, so worn,
 * painted or very stylised inscriptions may not match. Accuracy on synthetic tests is in docs/HIEROGLYPHS.md.
 */

export const SIZE = 40;

export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };
export type Ref = { code: string; f: Float32Array };
export type Match = { code: string; score: number };
export type Verdict = {
  status: "recognised" | "uncertain" | "unrecognised" | "empty";
  matches: Match[];
  /** 0..1, shown as a bar; only meaningful relative to the thresholds below */
  confidence: number;
};

/** Thresholds tuned on the synthetic benchmark (scripts/eval-glyphs.ts). */
export const THRESHOLDS = { recognise: 0.86, margin: 0.025, floor: 0.72 };

export function toGray({ data, width, height }: Pixels): Float32Array {
  const g = new Float32Array(width * height);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    const a = data[j + 3] / 255;
    // transparent pixels count as white paper
    const lum = (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255;
    g[i] = lum * a + (1 - a);
  }
  return g;
}

export function otsu(gray: Float32Array): number {
  const hist = new Float64Array(256);
  for (const v of gray) hist[Math.min(255, Math.max(0, Math.round(v * 255)))]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0,
    wB = 0,
    best = 0,
    t = 127;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB,
      mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      t = i;
    }
  }
  return t / 255;
}

/** Light 3×3 box blur to reduce camera noise before thresholding. */
function blur(g: Float32Array, w: number, h: number) {
  const o = new Float32Array(g.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0,
        n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) {
            s += g[yy * w + xx];
            n++;
          }
        }
      o[y * w + x] = s / n;
    }
  return o;
}

/** Remove a linear lighting gradient: least-squares fit of a plane a + b·x + c·y, then subtract it. */
function flatten(g: Float32Array, w: number, h: number) {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
  const n = g.length;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const z = g[y * w + x], X = (x - (w - 1) / 2) / w, Y = (y - (h - 1) / 2) / h;
      sx += X; sy += Y; sxx += X * X; syy += Y * Y; sxy += X * Y; sz += z; sxz += X * z; syz += Y * z;
    }
  // Least squares for z = a + bX + cY with X, Y exactly centred (sx = sy = 0); only the slope is removed.
  const det = sxx * syy - sxy * sxy || 1;
  const b = (sxz * syy - syz * sxy) / det;
  const c = (syz * sxx - sxz * sxy) / det;
  void sx; void sy; void sz;
  const o = new Float32Array(n);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) o[y * w + x] = g[y * w + x] - (b * ((x - (w - 1) / 2) / w) + c * ((y - (h - 1) / 2) / h));
  return o;
}

/**
 * Ink mask (1 = ink). Lighting gradients are flattened first, then a global Otsu threshold splits ink from
 * background. Ink is the minority side (so dark paint and light relief both work) unless `invert` is given.
 */
export function inkMask(px: Pixels, invert?: boolean): { mask: Uint8Array; inkRatio: number } {
  const { width: w, height: h } = px;
  const raw = flatten(blur(toGray(px), w, h), w, h);
  let lo = Infinity, hi = -Infinity;
  for (const v of raw) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo;
  // A blank or almost uniform image has no sign in it: don't stretch noise into fake "ink".
  if (span < 0.06) return { mask: new Uint8Array(raw.length), inkRatio: 0 };
  const g = raw.map((v) => (v - lo) / span);
  const t = otsu(g);
  let dark = 0;
  for (const v of g) if (v < t) dark++;
  const darkIsInk = invert === undefined ? dark <= g.length / 2 : !invert;
  const mask = new Uint8Array(g.length);
  let ink = 0;
  for (let i = 0; i < g.length; i++) {
    mask[i] = (darkIsInk ? g[i] < t : g[i] >= t) ? 1 : 0;
    ink += mask[i];
  }
  return { mask, inkRatio: ink / g.length };
}

/** Crop to ink, pad to square, area-resample to SIZE×SIZE (values 0..1). */
export function normalise(mask: Uint8Array, w: number, h: number): { img: Float32Array; aspect: number } | null {
  // Ignore isolated specks: a row/column must contain at least 1% of the ink.
  let total = 0;
  const rows = new Float64Array(h),
    cols = new Float64Array(w);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x]) {
        rows[y]++;
        cols[x]++;
        total++;
      }
  if (total < 20) return null;
  const minCount = Math.max(1, total * 0.002);
  let y0 = 0,
    y1 = h - 1,
    x0 = 0,
    x1 = w - 1;
  while (y0 < h && rows[y0] < minCount) y0++;
  while (y1 > y0 && rows[y1] < minCount) y1--;
  while (x0 < w && cols[x0] < minCount) x0++;
  while (x1 > x0 && cols[x1] < minCount) x1--;
  const bw = x1 - x0 + 1,
    bh = y1 - y0 + 1;
  if (bw < 4 || bh < 4) return null;
  const side = Math.max(bw, bh);
  const ox = x0 - (side - bw) / 2,
    oy = y0 - (side - bh) / 2;
  const img = new Float32Array(SIZE * SIZE);
  const step = side / SIZE;
  for (let j = 0; j < SIZE; j++)
    for (let i = 0; i < SIZE; i++) {
      let s = 0,
        n = 0;
      const sx0 = ox + i * step,
        sy0 = oy + j * step;
      const samples = Math.max(1, Math.ceil(step));
      for (let v = 0; v < samples; v++)
        for (let u = 0; u < samples; u++) {
          const xx = Math.floor(sx0 + ((u + 0.5) * step) / samples),
            yy = Math.floor(sy0 + ((v + 0.5) * step) / samples);
          n++;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) s += mask[yy * w + xx];
        }
      img[j * SIZE + i] = s / n;
    }
  return { img, aspect: bw / bh };
}

function l2(v: Float32Array, from: number, to: number, weight: number) {
  let s = 0;
  for (let i = from; i < to; i++) s += v[i] * v[i];
  const k = s > 0 ? weight / Math.sqrt(s) : 0;
  for (let i = from; i < to; i++) v[i] *= k;
}

export function features(img: Float32Array, aspect: number): Float32Array {
  const Z = 8,
    C = 4,
    B = 8;
  const f = new Float32Array(Z * Z + C * C * B + 1);
  // 1. density zones
  const zs = SIZE / Z;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) f[Math.floor(y / zs) * Z + Math.floor(x / zs)] += img[y * SIZE + x];
  // 2. gradient-orientation histograms (unsigned angle, magnitude-weighted, Sobel)
  const off = Z * Z,
    cs = SIZE / C;
  const at = (x: number, y: number) => img[Math.min(SIZE - 1, Math.max(0, y)) * SIZE + Math.min(SIZE - 1, Math.max(0, x))];
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      const mag = Math.hypot(gx, gy);
      if (mag < 1e-3) continue;
      let a = Math.atan2(gy, gx);
      if (a < 0) a += Math.PI;
      const bin = Math.min(B - 1, Math.floor((a / Math.PI) * B));
      f[off + (Math.floor(y / cs) * C + Math.floor(x / cs)) * B + bin] += mag;
    }
  l2(f, 0, off, 0.62);
  l2(f, off, off + C * C * B, 0.78);
  // 3. aspect ratio (log scale), small weight
  f[f.length - 1] = Math.max(-1, Math.min(1, Math.log(aspect))) * 0.12;
  return f;
}

export function extract(px: Pixels, invert?: boolean): { f: Float32Array; preview: Float32Array; inkRatio: number } | null {
  const { mask, inkRatio } = inkMask(px, invert);
  if (inkRatio < 0.005 || inkRatio > 0.85) return null;
  const n = normalise(mask, px.width, px.height);
  if (!n) return null;
  return { f: features(n.img, n.aspect), preview: n.img, inkRatio };
}

function cosine(a: Float32Array, b: Float32Array) {
  let d = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    d += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return d / (Math.sqrt(na * nb) || 1);
}

export function rank(f: Float32Array, refs: Ref[], top = 3): Match[] {
  const best = new Map<string, number>();
  for (const r of refs) {
    const s = cosine(f, r.f);
    if (s > (best.get(r.code) ?? -1)) best.set(r.code, s);
  }
  return [...best.entries()]
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

export function judge(matches: Match[], t = THRESHOLDS): Verdict {
  if (!matches.length) return { status: "empty", matches, confidence: 0 };
  const [a, b] = matches;
  const margin = a.score - (b?.score ?? 0);
  const confidence = Math.max(0, Math.min(1, (a.score - t.floor) / (1 - t.floor)));
  if (a.score < t.floor) return { status: "unrecognised", matches, confidence };
  if (a.score >= t.recognise && margin >= t.margin) return { status: "recognised", matches, confidence };
  return { status: "uncertain", matches, confidence };
}

export function recognise(px: Pixels, refs: Ref[], invert?: boolean): Verdict & { preview?: Float32Array } {
  const e = extract(px, invert);
  if (!e) return { status: "empty", matches: [], confidence: 0 };
  return { ...judge(rank(e.f, refs)), preview: e.preview };
}

/* ---------- Reference rendering (works with a browser canvas or @napi-rs/canvas) ---------- */
type Ctx = {
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  lineJoin: string;
  font: string;
  textAlign: string;
  textBaseline: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(t: string, x: number, y: number): void;
  strokeText(t: string, x: number, y: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(a: number): void;
  getImageData(x: number, y: number, w: number, h: number): { data: Uint8ClampedArray; width: number; height: number };
};
export type CanvasFactory = (w: number, h: number) => { getContext(type: "2d"): Ctx | null };

export const REF_VARIANTS = [
  { rot: 0, stroke: 0 },
  { rot: -7, stroke: 0 },
  { rot: 7, stroke: 0 },
  { rot: 0, stroke: 3 },
  { rot: -6, stroke: 3 },
  { rot: 6, stroke: 3 },
  { rot: 0, stroke: 6 },
];

export function renderGlyph(make: CanvasFactory, ch: string, fontFamily: string, opts: { rot?: number; stroke?: number; size?: number; px?: number } = {}): Pixels {
  const S = opts.px ?? 128;
  const c = make(S, S);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, S, S);
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(((opts.rot ?? 0) * Math.PI) / 180);
  ctx.font = `${opts.size ?? Math.round(S * 0.62)}px "${fontFamily}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(ch, 0, 0);
  if (opts.stroke) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = opts.stroke;
    ctx.lineJoin = "round";
    ctx.strokeText(ch, 0, 0);
  }
  ctx.restore();
  return ctx.getImageData(0, 0, S, S);
}

export function buildReferences(make: CanvasFactory, items: { code: string; ch: string }[], fontFamily: string): Ref[] {
  const refs: Ref[] = [];
  for (const it of items)
    for (const v of REF_VARIANTS) {
      const e = extract(renderGlyph(make, it.ch, fontFamily, v), false);
      if (e) refs.push({ code: it.code, f: e.f });
    }
  return refs;
}
