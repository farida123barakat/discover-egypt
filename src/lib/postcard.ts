/**
 * Postcard renderer. Draws on a <canvas> on the visitor's device — no server, no paid service.
 *
 * Size: A6 postcard (148 × 105 mm) plus 3 mm bleed on every side = 154 × 111 mm, at 12 px/mm
 * (≈ 305 dpi) → 1848 × 1332 px. Everything important stays inside the safe area.
 */
import type { TemplateId } from "./memories";

export const MM = 12;
export const BLEED_MM = 3;
export const TRIM_MM = { w: 148, h: 105 };
export const CARD = { w: (TRIM_MM.w + 2 * BLEED_MM) * MM, h: (TRIM_MM.h + 2 * BLEED_MM) * MM };
const SAFE = (BLEED_MM + 6) * MM; // 9 mm from the edge of the sheet

export const TEMPLATE_INFO: Record<TemplateId, { name: string; mood: string }> = {
  "golden-hour": { name: "Golden hour", mood: "Warm light on the pyramids" },
  papyrus: { name: "Papyrus", mood: "A scribe's sheet with a border of signs" },
  nile: { name: "The Nile", mood: "Deep river blues and gold" },
  "cairo-night": { name: "Cairo nights", mood: "Lantern gold and a star pattern" },
  desert: { name: "Desert dunes", mood: "Soft sand and sweeping curves" },
};

export type PostcardInput = {
  photo: CanvasImageSource | null;
  photoSize?: { w: number; h: number };
  caption: string;
  place: string;
  date: string; // already formatted, may be ""
  template: TemplateId;
  arabic: boolean;
};

export const C = { night: "#0a1220", ivory: "#f6efe2", cream: "#f3e9d6", gold: "#c9a35a", gold2: "#e4c486", gold3: "#f0dcb0", ink: "#2a1d14", nile: "#123f58", nile2: "#1f6f8b", sand: "#e8cfa0", sand2: "#d2a86a", papyrus: "#dcc48f", brown: "#5a3d22", muted: "#7b6a55" };
export const SERIF = "'Fraunces Variable', Georgia, serif";
export const SANS = "'Inter Variable', system-ui, sans-serif";
export const ARABIC = "Amiri, 'Noto Naskh Arabic', serif";
export const HIERO = "'Noto Sans Egyptian Hieroglyphs'";
export const ARABIC_LINE = "ذكريات من مصر"; // "Memories from Egypt"
// Decorative signs only — not a sentence. Ankh, sun disc, scarab, eye, water, djed pillar.
const BORDER_SIGNS = ["\u{132F9}", "\u{131F3}", "\u{131A3}", "\u{13080}", "\u{13217}", "\u{132BD}"];

/** Break text into lines that fit, adding an ellipsis when it runs out of lines. Pure apart from `measure`. */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    let w = words[i];
    // A single word longer than the line: hard-break it.
    while (measure(w) > maxWidth && w.length > 1) {
      let cut = w.length - 1;
      while (cut > 1 && measure(w.slice(0, cut) + "-") > maxWidth) cut--;
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      lines.push(w.slice(0, cut) + "-");
      w = w.slice(cut);
    }
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next) <= maxWidth) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/** Fit the largest font size (step 2px) that keeps text within maxLines. */
export function fitText(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxWidth: number, maxLines: number, max: number, min: number) {
  for (let px = max; px >= min; px -= 2) {
    ctx.font = font(px);
    const lines = wrapText((s) => ctx.measureText(s).width, text, maxWidth, 99);
    if (lines.length <= maxLines) return { px, lines };
  }
  ctx.font = font(min);
  return { px: min, lines: wrapText((s) => ctx.measureText(s).width, text, maxWidth, maxLines) };
}

/** Draw the photo so it covers the box, cropped from the centre. */
export function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, size: { w: number; h: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / size.w, h / size.h);
  const sw = w / s,
    sh = h / s;
  ctx.drawImage(img, (size.w - sw) / 2, (size.h - sh) / 2, sw, sh, x, y, w, h);
}

export function placeholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#1a2238");
  g.addColorStop(0.6, "#8a5a36");
  g.addColorStop(1, "#e2a35a");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#fff1cf";
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.55, h * 0.08, 0, Math.PI * 2);
  ctx.fill();
  const base = y + h * 0.82;
  const pyr = (cx: number, pw: number, ph: number) => {
    ctx.fillStyle = "#b98c4f";
    ctx.beginPath();
    ctx.moveTo(cx - pw / 2, base);
    ctx.lineTo(cx, base - ph);
    ctx.lineTo(cx + pw * 0.08, base);
    ctx.fill();
    ctx.fillStyle = "#7a5a33";
    ctx.beginPath();
    ctx.moveTo(cx + pw * 0.08, base);
    ctx.lineTo(cx, base - ph);
    ctx.lineTo(cx + pw / 2, base);
    ctx.fill();
  };
  pyr(x + w * 0.38, w * 0.42, h * 0.38);
  pyr(x + w * 0.66, w * 0.3, h * 0.26);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, base, w, y + h - base);
}

function photoOrPlaceholder(ctx: CanvasRenderingContext2D, p: PostcardInput, x: number, y: number, w: number, h: number) {
  if (p.photo && p.photoSize) cover(ctx, p.photo, p.photoSize, x, y, w, h);
  else placeholder(ctx, x, y, w, h);
}

function brand(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, accent: string) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + 22, y - 16, 16, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 44, y - 14);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 26px ${SANS}`;
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "6px";
  ctx.fillText("DISCOVER EGYPT", x + 60, y - 6);
  ctx.restore();
}

function arabicLine(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, px = 54, align: CanvasTextAlign = "right") {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `700 ${px}px ${ARABIC}`;
  ctx.fillText(ARABIC_LINE, x, y);
  ctx.restore();
}

function textBlock(ctx: CanvasRenderingContext2D, p: PostcardInput, x: number, y: number, w: number, colors: { kicker: string; place: string; caption: string; date: string }, opts: { captionLines?: number; placeMax?: number } = {}) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.kicker;
  ctx.font = `600 24px ${SANS}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("GREETINGS FROM", x, y);
  ctx.letterSpacing = "0px";
  const place = fitText(ctx, p.place || "Egypt", (px) => `500 ${px}px ${SERIF}`, w, 2, opts.placeMax ?? 92, 48);
  let cy = y + place.px + 14;
  ctx.fillStyle = colors.place;
  for (const l of place.lines) {
    ctx.fillText(l, x, cy);
    cy += place.px * 1.05;
  }
  if (p.caption.trim()) {
    cy += 22;
    const cap = fitText(ctx, `“${p.caption.trim()}”`, (px) => `italic 400 ${px}px ${SERIF}`, w, opts.captionLines ?? 4, 50, 32);
    ctx.fillStyle = colors.caption;
    for (const l of cap.lines) {
      cy += cap.px * 1.25;
      ctx.fillText(l, x, cy);
    }
  }
  if (p.date) {
    cy += 56;
    ctx.fillStyle = colors.date;
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText(p.date, x, cy);
  }
  ctx.restore();
}

function starPattern(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, size: number, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let y = y0; y < y0 + h + size; y += size)
    for (let x = x0; x < x0 + w + size; x += size) {
      const r = size * 0.42;
      for (const rot of [0, Math.PI / 4]) {
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a = rot + (k * Math.PI) / 2 + Math.PI / 4;
          const px = x + Math.cos(a) * r,
            py = y + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  ctx.restore();
}

export function drawPostcard(canvas: HTMLCanvasElement, p: PostcardInput) {
  canvas.width = CARD.w;
  canvas.height = CARD.h;
  const ctx = canvas.getContext("2d")!;
  const W = CARD.w,
    H = CARD.h;
  ctx.clearRect(0, 0, W, H);

  switch (p.template) {
    case "golden-hour": {
      const pw = Math.round(W * 0.6);
      photoOrPlaceholder(ctx, p, 0, 0, pw, H);
      const fade = ctx.createLinearGradient(pw - 200, 0, pw, 0);
      fade.addColorStop(0, "rgba(201,163,90,0)");
      fade.addColorStop(1, "rgba(201,163,90,0.35)");
      ctx.fillStyle = fade;
      ctx.fillRect(pw - 200, 0, 200, H);
      ctx.fillStyle = C.cream;
      ctx.fillRect(pw, 0, W - pw, H);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(pw + 40, SAFE, W - pw - 40 - SAFE, H - 2 * SAFE);
      ctx.lineWidth = 1;
      ctx.strokeRect(pw + 52, SAFE + 12, W - pw - 64 - SAFE, H - 2 * SAFE - 24);
      textBlock(ctx, p, pw + 100, SAFE + 120, W - pw - 100 - SAFE - 60, { kicker: "#9a7533", place: C.ink, caption: "#4a3826", date: C.muted });
      if (p.arabic) arabicLine(ctx, W - SAFE - 60, H - SAFE - 150, "#9a7533");
      brand(ctx, pw + 100, H - SAFE - 60, C.ink, C.gold);
      break;
    }
    case "papyrus": {
      ctx.fillStyle = C.papyrus;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < H; i += 9) {
        ctx.fillStyle = i % 18 ? "#c3a971" : "#e6d3a6";
        ctx.fillRect(0, i, W, 2);
      }
      for (let i = 0; i < W; i += 14) {
        ctx.fillStyle = "#c8ad76";
        ctx.fillRect(i, 0, 1, H);
      }
      ctx.globalAlpha = 1;
      // Border of decorative signs, top and bottom
      ctx.fillStyle = C.brown;
      ctx.font = `56px ${HIERO}`;
      ctx.textAlign = "center";
      const n = 16;
      for (let k = 0; k < n; k++) {
        const x = SAFE + 30 + (k * (W - 2 * SAFE - 60)) / (n - 1);
        ctx.fillText(BORDER_SIGNS[k % BORDER_SIGNS.length], x, SAFE + 50);
        ctx.fillText(BORDER_SIGNS[(k + 3) % BORDER_SIGNS.length], x, H - SAFE - 8);
      }
      ctx.fillRect(SAFE, SAFE + 72, W - 2 * SAFE, 3);
      ctx.fillRect(SAFE, H - SAFE - 72, W - 2 * SAFE, 3);
      // The photo as a print, slightly turned
      const fw = 900,
        fh = 640;
      ctx.save();
      ctx.translate(SAFE + 40 + fw / 2, H / 2 + 6);
      ctx.rotate(-0.025);
      ctx.shadowColor = "rgba(40,25,10,0.35)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#fbf6ea";
      ctx.fillRect(-fw / 2 - 22, -fh / 2 - 22, fw + 44, fh + 44);
      ctx.shadowColor = "transparent";
      photoOrPlaceholder(ctx, p, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
      textBlock(ctx, p, SAFE + 40 + fw + 110, SAFE + 220, W - (SAFE + 40 + fw + 110) - SAFE - 30, { kicker: "#7a5530", place: "#3b2512", caption: "#4d3218", date: "#6b5034" }, { captionLines: 4, placeMax: 80 });
      if (p.arabic) arabicLine(ctx, W - SAFE - 30, H - SAFE - 170, "#6b4520", 50);
      brand(ctx, SAFE + 40 + fw + 110, H - SAFE - 110, "#3b2512", "#7a5530");
      break;
    }
    case "nile": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, C.nile);
      g.addColorStop(1, "#0b2433");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const px = SAFE,
        py = SAFE,
        pw = W - 2 * SAFE,
        ph = Math.round(H * 0.56);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 36);
      ctx.clip();
      photoOrPlaceholder(ctx, p, px, py, pw, ph);
      ctx.restore();
      ctx.strokeStyle = C.gold2;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const y = H - SAFE - 30 - k * 26 + Math.sin(x / 90 + k) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.fillStyle = C.gold2;
      ctx.font = `600 24px ${SANS}`;
      ctx.letterSpacing = "6px";
      ctx.fillText("GREETINGS FROM", px + 10, py + ph + 70);
      ctx.restore();
      ctx.fillStyle = C.ivory;
      const place = fitText(ctx, p.place || "Egypt", (s) => `500 ${s}px ${SERIF}`, 760, 1, 84, 44);
      ctx.fillText(place.lines[0], px + 10, py + ph + 70 + place.px + 4);
      if (p.caption.trim()) {
        const cap = fitText(ctx, `“${p.caption.trim()}”`, (s) => `italic 400 ${s}px ${SERIF}`, 820, 3, 44, 30);
        ctx.fillStyle = C.gold3;
        cap.lines.forEach((l, i) => ctx.fillText(l, px + 860, py + ph + 80 + i * cap.px * 1.25));
      }
      ctx.fillStyle = "rgba(246,239,226,0.75)";
      ctx.font = `500 28px ${SANS}`;
      if (p.date) ctx.fillText(p.date, px + 10, H - SAFE - 120);
      if (p.arabic) arabicLine(ctx, W - SAFE - 10, H - SAFE - 112, C.gold2, 46);
      brand(ctx, W / 2 - 160, H - SAFE + 4, C.ivory, C.gold2);
      break;
    }
    case "cairo-night": {
      ctx.fillStyle = C.night;
      ctx.fillRect(0, 0, W, H);
      starPattern(ctx, W * 0.5, 0, W * 0.5, H, 120, "rgba(201,163,90,0.18)");
      const ax = SAFE + 20,
        ay = SAFE,
        aw = 760,
        ah = H - 2 * SAFE;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ax, ay + ah);
      ctx.lineTo(ax, ay + aw * 0.5);
      ctx.quadraticCurveTo(ax, ay, ax + aw / 2, ay);
      ctx.quadraticCurveTo(ax + aw, ay, ax + aw, ay + aw * 0.5);
      ctx.lineTo(ax + aw, ay + ah);
      ctx.closePath();
      ctx.clip();
      photoOrPlaceholder(ctx, p, ax, ay, aw, ah);
      ctx.restore();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ax - 14, ay + ah + 2);
      ctx.lineTo(ax - 14, ay + aw * 0.5);
      ctx.quadraticCurveTo(ax - 14, ay - 14, ax + aw / 2, ay - 14);
      ctx.quadraticCurveTo(ax + aw + 14, ay - 14, ax + aw + 14, ay + aw * 0.5);
      ctx.lineTo(ax + aw + 14, ay + ah + 2);
      ctx.stroke();
      // a hanging lantern
      const lx = W - SAFE - 120;
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, SAFE + 40);
      ctx.stroke();
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.moveTo(lx - 30, SAFE + 60);
      ctx.lineTo(lx + 30, SAFE + 60);
      ctx.lineTo(lx + 22, SAFE + 140);
      ctx.lineTo(lx - 22, SAFE + 140);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(240,220,176,0.25)";
      ctx.beginPath();
      ctx.arc(lx, SAFE + 100, 90, 0, Math.PI * 2);
      ctx.fill();
      textBlock(ctx, p, ax + aw + 110, SAFE + 260, W - (ax + aw + 110) - SAFE - 40, { kicker: C.gold2, place: C.ivory, caption: C.gold3, date: "rgba(246,239,226,0.7)" });
      if (p.arabic) arabicLine(ctx, W - SAFE - 40, H - SAFE - 140, C.gold2);
      brand(ctx, ax + aw + 110, H - SAFE - 40, C.ivory, C.gold);
      break;
    }
    case "desert": {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#f6e3bf");
      g.addColorStop(1, C.sand);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const ph = Math.round(H * 0.6);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, ph - 60);
      ctx.bezierCurveTo(W * 0.7, ph + 60, W * 0.45, ph - 120, 0, ph + 30);
      ctx.closePath();
      ctx.clip();
      photoOrPlaceholder(ctx, p, 0, 0, W, ph + 60);
      ctx.restore();
      ctx.strokeStyle = C.sand2;
      ctx.lineWidth = 3;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.moveTo(0, ph + 30 + k * 34);
        ctx.bezierCurveTo(W * 0.45, ph - 120 + k * 34, W * 0.7, ph + 60 + k * 34, W, ph - 60 + k * 34);
        ctx.globalAlpha = 0.6 - k * 0.15;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.fillStyle = "#9a6a2f";
      ctx.font = `600 24px ${SANS}`;
      ctx.letterSpacing = "6px";
      ctx.fillText("GREETINGS FROM", SAFE + 20, H - SAFE - 250);
      ctx.restore();
      const place = fitText(ctx, p.place || "Egypt", (s) => `500 ${s}px ${SERIF}`, 820, 1, 90, 44);
      ctx.fillStyle = C.ink;
      ctx.fillText(place.lines[0], SAFE + 20, H - SAFE - 250 + place.px + 6);
      if (p.caption.trim()) {
        const cap = fitText(ctx, `“${p.caption.trim()}”`, (s) => `italic 400 ${s}px ${SERIF}`, 780, 3, 44, 30);
        ctx.fillStyle = "#4a3826";
        cap.lines.forEach((l, i) => ctx.fillText(l, W - SAFE - 800, H - SAFE - 240 + i * cap.px * 1.25));
      }
      ctx.fillStyle = C.muted;
      ctx.font = `500 28px ${SANS}`;
      if (p.date) ctx.fillText(p.date, SAFE + 20, H - SAFE - 40);
      if (p.arabic) arabicLine(ctx, W - SAFE - 20, H - SAFE - 30, "#9a6a2f", 46);
      brand(ctx, W / 2 - 160, H - SAFE - 30, C.ink, "#9a6a2f");
      break;
    }
  }
  return canvas;
}

/** The back of the card for the print PDF: the story, a stamp box, address lines and branding. */
export function drawPostcardBack(canvas: HTMLCanvasElement, opts: { story: string; place: string; date: string; challenge?: string }) {
  canvas.width = CARD.w;
  canvas.height = CARD.h;
  const ctx = canvas.getContext("2d")!;
  const W = CARD.w,
    H = CARD.h;
  ctx.fillStyle = "#fbf6ea";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, SAFE + 40);
  ctx.lineTo(W / 2, H - SAFE - 40);
  ctx.stroke();
  // story
  const x = SAFE + 30,
    w = W / 2 - x - 50;
  ctx.fillStyle = "#9a7533";
  ctx.font = `600 22px ${SANS}`;
  ctx.letterSpacing = "5px";
  ctx.fillText((opts.challenge ? opts.challenge : "A memory").toUpperCase().slice(0, 40), x, SAFE + 60);
  ctx.letterSpacing = "0px";
  const story = opts.story.trim() || "";
  const s = fitText(ctx, story || " ", (px) => `400 ${px}px ${SERIF}`, w, 13, 40, 24);
  ctx.fillStyle = C.ink;
  s.lines.forEach((l, i) => ctx.fillText(l, x, SAFE + 130 + i * s.px * 1.45));
  ctx.fillStyle = C.muted;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText([opts.place, opts.date].filter(Boolean).join(" · "), x, H - SAFE - 40);
  // stamp box
  ctx.strokeStyle = C.gold;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(W - SAFE - 230, SAFE + 30, 200, 240);
  ctx.setLineDash([]);
  ctx.fillStyle = C.gold;
  ctx.font = `600 20px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("STAMP", W - SAFE - 130, SAFE + 160);
  ctx.textAlign = "left";
  // address lines
  ctx.strokeStyle = "#cdb88f";
  ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const y = H / 2 + 40 + k * 110;
    ctx.beginPath();
    ctx.moveTo(W / 2 + 60, y);
    ctx.lineTo(W - SAFE - 30, y);
    ctx.stroke();
  }
  brand(ctx, W / 2 + 60, H - SAFE - 30, C.ink, C.gold);
  return canvas;
}

/** Fonts used on the card must be loaded before drawing, or the browser silently falls back. */
export async function loadPostcardFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`500 40px 'Fraunces Variable'`),
    document.fonts.load(`italic 400 40px 'Fraunces Variable'`),
    document.fonts.load(`600 24px 'Inter Variable'`),
    document.fonts.load(`700 40px Amiri`, ARABIC_LINE),
    document.fonts.load(`40px 'Noto Sans Egyptian Hieroglyphs'`, BORDER_SIGNS.join("")),
  ]);
}

export function formatVisitDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
