"use client";
import { glyph, signs } from "@/content/hieroglyphs";
import { buildReferences, recognise, type CanvasFactory, type Pixels, type Ref } from "./glyph-recognition";

export const HIERO_FONT = "Noto Sans Egyptian Hieroglyphs";
const make: CanvasFactory = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c as unknown as ReturnType<CanvasFactory>;
};

let refsPromise: Promise<Ref[]> | null = null;

/** Builds reference features once per page, after the hieroglyph font has loaded. */
export function loadReferences(): Promise<Ref[]> {
  refsPromise ??= (async () => {
    await document.fonts.load(`64px "${HIERO_FONT}"`, glyph(signs[0]));
    await new Promise((r) => setTimeout(r, 0));
    return buildReferences(make, signs.map((s) => ({ code: s.gardiner, ch: glyph(s) })), HIERO_FONT);
  })();
  return refsPromise;
}

export async function recogniseCanvas(canvas: HTMLCanvasElement, invert?: boolean) {
  const refs = await loadReferences();
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height) as unknown as Pixels;
  return recognise(img, refs, invert);
}

/** Practice image rendered from the font — clearly labelled in the UI as not a real inscription. */
export function practiceImage(code: string): HTMLCanvasElement {
  const s = signs.find((x) => x.gardiner === code)!;
  const c = document.createElement("canvas");
  c.width = c.height = 360;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 360, 360);
  g.addColorStop(0, "#e9d9b8");
  g.addColorStop(1, "#c9ad80");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 360, 360);
  ctx.translate(180, 185);
  ctx.rotate(-0.06);
  ctx.font = `220px "${HIERO_FONT}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5a3d1e";
  ctx.fillText(glyph(s), 0, 0);
  return c;
}
