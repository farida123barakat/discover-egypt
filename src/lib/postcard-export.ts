"use client";
/** Turn memories into postcard images and print-ready PDFs, entirely on the device (jsPDF). */
import { getDestination } from "@/content/destinations";
import { challengeById, huntStats } from "@/content/hunt";
import type { Memory } from "./memories";
import { completedChallenges } from "./memories";
import { BLEED_MM, CARD, TRIM_MM, drawPostcard, drawPostcardBack, formatVisitDate, loadPostcardFonts } from "./postcard";

export function placeName(m: Pick<Memory, "destination">) {
  return (m.destination && getDestination(m.destination)?.name) || "Egypt";
}

export async function renderFront(m: Memory, canvas = document.createElement("canvas")) {
  await loadPostcardFonts();
  let bmp: ImageBitmap | null = null;
  try {
    if (m.photo) bmp = await createImageBitmap(m.photo);
  } catch {
    bmp = null; // draw the illustrated placeholder instead
  }
  drawPostcard(canvas, {
    photo: bmp,
    photoSize: bmp ? { w: bmp.width, h: bmp.height } : undefined,
    caption: m.caption,
    place: placeName(m),
    date: formatVisitDate(m.visitDate),
    template: m.template,
    arabic: m.arabic,
  });
  bmp?.close();
  return canvas;
}

async function renderBack(m: Memory) {
  await loadPostcardFonts();
  return drawPostcardBack(document.createElement("canvas"), { story: m.story || m.caption, place: placeName(m), date: formatVisitDate(m.visitDate), challenge: challengeById(m.challengeId)?.title });
}

const toBlob = (c: HTMLCanvasElement, type = "image/jpeg", q = 0.92) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not create image"))), type, q));

export async function postcardImage(m: Memory) {
  return toBlob(await renderFront(m));
}

export function fileSlug(m: Memory) {
  const base = `${placeName(m)}-${m.visitDate ?? m.createdAt.slice(0, 10)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `discover-egypt-postcard-${base}`.replace(/-+$/, "");
}

/** Print-ready postcard: A6 (148 × 105 mm) + 3 mm bleed, front and back, ~305 dpi. */
export async function postcardPdf(m: Memory) {
  const { jsPDF } = await import("jspdf");
  const w = TRIM_MM.w + 2 * BLEED_MM,
    h = TRIM_MM.h + 2 * BLEED_MM;
  const doc = new jsPDF({ unit: "mm", format: [w, h], orientation: "landscape" });
  doc.setProperties({ title: `Postcard from ${placeName(m)}`, creator: "Discover Egypt", subject: "Print-ready postcard: trim 148 × 105 mm, 3 mm bleed" });
  doc.addImage((await renderFront(m)).toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  doc.addPage([w, h], "landscape");
  doc.addImage((await renderBack(m)).toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  return doc.output("blob");
}

/** The whole album as an A4 PDF: a cover with progress, then one page per memory grouped by place. */
export async function albumPdf(memories: Memory[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = huntStats(completedChallenges(memories), memories.length);
  doc.setProperties({ title: "My Egypt album", creator: "Discover Egypt" });
  const gold: [number, number, number] = [154, 117, 51];
  const ink: [number, number, number] = [42, 29, 20];
  // cover
  doc.setFillColor(246, 239, 226);
  doc.rect(0, 0, 210, 297, "F");
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, 186, 273);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DISCOVER EGYPT · MEMORY HUNT", 105, 70, { align: "center", charSpace: 1 });
  doc.setTextColor(...ink);
  doc.setFont("times", "normal");
  doc.setFontSize(40);
  doc.text("My Egypt album", 105, 95, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(`${memories.length} ${memories.length === 1 ? "memory" : "memories"} · ${stats.completed} of ${stats.total} challenges · ${stats.points} points`, 105, 112, { align: "center" });
  const earned = stats.achievements.filter((a) => a.earned);
  if (earned.length) {
    doc.setFontSize(11);
    doc.setTextColor(...gold);
    doc.text("ACHIEVEMENTS", 105, 140, { align: "center", charSpace: 1 });
    doc.setTextColor(...ink);
    earned.forEach((a, i) => doc.text(`${a.title} — ${a.detail}`, 105, 150 + i * 8, { align: "center" }));
  }
  doc.setFontSize(9);
  doc.setTextColor(120, 110, 95);
  doc.text("Made on your device. Your photos were never uploaded to make this album.", 105, 272, { align: "center" });

  const groups = new Map<string, Memory[]>();
  for (const m of [...memories].sort((a, b) => (a.visitDate ?? a.createdAt).localeCompare(b.visitDate ?? b.createdAt))) {
    const k = placeName(m);
    groups.set(k, [...(groups.get(k) ?? []), m]);
  }
  for (const [place, list] of groups) {
    for (const [i, m] of list.entries()) {
      doc.addPage();
      doc.setFillColor(251, 246, 234);
      doc.rect(0, 0, 210, 297, "F");
      if (i === 0) {
        doc.setTextColor(...gold);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("PLACE", 20, 24, { charSpace: 1 });
        doc.setTextColor(...ink);
        doc.setFont("times", "normal");
        doc.setFontSize(28);
        doc.text(place, 20, 36);
      }
      const imgW = 170,
        imgH = (imgW * CARD.h) / CARD.w;
      doc.addImage((await renderFront(m)).toDataURL("image/jpeg", 0.85), "JPEG", 20, 46, imgW, imgH);
      let y = 46 + imgH + 14;
      const ch = challengeById(m.challengeId);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 110, 95);
      doc.text([formatVisitDate(m.visitDate), ch ? `Challenge: ${ch.title}` : ""].filter(Boolean).join("   ·   "), 20, y);
      y += 10;
      if (m.caption.trim()) {
        doc.setFont("times", "italic");
        doc.setFontSize(16);
        doc.setTextColor(...ink);
        const lines = doc.splitTextToSize(`“${m.caption.trim()}”`, 170) as string[];
        doc.text(lines, 20, y);
        y += lines.length * 7 + 4;
      }
      if (m.story.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...ink);
        const lines = (doc.splitTextToSize(m.story.trim(), 170) as string[]).slice(0, 22);
        doc.text(lines, 20, y, { lineHeightFactor: 1.5 });
      }
    }
  }
  return doc.output("blob");
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
