import { chromium } from "playwright";
const [,, url, out, w = "1440", h = "900", full = "0"] = process.argv;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage({ viewport: { width: +w, height: +h }, reducedMotion: "reduce" });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && !/ERR_TUNNEL|Failed to load resource/.test(m.text()) && errs.push(m.text().slice(0, 160)));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
if (full === "1") {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1200);
}
await p.screenshot({ path: out, fullPage: full === "1" });
console.log(errs.join("\n") || "no errors");
await b.close();
