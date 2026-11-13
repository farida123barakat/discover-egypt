import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { expect, test } from "@playwright/test";

/** A photo-like test image: an owl (G17, the sound m) in brown on a sandstone gradient with a light grain. */
function owlPhoto(): string {
  GlobalFonts.registerFromPath(path.join(process.cwd(), "node_modules/@fontsource/noto-sans-egyptian-hieroglyphs/files/noto-sans-egyptian-hieroglyphs-egyptian-hieroglyphs-400-normal.woff2"), "NotoHiero");
  const c = createCanvas(600, 480);
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 600, 480);
  g.addColorStop(0, "#e2cfa8");
  g.addColorStop(1, "#b89a6c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 600, 480);
  ctx.font = '260px "NotoHiero"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#4a3218";
  ctx.fillText(String.fromCodePoint(0x13153), 300, 250);
  const file = path.join(os.tmpdir(), "owl-sign.png");
  writeFileSync(file, c.toBuffer("image/png"));
  return file;
}

test.describe("hieroglyphics explorer", () => {
  test("upload a photo, crop, and get an honest identification", async ({ page }) => {
    await page.goto("/hieroglyphs");
    const scanner = page.locator("#scan");
    await scanner.locator('input[type="file"]').setInputFiles(owlPhoto());
    await expect(scanner.getByRole("heading", { name: "Adjust your photo" })).toBeVisible();
    // keyboard-adjust the crop frame, then identify
    const frame = scanner.getByRole("slider", { name: /Crop frame/ });
    await frame.focus();
    await page.keyboard.press("Shift+ArrowRight");
    await scanner.getByRole("button", { name: "Identify sign" }).click();
    const status = scanner.getByRole("status");
    await expect(status).toContainText(/Most likely: Owl \(G17\)/, { timeout: 15_000 });
    await expect(scanner.getByText("What the computer saw.")).toBeVisible();
    await expect(scanner.getByText(/does not translate inscriptions/)).toBeVisible();
    // open the details of the top match
    await scanner.getByRole("button", { name: /Owl G17/ }).click();
    const dialog = page.getByRole("dialog", { name: "Owl" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Gardiner G17")).toBeVisible();
    await expect(dialog.getByText(/awaiting review by an Egyptologist/)).toBeAttached();
  });

  test("practice image works without a camera and is labelled as not real", async ({ page }) => {
    await page.goto("/hieroglyphs");
    const scanner = page.locator("#scan");
    await scanner.getByRole("button", { name: /Try a practice image/ }).click();
    await expect(scanner.getByText(/not a real inscription/)).toBeVisible();
    await scanner.getByRole("button", { name: "Identify sign" }).click();
    // Either a confident answer or an honest "not sure" with named candidates — never a silent failure.
    await expect(scanner.getByRole("status")).toContainText(/Most likely|Not sure — it could be/, { timeout: 15_000 });
    await expect(scanner.getByRole("heading", { name: "Closest matches" })).toBeVisible();
  });

  test("a blank photo gets 'couldn't find a clear sign', not a guess", async ({ page }) => {
    const c = createCanvas(400, 300);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#d8c3a0";
    ctx.fillRect(0, 0, 400, 300);
    const file = path.join(os.tmpdir(), "blank-wall.png");
    writeFileSync(file, c.toBuffer("image/png"));
    await page.goto("/hieroglyphs");
    await page.locator('#scan input[type="file"]').setInputFiles(file);
    await page.getByRole("button", { name: "Identify sign" }).click();
    await expect(page.locator("#scan").getByRole("status")).toContainText(/couldn't find a clear sign/);
  });

  test("library search, filters and the quiz", async ({ page }) => {
    await page.goto("/hieroglyphs#learn");
    await page.getByRole("searchbox", { name: "Search signs" }).fill("ankh");
    await expect(page.getByText("1 of 57 signs")).toBeVisible();
    await page.getByRole("searchbox", { name: "Search signs" }).fill("");
    await page.getByRole("group", { name: "Filter signs" }).getByRole("button", { name: "Silent helpers" }).click();
    await expect(page.locator("p[aria-live]", { hasText: "of 57 signs" })).toHaveText("8 of 57 signs");

    const quiz = page.locator("#practice .card").first();
    for (let i = 0; i < 8; i++) {
      await quiz.getByRole("group", { name: "Answers" }).getByRole("button").first().click();
      await quiz.getByRole("button", { name: /Next|See score/ }).click();
    }
    await expect(quiz.getByText(/\d \/ 8/)).toBeVisible();
    await quiz.getByRole("button", { name: "New round" }).click();
    await expect(quiz.getByText("Question 1 of 8")).toBeVisible();
  });

  test("draw-the-sign challenge judges a drawing", async ({ page }) => {
    await page.goto("/hieroglyphs#practice");
    const canvas = page.getByRole("img", { name: /Drawing area/ });
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    // draw a large circle with a dot (sun) — whatever the target, the checker must respond
    await page.mouse.move(box.x + 140 + 90, box.y + 140);
    await page.mouse.down();
    for (let a = 0; a <= 64; a++) await page.mouse.move(box.x + 140 + 90 * Math.cos((a / 64) * 2 * Math.PI), box.y + 140 + 90 * Math.sin((a / 64) * 2 * Math.PI));
    await page.mouse.up();
    await page.getByRole("button", { name: "Check my drawing" }).click();
    await expect(page.getByText(/Recognised!|looks more like|Close —/)).toBeVisible();
  });

  test("writes a name in a cartouche, labelled as a modern spelling", async ({ page }) => {
    await page.goto("/hieroglyphs#name");
    await page.getByLabel("Your name, in hieroglyphs").fill("Farida");
    await expect(page.getByRole("img", { name: "Hieroglyph spelling: I9, G1, D21, M17, D46, G1" })).toBeVisible();
    await expect(page.getByText(/not how a real Egyptian would have written your name/)).toBeVisible();
  });
});

test.describe("camera", () => {
  test("opens the camera (fake device), captures and moves to editing", async ({ page }) => {
    await page.goto("/hieroglyphs");
    await page.getByRole("button", { name: "Use camera" }).click();
    await expect(page.getByLabel("Camera preview")).toBeVisible();
    await page.waitForFunction(() => (document.querySelector('video[aria-label="Camera preview"]') as HTMLVideoElement)?.videoWidth > 0);
    await page.getByRole("button", { name: "Take photo" }).click();
    await expect(page.getByRole("heading", { name: "Adjust your photo" })).toBeVisible();
  });
});
