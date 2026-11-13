/**
 * Render the original explainers to MP4 + WebVTT (captions and chapters) in public/media.
 *
 *   npx tsx scripts/render-explainers.ts            # all films
 *   npx tsx scripts/render-explainers.ts --only nile-three-seasons --fps 12
 *   npx tsx scripts/render-explainers.ts --preview  # stills only, one per chapter
 *
 * Needs ffmpeg (libx264) and a Chrome/Chromium (CHROME_PATH, or Playwright's own).
 * Zero cost: no paid APIs, no stock footage — every frame is drawn from src/content/explainers.ts.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { explainers, timeline, toChapterVtt, toVtt } from "../src/content/explainers";

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const FPS = Number(opt("--fps") ?? 12);
const ONLY = opt("--only");
const PREVIEW = args.includes("--preview");
const STILLS = args.includes("--stills"); // posters, backdrops and VTT only (no video)
const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "media");
const WORK = path.join(ROOT, ".render");

const font = (pkg: string, file: string) => pathToFileURL(path.join(ROOT, "node_modules", pkg, "files", file)).href;

function html() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Fraunces Variable';src:url(${font("@fontsource-variable/fraunces", "fraunces-latin-wght-normal.woff2")}) format('woff2');font-weight:100 900;font-style:normal}
@font-face{font-family:'Fraunces Variable';src:url(${font("@fontsource-variable/fraunces", "fraunces-latin-wght-italic.woff2")}) format('woff2');font-weight:100 900;font-style:italic}
@font-face{font-family:'Inter Variable';src:url(${font("@fontsource-variable/inter", "inter-latin-wght-normal.woff2")}) format('woff2');font-weight:100 900}
html,body{margin:0;background:#0a1220;overflow:hidden}#stage{width:1280px;height:720px}
</style></head><body><div id="stage"></div><svg width="0" height="0" style="position:absolute"><path id="probe" d="M0 0"/></svg>
<script src="${pathToFileURL(path.join(ROOT, "scripts", "explainer-scenes.js")).href}"></script></body></html>`;
}

function encoder(file: string) {
  const ff = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "veryfast", "-tune", "animation", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise<void>((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));
  return { ff, done };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(WORK, { recursive: true });
  const page_ = path.join(WORK, "stage.html");
  await writeFile(page_, html());
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(page_).href);
  await page.evaluate(() => document.fonts.ready);

  for (const e of explainers.filter((x) => !ONLY || x.id === ONLY)) {
    const { cues, chapters, duration } = timeline(e);
    await page.evaluate((d) => (window as unknown as { setup: (x: unknown) => void }).setup(d), { chapters: e.chapters, timed: chapters, total: duration, title: e.title.split(" — ")[0] });
    const paint = (t: number) => page.evaluate((tt) => (window as unknown as { paint: (x: number) => void }).paint(tt), t);

    if (PREVIEW) {
      for (const c of chapters) {
        await paint(c.start + (c.end - c.start) * 0.7);
        await page.screenshot({ path: path.join(WORK, `${e.id}-${String(c.index + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 85 });
      }
      console.log(`${e.id}: ${chapters.length} preview stills in .render/`);
      continue;
    }

    const file = path.join(OUT, `${e.id}.mp4`);
    const frames = STILLS ? 0 : Math.ceil(duration * FPS);
    const { ff, done } = STILLS ? { ff: null, done: Promise.resolve() } : encoder(file);
    const t0 = Date.now();
    for (let f = 0; f < frames && ff; f++) {
      await paint(f / FPS);
      const buf = await page.screenshot({ type: "jpeg", quality: 90 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % (FPS * 30) === 0) console.log(`${e.id}: ${Math.round((f / frames) * 100)}%`);
    }
    ff?.stdin.end();
    await done;

    // Poster: the title card once the headline has settled.
    await paint(Math.min(3.2, chapters[0].end - 0.5));
    await page.screenshot({ path: path.join(OUT, `${e.id}-poster.jpg`), type: "jpeg", quality: 82 });
    // Backdrop: the same title scene with no text, for page heroes behind other headlines.
    await page.evaluate((d) => (window as unknown as { setup: (x: unknown) => void }).setup(d), { chapters: e.chapters, timed: chapters, total: duration, title: "", bare: true });
    await paint(Math.min(3.2, chapters[0].end - 0.5));
    await page.screenshot({ path: path.join(OUT, `${e.id}-backdrop.jpg`), type: "jpeg", quality: 80 });
    await writeFile(path.join(OUT, `${e.id}.en.vtt`), toVtt(cues));
    await writeFile(path.join(OUT, `${e.id}.chapters.vtt`), toChapterVtt(chapters));
    console.log(`${e.id}: ${frames} frames, ${duration.toFixed(1)} s, rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
