"use client";
/**
 * Memory Passport as a PDF, made entirely on the device (jsPDF).
 *
 * - "booklet": A4 landscape sheets, two passport pages side by side in saddle-stitch order.
 *   Print double-sided (flip on the short edge) at actual size, stack, fold in half, staple on the fold.
 * - "pages": one passport page per PDF page at 94 × 131 mm (88 × 125 mm trim + 3 mm bleed), for a print shop.
 */
import type { jsPDF } from "jspdf";
import type { Memory } from "./memories";
import { loadPostcardFonts, MM } from "./postcard";
import { closePhotos, drawPassportPage, loadPhotos, PAGE } from "./passport";
import { bookletSheets, PASSPORT_BLEED_MM, PASSPORT_MM, planPassport } from "./passport-plan";

export type PassportLayout = "booklet" | "pages";

const A4 = { w: 297, h: 210 }; // landscape, mm
const SPREAD = { w: PASSPORT_MM.w * 2, h: PASSPORT_MM.h };
const ORIGIN = { x: (A4.w - SPREAD.w) / 2, y: (A4.h - SPREAD.h) / 2 };

/** A page cut to its trim size (no bleed): the inner edges of a spread meet exactly at the fold. */
function trimmed(src: HTMLCanvasElement) {
  const b = PASSPORT_BLEED_MM * MM;
  const c = document.createElement("canvas");
  c.width = PAGE.w - 2 * b;
  c.height = PAGE.h - 2 * b;
  c.getContext("2d")!.drawImage(src, b, b, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

export function passportFileName(layout: PassportLayout) {
  return layout === "booklet" ? "discover-egypt-memory-passport-booklet-a4.pdf" : "discover-egypt-memory-passport-print-shop.pdf";
}

export async function passportPdf(memories: Memory[], opts: { name?: string; layout: PassportLayout }) {
  await loadPostcardFonts();
  const { jsPDF: PDF } = await import("jspdf");
  const plan = planPassport(memories, { name: opts.name });
  const photos = await loadPhotos(memories);
  const canvas = document.createElement("canvas");
  const render = (i: number) => drawPassportPage(canvas, plan.pages[i], i, memories, photos);
  try {
    if (opts.layout === "pages") {
      const w = PASSPORT_MM.w + 2 * PASSPORT_BLEED_MM,
        h = PASSPORT_MM.h + 2 * PASSPORT_BLEED_MM;
      const doc = new PDF({ unit: "mm", format: [w, h], orientation: "portrait" });
      doc.setProperties({ title: "Memory Passport", creator: "Discover Egypt", subject: `Souvenir booklet: ${plan.pages.length} pages, trim ${PASSPORT_MM.w} × ${PASSPORT_MM.h} mm, ${PASSPORT_BLEED_MM} mm bleed` });
      plan.pages.forEach((_, i) => {
        if (i) doc.addPage([w, h], "portrait");
        doc.addImage(render(i).toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, w, h);
      });
      return doc.output("blob");
    }

    const doc = new PDF({ unit: "mm", format: "a4", orientation: "landscape" });
    doc.setProperties({ title: "Memory Passport (booklet)", creator: "Discover Egypt", subject: "Print double-sided, flip on short edge, actual size. Fold in half and staple on the fold." });
    const sheets = bookletSheets(plan.pages.length);
    let first = true;
    sheets.forEach((sheet, s) => {
      for (const [side, pair] of [
        ["front", sheet.front],
        ["back", sheet.back],
      ] as const) {
        if (!first) doc.addPage("a4", "landscape");
        first = false;
        pair.forEach((pageIndex, k) => {
          const img = trimmed(render(pageIndex)).toDataURL("image/jpeg", 0.9);
          doc.addImage(img, "JPEG", ORIGIN.x + k * PASSPORT_MM.w, ORIGIN.y, PASSPORT_MM.w, PASSPORT_MM.h);
        });
        marks(doc);
        doc.setFontSize(7);
        doc.setTextColor(120, 110, 95);
        doc.text(`Memory Passport · sheet ${s + 1} of ${sheets.length}, ${side} · print double-sided, flip on short edge, actual size (100%)`, A4.w / 2, A4.h - 8, { align: "center" });
      }
    });
    return doc.output("blob");
  } finally {
    closePhotos(photos);
  }
}

/** Crop marks at the corners of the spread and fold marks above and below its middle. */
function marks(doc: jsPDF) {
  const { x, y } = ORIGIN;
  const x2 = x + SPREAD.w,
    y2 = y + SPREAD.h,
    gap = 2,
    len = 6;
  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(0.2);
  for (const [cx, cy, dx, dy] of [
    [x, y, -1, -1],
    [x2, y, 1, -1],
    [x, y2, -1, 1],
    [x2, y2, 1, 1],
  ]) {
    doc.line(cx + dx * gap, cy, cx + dx * (gap + len), cy);
    doc.line(cx, cy + dy * gap, cx, cy + dy * (gap + len));
  }
  const mid = x + SPREAD.w / 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(mid, y - gap - len, mid, y - gap);
  doc.line(mid, y2 + gap, mid, y2 + gap + len);
  doc.setLineDashPattern([], 0);
}
