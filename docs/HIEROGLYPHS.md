# Hieroglyphics Explorer — how it works

Page: `/hieroglyphs` · Code: `src/content/hieroglyphs.ts`, `src/lib/glyph-recognition.ts`, `src/components/hieroglyphs/*`

## What visitors can do

| Feature | Notes |
| --- | --- |
| **Scan a sign** | Camera (rear camera on phones) or upload. Crop frame (drag, or arrow keys), rotate, straighten, brightness, contrast, "darker / lighter than the stone". |
| **Results** | Up to three candidate signs with a match bar, a status (*Most likely* / *Not sure* / *Can't match* / *No clear sign*), and "what the computer saw". Tap a candidate for full details. |
| **Sign library** | 57 signs: all 25 uniliteral sound signs, common word signs, royal and divine signs, determinatives. Search and filter. |
| **Lessons** | Six beginner lessons, including reading direction and how signs combine (jmn, "Amun"). |
| **Quiz** | 8-question rounds: sound, meaning, and "find the sign". |
| **Draw the sign** | Draw with mouse or finger; the recogniser judges it. |
| **Your name in a cartouche** | Clearly labelled as a modern, playful spelling — not an ancient one. |

## Recognition engine (free, private, on-device)

Investigated first:

- **Morris Franken "Pyramid of Unas" dataset** (4,210 sign images, 171 Gardiner classes) and the MIT-licensed `glyphreader` code. The images are crops of photographs from A. Piankoff's 1955 book; their licence is not stated and the dataset is hosted outside the repository. **Not used**, so the public site does not redistribute a model trained on images of unclear rights. It is the obvious next step if a licence is confirmed.
- Recent research (ResNet / MobileNet classifiers, multi-style datasets) needs either those datasets or a GPU training budget.

Built instead — classic computer vision, no machine-learning model:

1. Grayscale → light blur → **remove lighting gradient** (least-squares plane fit) → Otsu threshold. Ink is the minority side, so painted (dark) and relief (light) signs both work, or the visitor can choose.
2. Crop to the ink, pad to a square, resample to 40 × 40.
3. Features: 8 × 8 ink-density zones + 4 × 4 × 8 gradient-orientation histograms (HOG-style) + aspect ratio.
4. Cosine similarity against 7 renderings of each sign (rotations and stroke weights) from **Noto Sans Egyptian Hieroglyphs** (SIL OFL), drawn in the visitor's browser.
5. Decision: *recognised* only if score ≥ 0.86 **and** it beats the runner-up by ≥ 0.025; *unrecognised* below 0.72; otherwise *not sure*.

Nothing is uploaded or stored. The camera needs HTTPS (or localhost); `Permissions-Policy` allows `camera=(self)`.

## Benchmark (synthetic) — `npx tsx scripts/eval-glyphs.ts`

Test images are drawn from the same font but with **different** distortions from the references: rotation ±12°, stroke weight, scale, offset, uneven lighting, low contrast, 30 % light-on-dark relief, blur and noise. The *hard* set doubles noise, blur and lighting.

```

STANDARD set — 570 images, 57 signs
top-1 99.3% · top-3 99.3% · no sign found 0.0%
  recognise if score≥0.8 & margin≥0.01: answers 99.1% of images, precision 99.6%
  recognise if score≥0.84 & margin≥0.02: answers 97.9% of images, precision 100.0%
  recognise if score≥0.86 & margin≥0.025: answers 97.7% of images, precision 100.0%
  recognise if score≥0.88 & margin≥0.03: answers 96.3% of images, precision 100.0%
  recognise if score≥0.9 & margin≥0.04: answers 93.0% of images, precision 100.0%
  current thresholds → recognised 97.7%, uncertain 2.1%, unrecognised 0.2%

HARD set — 570 images, 57 signs
top-1 97.2% · top-3 98.2% · no sign found 0.0%
  recognise if score≥0.8 & margin≥0.01: answers 96.0% of images, precision 99.3%
  recognise if score≥0.84 & margin≥0.02: answers 93.2% of images, precision 99.2%
  recognise if score≥0.86 & margin≥0.025: answers 91.6% of images, precision 99.6%
  recognise if score≥0.88 & margin≥0.03: answers 88.8% of images, precision 99.6%
  recognise if score≥0.9 & margin≥0.04: answers 83.0% of images, precision 99.8%
  current thresholds → recognised 91.6%, uncertain 6.7%, unrecognised 1.8%

NON-HIEROGLYPHS — 120 images (Latin letters, digits, random blobs)
  wrongly "recognised" 0.0% · uncertain 18.3% · unrecognised/empty 81.7%
```

**Reading this:** when it says *Most likely*, it is right ~99 % of the time on these tests, and it never gave a confident answer for letters, digits or random shapes.

## Honest limits

- **Synthetic ≠ real.** Real inscriptions differ in carving style, wear, paint loss, perspective and shadows. Expect more *Not sure* answers on real photos. A real-photo test set (with rights cleared) is the most valuable next step.
- **One sign at a time.** It does not segment whole inscriptions or translate texts.
- **57 signs**, not the ~700 of classical Middle Egyptian. Anything else should come back as *Not sure* or *Can't match*.
- Sign meanings are an **editorial draft** based on Gardiner (1957) and Allen (2014), marked "awaiting review by an Egyptologist" until a specialist checks them.
- Code points were verified against the Unicode Character Database by official sign name (57/57).
