export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Identify an image from its first bytes. Returns null for anything else (SVG, HTML, executables…). */
export function detectImageType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return { mime: "image/png", ext: "png" };
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
}
