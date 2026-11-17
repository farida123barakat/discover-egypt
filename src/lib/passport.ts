/**
 * Memory Passport renderer. Draws each booklet page on a <canvas> on the visitor's device, at the
 * same 12 px/mm (≈ 305 dpi) as the postcards, so the preview is exactly what prints.
 *
 * Page: 88 × 125 mm trim (passport size) + 3 mm bleed = 94 × 131 mm → 1128 × 1572 px.
 * The design is original: the sun-over-the-Nile emblem from the site's passport, ink stamps whose
 * shape follows the kind of challenge, and a decorative (non-security) line pattern on the paper.
 */
import { HUNT_CATEGORY_LABEL, type Achievement } from "@/content/hunt";
import type { Memory } from "./memories";
import { PASSPORT_BLEED_MM, PASSPORT_MM, hash, type PassportPage, type PassportStamp, type PassportSummary, type StampKind } from "./passport-plan";
import { ARABIC, C, HIERO, MM, SANS, SERIF, cover, fitText, formatVisitDate, placeholder, wrapText } from "./postcard";

export const PAGE = { w: (PASSPORT_MM.w + 2 * PASSPORT_BLEED_MM) * MM, h: (PASSPORT_MM.h + 2 * PASSPORT_BLEED_MM) * MM };
const B = PASSPORT_BLEED_MM * MM; // bleed in px
const SAFE = B + 8 * MM; // 8 mm inside the trim
const COVER = { base: "#14243c", deep: "#0d192b", gold: "#c9a35a", gold2: "#e4c486" };
const PAPER = { base: "#f6efe2", line: "rgb(157 122 64 / 0.16)", line2: "rgb(31 111 139 / 0.10)", head: "#7a5a33" };
export const ARABIC_TITLE = "جواز الذكريات"; // "Passport of memories"
export const SOUVENIR = "SOUVENIR · NOT A TRAVEL DOCUMENT";

/** Ink colour and the word printed on each kind of stamp. */
export const STAMP_STYLE: Record<StampKind, { ink: string; verb: string }> = {
  landmark: { ink: "#9b3b2a", verb: "VISITED" },
  hieroglyphs: { ink: "#1f3f7a", verb: "DECODED" },
  food: { ink: "#2f6b4a", verb: "TASTED" },
  market: { ink: "#6a3d7a", verb: "FOUND" },
  sunset: { ink: "#b8561f", verb: "WITNESSED" },
  "hidden-detail": { ink: "#1f6f78", verb: "SPOTTED" },
  memory: { ink: "#5a3d22", verb: "REMEMBERED" },
};

export type PhotoMap = Map<string, ImageBitmap>;
type Ctx = CanvasRenderingContext2D;

/* ---------------------------------------------------------------- small helpers */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Use hieroglyphs only when the font really loaded; otherwise the print would show empty boxes. */
function hieroOk() {
  try {
    if (typeof document === "undefined" || !document.fonts) return false;
    // FontFaceSet.check() also answers true when no such font exists at all, so look for a loaded face.
    for (const f of document.fonts) if (f.family.replace(/["']/g, "") === "Noto Sans Egyptian Hieroglyphs" && f.status === "loaded") return true;
    return false;
  } catch {
    return false;
  }
}

/** "10 NOV 2026": short enough to sit inside a stamp. */
export function stampDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/\.$/, "").toUpperCase();
}

/** "10 – 17 Nov 2026", "28 Oct – 3 Nov 2026" or "30 Dec 2026 – 2 Jan 2027". */
export function dateRange(from: string | null, to: string | null) {
  if (!from || !to) return "";
  const a = new Date(`${from}T12:00:00`),
    b = new Date(`${to}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", o);
  if (from === to) return f(a, { day: "numeric", month: "short", year: "numeric" });
  if (a.getFullYear() !== b.getFullYear()) return `${f(a, { day: "numeric", month: "short", year: "numeric" })} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `${f(a, { day: "numeric", month: "short" })} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
  return `${a.getDate()} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Largest size at which every word fits on its line (no hyphenation) within maxLines. */
function fitWords(ctx: Ctx, text: string, font: (px: number) => string, maxWidth: number, maxLines: number, max: number, min: number) {
  const words = text.split(/\s+/).filter(Boolean);
  for (let px = max; px >= min; px -= 2) {
    ctx.font = font(px);
    if (words.some((w) => ctx.measureText(w).width > maxWidth)) continue;
    const lines = wrapText((x) => ctx.measureText(x).width, text, maxWidth, 99);
    if (lines.length <= maxLines) return { px, lines };
  }
  return fitText(ctx, text, font, maxWidth, maxLines, min, min);
}

function spaced(ctx: Ctx, text: string, x: number, y: number, spacing: number, align: "left" | "center" | "right" = "left") {
  ctx.save();
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  // letterSpacing adds space after the last letter too: nudge centred and right-aligned text back.
  const dx = align === "center" ? spacing / 2 : align === "right" ? spacing : 0;
  ctx.fillText(text, x + dx, y);
  ctx.restore();
}

/** Text around a circle: along the top (reading left to right) or along the bottom. */
function arcText(ctx: Ctx, text: string, cx: number, cy: number, r: number, where: "top" | "bottom", spacing = 4) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  const sweep = total / r;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = where === "top" ? "alphabetic" : "hanging";
  let a = where === "top" ? -Math.PI / 2 - sweep / 2 : Math.PI / 2 + sweep / 2;
  chars.forEach((c, i) => {
    const half = (widths[i] - spacing) / 2 / r;
    a += where === "top" ? half : -half;
    ctx.save();
    ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.rotate(where === "top" ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    a += (where === "top" ? 1 : -1) * ((widths[i] - spacing) / 2 + spacing) / r;
  });
  ctx.restore();
}

/** The site's passport emblem: a sun with rays above the horizon and the Nile's waves. */
export function emblem(ctx: Ctx, cx: number, cy: number, s: number, color: string, line = 2.4) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of [
    [0, -34, 0, -28],
    [-25, -25, -21, -21],
    [25, -25, 21, -21],
    [-34, 0, -28, 0],
    [28, 0, 34, 0],
  ]) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.moveTo(-40, 30);
  ctx.lineTo(40, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-30, 40);
  for (let i = 0; i < 4; i++) {
    const x0 = -30 + i * 15,
      d = i % 2 ? 3 : -3;
    ctx.bezierCurveTo(x0 + 5, 40 + d, x0 + 10, 40 + d, x0 + 15, 40);
  }
  ctx.stroke();
  ctx.restore();
}

/** An original drawing of the wedjat (Eye of Horus), an ancient motif, as on the passport in the site design. */
export function wedjat(ctx: Ctx, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // brow
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-46, -22);
  ctx.quadraticCurveTo(-2, -42, 46, -26);
  ctx.stroke();
  // lids, with the cosmetic line running back
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-42, -2);
  ctx.quadraticCurveTo(-6, -28, 30, -6);
  ctx.quadraticCurveTo(-6, 16, -42, -2);
  ctx.moveTo(30, -6);
  ctx.lineTo(52, -8);
  ctx.stroke();
  // pupil
  ctx.beginPath();
  ctx.arc(-5, -6, 9.5, 0, Math.PI * 2);
  ctx.fill();
  // the falcon's markings: the straight drop and the curl
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, 9);
  ctx.lineTo(-19, 40);
  ctx.moveTo(4, 9);
  ctx.bezierCurveTo(8, 27, 28, 40, 38, 30);
  ctx.bezierCurveTo(45, 22, 34, 14, 28, 22);
  ctx.stroke();
  ctx.restore();
}

/* ---------------------------------------------------------------- paper and furniture */

/** Cream paper with a fine wave pattern (decorative only) and a faint emblem watermark. */
function paper(ctx: Ctx, seed: number) {
  ctx.fillStyle = PAPER.base;
  ctx.fillRect(0, 0, PAGE.w, PAGE.h);
  ctx.save();
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 2; k++) {
    ctx.strokeStyle = k ? PAPER.line2 : PAPER.line;
    for (let i = -2; i < 36; i++) {
      const base = i * 46 + k * 23;
      ctx.beginPath();
      for (let x = 0; x <= PAGE.w; x += 12) {
        const y = base + Math.sin(x / (90 + k * 30) + i * 0.55) * 18 + Math.sin(x / 31 + k) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.04;
  emblem(ctx, PAGE.w / 2, PAGE.h / 2 + 60, 8, C.brown, 2);
  ctx.restore();
  // a few paper fibres
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = "rgb(90 61 34 / 0.05)";
  for (let i = 0; i < 260; i++) ctx.fillRect(r() * PAGE.w, r() * PAGE.h, 1 + r() * 3, 1);
  ctx.restore();
}

function header(ctx: Ctx, title: string, arabic: string, pageNo: number | null) {
  ctx.save();
  ctx.fillStyle = PAPER.head;
  ctx.font = `600 24px ${SANS}`;
  ctx.textBaseline = "alphabetic";
  spaced(ctx, "MEMORY PASSPORT · EGYPT", SAFE, SAFE + 10, 5);
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.font = `700 34px ${ARABIC}`;
  ctx.fillText(arabic, PAGE.w - SAFE, SAFE + 14);
  ctx.direction = "ltr";
  ctx.fillStyle = C.ink;
  ctx.textAlign = "left";
  ctx.font = `500 64px ${SERIF}`;
  ctx.fillText(title, SAFE, SAFE + 92);
  ctx.strokeStyle = COVER.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(SAFE, SAFE + 122);
  ctx.lineTo(PAGE.w - SAFE, SAFE + 122);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SAFE, SAFE + 130);
  ctx.lineTo(PAGE.w - SAFE, SAFE + 130);
  ctx.stroke();
  if (pageNo !== null) {
    ctx.fillStyle = PAPER.head;
    ctx.font = `600 24px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText(String(pageNo), PAGE.w / 2, PAGE.h - B - 40);
  }
  ctx.restore();
  return SAFE + 170; // first free y
}

function footerNote(ctx: Ctx, y: number, color = PAPER.head) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 20px ${SANS}`;
  ctx.textBaseline = "alphabetic";
  spaced(ctx, SOUVENIR, PAGE.w / 2, y, 4, "center");
  ctx.restore();
}

/** A border of decorative signs when the hieroglyph font is available; a gold key pattern otherwise. */
function signBand(ctx: Ctx, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (hieroOk()) {
    const signs = ["\u{132F9}", "\u{131F3}", "\u{131A3}", "\u{13080}", "\u{13217}", "\u{132BD}"]; // ankh, sun, scarab, eye, water, djed
    ctx.font = `46px ${HIERO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const n = 11;
    const step = (PAGE.w - 2 * SAFE) / (n - 1);
    for (let i = 0; i < n; i++) ctx.fillText(signs[i % signs.length], SAFE + i * step, y);
  } else {
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = SAFE; x < PAGE.w - SAFE - 30; x += 40) {
      ctx.moveTo(x, y + 12);
      ctx.lineTo(x, y - 12);
      ctx.lineTo(x + 28, y - 12);
      ctx.lineTo(x + 28, y + 4);
      ctx.lineTo(x + 12, y + 4);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- stamps */

function stampShape(ctx: Ctx, kind: StampKind, r: number) {
  ctx.beginPath();
  switch (kind) {
    case "landmark":
    case "sunset":
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case "hieroglyphs": {
      // a cartouche: a long oval with the tie at the bottom
      const w = r * 0.78, h = r * 1.08;
      ctx.roundRect(-w, -h, 2 * w, 2 * h, w);
      break;
    }
    case "food": {
      // postage-stamp edge
      const s = r * 0.9, n = 9, t = (2 * s) / n;
      ctx.moveTo(-s, -s);
      for (let i = 0; i < n; i++) {
        ctx.lineTo(-s + i * t + t / 2, -s + 10);
        ctx.lineTo(-s + (i + 1) * t, -s);
      }
      for (let i = 0; i < n; i++) {
        ctx.lineTo(s - 10, -s + i * t + t / 2);
        ctx.lineTo(s, -s + (i + 1) * t);
      }
      for (let i = 0; i < n; i++) {
        ctx.lineTo(s - i * t - t / 2, s - 10);
        ctx.lineTo(s - (i + 1) * t, s);
      }
      for (let i = 0; i < n; i++) {
        ctx.lineTo(-s + 10, s - i * t - t / 2);
        ctx.lineTo(-s, s - (i + 1) * t);
      }
      break;
    }
    case "market":
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
        else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      break;
    case "hidden-detail":
      ctx.roundRect(-r * 0.88, -r * 0.88, r * 1.76, r * 1.76, 26);
      break;
    case "memory":
      ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
      break;
  }
  ctx.closePath();
}

/** Draw one ink stamp centred on (0,0) of a fresh canvas, then wear it a little and press it onto the page. */
export function drawStamp(ctx: Ctx, s: PassportStamp, cx: number, cy: number, scale = 1) {
  const R = 170;
  const size = Math.ceil(R * 2.6);
  const off = document.createElement("canvas");
  off.width = off.height = size;
  const g = off.getContext("2d")!;
  const { ink, verb } = STAMP_STYLE[s.kind];
  g.translate(size / 2, size / 2);
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineJoin = "round";
  g.textBaseline = "alphabetic";

  // outline: thick outer line, thin inner line
  g.lineWidth = 9;
  stampShape(g, s.kind, R);
  g.stroke();
  g.lineWidth = 3;
  g.save();
  g.scale(0.86, 0.86);
  stampShape(g, s.kind, R);
  g.restore();
  g.stroke();

  const place = s.place.toUpperCase();
  const date = stampDate(s.date);
  const round = s.kind === "landmark" || s.kind === "sunset";
  g.textAlign = "center";
  if (round) {
    g.font = `700 30px ${SANS}`;
    arcText(g, place.length > 16 ? place.slice(0, 15) + "…" : place, 0, 0, R * 0.7, "top", 4);
    g.font = `700 22px ${SANS}`;
    arcText(g, `${verb} · MEMORY HUNT`, 0, 0, R * 0.72, "bottom", 3);
    g.lineWidth = 4;
    if (s.kind === "sunset") {
      g.beginPath();
      g.arc(0, -16, 30, Math.PI, 0);
      g.moveTo(-64, -16);
      g.lineTo(64, -16);
      for (let i = 1; i < 6; i++) {
        const a = Math.PI + (i * Math.PI) / 6;
        g.moveTo(Math.cos(a) * 40, -16 + Math.sin(a) * 40);
        g.lineTo(Math.cos(a) * 52, -16 + Math.sin(a) * 52);
      }
      g.stroke();
    } else {
      // a small pyramid
      g.beginPath();
      g.moveTo(-42, -10);
      g.lineTo(0, -58);
      g.lineTo(42, -10);
      g.closePath();
      g.moveTo(0, -58);
      g.lineTo(8, -10);
      g.stroke();
    }
    const d = fitWords(g, date, (px) => `800 ${px}px ${SANS}`, R * 1.2, 1, 34, 20);
    g.font = `800 ${d.px}px ${SANS}`;
    g.fillText(date, 0, 34);
    if (s.points) {
      g.font = `800 20px ${SANS}`;
      g.fillText(`+${s.points} POINTS`, 0, 70);
    }
  } else {
    // a centred block: verb, place, rule, date, challenge title
    const width = s.kind === "memory" || s.kind === "hieroglyphs" ? R * 1.18 : R * 1.32;
    const p = fitWords(g, place, (px) => `700 ${px}px ${SERIF}`, width, 2, 46, 24);
    const d = fitWords(g, date, (px) => `800 ${px}px ${SANS}`, width, 1, 28, 18);
    g.font = `600 19px ${SANS}`;
    const t = wrapText((x) => g.measureText(x).width, s.title, width, 2);
    const H = 22 + 14 + p.lines.length * p.px * 1.02 + 16 + d.px + (t.length ? 12 + t.length * 23 : 0);
    let y = -H / 2 + 20;
    const vText = s.points ? `${verb} · +${s.points}` : verb;
    // the top of a cartouche or an oval is narrower: let the small line shrink to fit
    let vpx = 20;
    g.font = `800 ${vpx}px ${SANS}`;
    while (vpx > 14 && g.measureText(vText).width + vText.length * 4 > width * 0.92) g.font = `800 ${--vpx}px ${SANS}`;
    spaced(g, vText, 0, y, vpx >= 18 ? 5 : 3, "center");
    y += 14;
    g.font = `700 ${p.px}px ${SERIF}`;
    for (const l of p.lines) {
      y += p.px * 1.02;
      g.fillText(l, 0, y - p.px * 0.18);
    }
    y += 6;
    g.fillRect(-width * 0.4, y, width * 0.8, 3);
    y += 10 + d.px;
    g.font = `800 ${d.px}px ${SANS}`;
    g.fillText(date, 0, y);
    g.font = `600 19px ${SANS}`;
    y += 12;
    t.forEach((l) => {
      y += 23;
      g.fillText(l, 0, y);
    });
  }

  // wear: knock small flecks out of the ink, the same way every time for this memory
  const r = rng(hash(s.memoryId));
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 420; i++) {
    g.globalAlpha = 0.25 + r() * 0.6;
    g.beginPath();
    g.arc(r() * size, r() * size, 0.6 + r() * 2.6, 0, Math.PI * 2);
    g.fill();
  }
  // and a lighter patch where the stamp pressed unevenly
  const lg = g.createLinearGradient(0, 0, size, size);
  const edge = r();
  lg.addColorStop(0, `rgb(0 0 0 / ${0.05 + edge * 0.25})`);
  lg.addColorStop(0.5, "rgb(0 0 0 / 0)");
  lg.addColorStop(1, `rgb(0 0 0 / ${0.3 - edge * 0.2})`);
  g.globalAlpha = 1;
  g.fillStyle = lg;
  g.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.9;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(off, -size / 2, -size / 2);
  ctx.restore();
}

/* ---------------------------------------------------------------- pages */

function drawCover(ctx: Ctx, back = false) {
  ctx.fillStyle = COVER.base;
  ctx.fillRect(0, 0, PAGE.w, PAGE.h);
  // leather grain
  const r = rng(back ? 7 : 3);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgb(255 255 255 / 0.025)" : "rgb(0 0 0 / 0.06)";
    ctx.fillRect(r() * PAGE.w, r() * PAGE.h, 2, 2);
  }
  ctx.strokeStyle = COVER.gold;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 4;
  ctx.strokeRect(SAFE - 30, SAFE - 30, PAGE.w - 2 * (SAFE - 30), PAGE.h - 2 * (SAFE - 30));
  ctx.lineWidth = 1.5;
  ctx.strokeRect(SAFE - 18, SAFE - 18, PAGE.w - 2 * (SAFE - 18), PAGE.h - 2 * (SAFE - 18));
  ctx.globalAlpha = 1;
  ctx.fillStyle = COVER.gold2;
  ctx.textBaseline = "alphabetic";

  if (back) {
    emblem(ctx, PAGE.w / 2, PAGE.h * 0.44, 2.6, COVER.gold2, 2.6);
    ctx.font = `600 26px ${SANS}`;
    spaced(ctx, "DISCOVER EGYPT", PAGE.w / 2, PAGE.h * 0.6, 8, "center");
    ctx.font = `italic 400 34px ${SERIF}`;
    ctx.textAlign = "center";
    ctx.fillText("A thousand stories. One destination.", PAGE.w / 2, PAGE.h * 0.6 + 64);
    ctx.font = `500 22px ${SANS}`;
    ctx.fillStyle = "rgb(228 196 134 / 0.8)";
    ctx.fillText("Made on your own device from your Memory Hunt.", PAGE.w / 2, PAGE.h - SAFE - 64);
    footerNote(ctx, PAGE.h - SAFE - 20, COVER.gold2);
    return;
  }

  ctx.font = `600 28px ${SANS}`;
  spaced(ctx, "DISCOVER EGYPT", PAGE.w / 2, SAFE + 90, 10, "center");
  ctx.font = `500 150px ${SERIF}`;
  spaced(ctx, "EGYPT", PAGE.w / 2, SAFE + 320, 16, "center");
  ctx.font = `500 58px ${SERIF}`;
  spaced(ctx, "MEMORY PASSPORT", PAGE.w / 2, SAFE + 410, 10, "center");
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.font = `700 66px ${ARABIC}`;
  ctx.fillText(ARABIC_TITLE, PAGE.w / 2, SAFE + 515);
  ctx.direction = "ltr";
  wedjat(ctx, PAGE.w / 2, PAGE.h * 0.62, 4.2, COVER.gold2);
  signBand(ctx, PAGE.h - SAFE - 150, COVER.gold);
  ctx.fillStyle = COVER.gold2;
  footerNote(ctx, PAGE.h - SAFE - 40, COVER.gold2);
}

/** A labelled value; returns the height it used so fields can stack. */
function field(ctx: Ctx, label: string, value: string, x: number, y: number, w: number, blank = false) {
  ctx.save();
  ctx.fillStyle = PAPER.head;
  ctx.font = `600 20px ${SANS}`;
  ctx.textBaseline = "alphabetic";
  spaced(ctx, label.toUpperCase(), x, y, 3);
  let h = 90;
  if (blank) {
    ctx.strokeStyle = "rgb(42 29 20 / 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + 64);
    ctx.lineTo(x + w, y + 64);
    ctx.stroke();
    h = 110;
  } else {
    ctx.fillStyle = C.ink;
    const f = fitWords(ctx, value, (px) => `500 ${px}px ${SERIF}`, w, 2, 40, 26);
    ctx.font = `500 ${f.px}px ${SERIF}`;
    f.lines.forEach((l, i) => ctx.fillText(l, x, y + 12 + f.px + i * f.px * 1.12));
    h = 12 + f.px + (f.lines.length - 1) * f.px * 1.12 + 48;
  }
  ctx.restore();
  return h;
}

function drawHolder(ctx: Ctx, page: Extract<PassportPage, { kind: "holder" }>, photos: PhotoMap, pageNo: number) {
  paper(ctx, 11);
  const top = header(ctx, "Traveller", "المسافر", pageNo);
  const s: PassportSummary = page.summary;
  // a passport-style photo, 32 × 40 mm
  const pw = 32 * MM,
    ph = 40 * MM,
    px = SAFE;
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgb(42 29 20 / 0.25)";
  ctx.shadowBlur = 14;
  ctx.fillRect(px - 10, top - 10, pw + 20, ph + 20);
  ctx.restore();
  const bmp = page.photoMemoryId ? photos.get(page.photoMemoryId) : undefined;
  if (bmp) cover(ctx, bmp, { w: bmp.width, h: bmp.height }, px, top, pw, ph);
  else placeholder(ctx, px, top, pw, ph);

  const fx = px + pw + 44,
    fw = PAGE.w - SAFE - fx;
  let y = top + 14;
  y += field(ctx, "Name · الاسم", s.name, fx, y, fw, !s.name);
  y += field(ctx, "Journey", dateRange(s.from, s.to) || "Not started yet", fx, y, fw);
  y += Math.max(field(ctx, "Memories", String(s.memories), fx, y, fw / 2 - 12), field(ctx, "Points", String(s.points), fx + fw / 2, y, fw / 2));
  y += field(ctx, "Challenges", `${s.completed} of ${s.total}`, fx, y, fw);

  y = Math.max(y, top + ph + 50);
  const full = PAGE.w - 2 * SAFE;
  y += field(ctx, "Places", s.places.length ? s.places.join(" · ") : "Your first stop awaits", SAFE, y, full);
  y += Math.max(field(ctx, "Achievements", `${s.achievementsEarned} of 8 earned`, SAFE, y, full / 2 - 20), field(ctx, "Issued", formatVisitDate(s.issued), SAFE + full / 2, y, full / 2));
  field(ctx, "Traveller's signature", "", SAFE, y + 10, full, true);
  signBand(ctx, PAGE.h - SAFE - 150, "rgb(122 90 51 / 0.55)");
  footerNote(ctx, PAGE.h - SAFE - 84);
}

function drawStampsPage(ctx: Ctx, page: Extract<PassportPage, { kind: "stamps" }>, pageNo: number) {
  paper(ctx, 100 + page.sheet);
  const top = header(ctx, page.sheets > 1 ? `Stamps ${page.sheet}/${page.sheets}` : "Stamps", "الأختام", pageNo);
  const bottom = PAGE.h - SAFE - 40;
  const cols = 2,
    rows = 2;
  const cw = (PAGE.w - 2 * SAFE) / cols,
    rh = (bottom - top) / rows;
  if (!page.stamps.length) {
    ctx.save();
    ctx.strokeStyle = "rgb(122 90 51 / 0.35)";
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(SAFE + cw * (i % 2) + cw / 2, top + rh * Math.floor(i / 2) + rh / 2, 150, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PAPER.head;
    ctx.font = `italic 400 34px ${SERIF}`;
    ctx.textAlign = "center";
    ctx.fillText("Your stamps will appear here", PAGE.w / 2, top + rh - 6);
    ctx.fillText("as you complete challenges.", PAGE.w / 2, top + rh + 40);
    ctx.restore();
    return;
  }
  page.stamps.forEach((s, i) => {
    const cx = SAFE + cw * (i % cols) + cw / 2 + s.jitter.x * 26;
    const cy = top + rh * Math.floor(i / cols) + rh / 2 + s.jitter.y * 30;
    drawStamp(ctx, s, cx, cy, 1.08);
  });
}

function drawMemoryPage(ctx: Ctx, page: Extract<PassportPage, { kind: "memory" }>, m: Memory | undefined, photos: PhotoMap, pageNo: number) {
  paper(ctx, hash(page.memoryId));
  const top0 = header(ctx, page.stamp.place, "ذكرى", pageNo);
  let y = top0;
  const bmp = photos.get(page.memoryId);
  const w = PAGE.w - 2 * SAFE;
  if (bmp) {
    const pw = w - 40,
      ph = Math.round(pw * 0.72);
    const tilt = ((page.stamp.rotation / 3) * Math.PI) / 180;
    ctx.save();
    ctx.translate(PAGE.w / 2, y + ph / 2 + 20);
    ctx.rotate(tilt);
    ctx.shadowColor = "rgb(42 29 20 / 0.3)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-pw / 2 - 18, -ph / 2 - 18, pw + 36, ph + 36);
    ctx.shadowColor = "transparent";
    cover(ctx, bmp, { w: bmp.width, h: bmp.height }, -pw / 2, -ph / 2, pw, ph);
    // photo corners
    ctx.fillStyle = "#2a1d14";
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(sx * (pw / 2 + 18), sy * (ph / 2 + 18));
      ctx.lineTo(sx * (pw / 2 + 18) - sx * 64, sy * (ph / 2 + 18));
      ctx.lineTo(sx * (pw / 2 + 18), sy * (ph / 2 + 18) - sy * 64);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    y += ph + 90;
  }
  ctx.save();
  ctx.fillStyle = PAPER.head;
  ctx.font = `600 22px ${SANS}`;
  const meta = [formatVisitDate(page.stamp.date), page.stamp.kind !== "memory" ? HUNT_CATEGORY_LABEL[page.stamp.kind] : ""].filter(Boolean).join("  ·  ").toUpperCase();
  spaced(ctx, meta, SAFE, y, 3);
  y += 30;
  if (m?.caption.trim()) {
    ctx.fillStyle = C.ink;
    const cap = fitText(ctx, `“${m.caption.trim()}”`, (px) => `italic 400 ${px}px ${SERIF}`, w, 3, 52, 34);
    ctx.font = `italic 400 ${cap.px}px ${SERIF}`;
    for (const l of cap.lines) {
      y += cap.px * 1.2;
      ctx.fillText(l, SAFE, y);
    }
  }
  const room = bmp ? PAGE.h - SAFE - 120 - y : Math.min(PAGE.h - SAFE - 120 - y, 5 * 44 + 40);
  if (m?.story.trim() && room > 80) {
    ctx.fillStyle = C.ink;
    ctx.font = `400 30px ${SANS}`;
    // leave the bottom-right corner to the stamp
    const lines = wrapText((s) => ctx.measureText(s).width, m.story.trim(), bmp ? w - 230 : w, Math.max(1, Math.floor((room - 20) / 44)));
    y += 30;
    for (const l of lines) {
      y += 44;
      ctx.fillText(l, SAFE, y);
    }
  }
  ctx.restore();
  if (bmp) {
    drawStamp(ctx, page.stamp, PAGE.w - SAFE - 120, PAGE.h - SAFE - 190, 0.62);
    return;
  }
  // no photo: the stamp takes the middle of the page, with lines below to write on
  const sy = Math.max(y + 250, top0 + 420);
  drawStamp(ctx, page.stamp, PAGE.w / 2, sy, 1);
  ctx.save();
  ctx.strokeStyle = "rgb(31 111 139 / 0.28)";
  ctx.lineWidth = 2;
  for (let ly = sy + 260; ly < PAGE.h - SAFE - 90; ly += 76) {
    ctx.beginPath();
    ctx.moveTo(SAFE, ly);
    ctx.lineTo(PAGE.w - SAFE, ly);
    ctx.stroke();
  }
  ctx.restore();
}

function seal(ctx: Ctx, a: Achievement, cx: number, cy: number) {
  const r = 100;
  ctx.save();
  ctx.translate(cx, cy);
  if (a.earned) {
    // ribbon tails
    ctx.fillStyle = "#9b3b2a";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 30, r * 0.6);
      ctx.lineTo(s * 62, r * 1.26);
      ctx.lineTo(s * 38, r * 1.14);
      ctx.lineTo(s * 20, r * 1.32);
      ctx.lineTo(s * 4, r * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    // scalloped gold seal
    const g = ctx.createRadialGradient(-30, -40, 10, 0, 0, r);
    g.addColorStop(0, "#f6dfa6");
    g.addColorStop(0.55, "#d2a85a");
    g.addColorStop(1, "#9a7533");
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const ang = (i / 48) * Math.PI * 2,
        rr = i % 2 ? r : r * 0.93;
      if (i === 0) ctx.moveTo(rr * Math.cos(ang), rr * Math.sin(ang));
      else ctx.lineTo(rr * Math.cos(ang), rr * Math.sin(ang));
    }
    ctx.fill();
    ctx.strokeStyle = "rgb(90 61 34 / 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#4a3115";
  } else {
    ctx.strokeStyle = "rgb(122 90 51 / 0.4)";
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgb(122 90 51 / 0.75)";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const t = fitText(ctx, a.title, (px) => `600 ${px}px ${SERIF}`, r * 1.3, 2, 32, 22);
  ctx.font = `600 ${t.px}px ${SERIF}`;
  const h = t.lines.length * t.px * 1.05;
  t.lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + t.px * 0.85 + i * t.px * 1.05));
  ctx.font = `700 18px ${SANS}`;
  ctx.fillText(a.earned ? "EARNED" : `${a.progress[0]} / ${a.progress[1]}`, 0, h / 2 + 30);
  ctx.restore();
}

function drawEndorsements(ctx: Ctx, page: Extract<PassportPage, { kind: "endorsements" }>, pageNo: number) {
  paper(ctx, 77);
  const top = header(ctx, "Endorsements", "التأشيرات", pageNo);
  const bottom = PAGE.h - SAFE - 60;
  const cw = (PAGE.w - 2 * SAFE) / 2,
    rh = (bottom - top) / 4;
  page.achievements.slice(0, 8).forEach((a, i) => seal(ctx, a, SAFE + cw * (i % 2) + cw / 2, top + rh * Math.floor(i / 2) + rh / 2 - 16));
}

function drawNotes(ctx: Ctx, pageNo: number) {
  paper(ctx, 55 + pageNo);
  const top = header(ctx, "Notes", "ملاحظات", pageNo);
  ctx.save();
  ctx.fillStyle = PAPER.head;
  ctx.font = `italic 400 28px ${SERIF}`;
  ctx.fillText("Names, the best meal, a word you learned…", SAFE, top + 6);
  ctx.strokeStyle = "rgb(31 111 139 / 0.28)";
  ctx.lineWidth = 2;
  for (let y = top + 90; y < PAGE.h - SAFE - 80; y += 76) {
    ctx.beginPath();
    ctx.moveTo(SAFE, y);
    ctx.lineTo(PAGE.w - SAFE, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw page `index` of the booklet. Page numbers are printed on the inside pages only. */
export function drawPassportPage(canvas: HTMLCanvasElement, page: PassportPage, index: number, memories: Memory[], photos: PhotoMap) {
  canvas.width = PAGE.w;
  canvas.height = PAGE.h;
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  switch (page.kind) {
    case "cover":
      drawCover(ctx);
      break;
    case "back":
      drawCover(ctx, true);
      break;
    case "holder":
      drawHolder(ctx, page, photos, index);
      break;
    case "stamps":
      drawStampsPage(ctx, page, index);
      break;
    case "memory":
      drawMemoryPage(ctx, page, memories.find((m) => m.id === page.memoryId), photos, index);
      break;
    case "endorsements":
      drawEndorsements(ctx, page, index);
      break;
    case "notes":
      drawNotes(ctx, index);
      break;
  }
  ctx.restore();
  return canvas;
}

/** Decode every photo once; the caller closes them with closePhotos. */
export async function loadPhotos(memories: Memory[]): Promise<PhotoMap> {
  const map: PhotoMap = new Map();
  for (const m of memories) {
    if (!m.photo) continue;
    try {
      map.set(m.id, await createImageBitmap(m.photo));
    } catch {
      /* unreadable photo: that page shows text only */
    }
  }
  return map;
}

export function closePhotos(map: PhotoMap) {
  map.forEach((b) => b.close());
  map.clear();
}
