import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ADMIN, linkFromEmail, PASSWORD, uniqueEmail } from "./helpers";

/**
 * The recorded demo: a visitor tour of the site running on a real Supabase database, from sign-up to
 * the Memory Passport, then the admin dashboard. CI publishes the video and screenshots (see ci.yml).
 */
const OUT = path.join(process.cwd(), "demo-output");
mkdirSync(OUT, { recursive: true });
let n = 0;
async function shot(page: Page, name: string) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${String(++n).padStart(2, "0")}-${name}.png`) });
}
const pause = (page: Page, ms = 1200) => page.waitForTimeout(ms);

async function photo(page: Page) {
  const bytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 800;
    const g = c.getContext("2d")!;
    const sky = g.createLinearGradient(0, 0, 0, 800);
    sky.addColorStop(0, "#f2a65a");
    sky.addColorStop(0.6, "#f6d8a8");
    sky.addColorStop(1, "#c08a4a");
    g.fillStyle = sky;
    g.fillRect(0, 0, 1200, 800);
    g.fillStyle = "#8a5a2b";
    g.beginPath();
    g.moveTo(250, 640);
    g.lineTo(600, 220);
    g.lineTo(950, 640);
    g.fill();
    g.fillStyle = "#1f6f8b";
    g.fillRect(0, 640, 1200, 160);
    const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), "image/jpeg", 0.9));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  return { name: "felucca.jpg", mimeType: "image/jpeg", buffer: Buffer.from(bytes) };
}

test("demo tour", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // 1. Home
  await page.goto("/");
  await pause(page, 2200);
  await shot(page, "home");
  await page.mouse.wheel(0, 900);
  await pause(page);
  await shot(page, "home-features");

  // 2. Find your Egypt
  await page.goto("/discover#find");
  await pause(page, 1500);
  await shot(page, "discover");

  // 3. A real account: sign up, confirm by email, signed in
  const email = uniqueEmail("demo.traveller");
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email address").pressSequentially(email, { delay: 25 });
  await page.getByLabel("Choose a password").pressSequentially(PASSWORD, { delay: 25 });
  await page.getByLabel("Type the password again").fill(PASSWORD);
  await shot(page, "create-account");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Check your inbox/)).toBeVisible();
  await shot(page, "check-inbox");
  await page.goto(await linkFromEmail(email, /confirm/i));
  await expect(page.getByTestId("signed-in-as")).toContainText(email);
  await shot(page, "signed-in");

  // 4. Memory Hunt: capture a memory, then the passport
  await page.goto("/memory-hunt");
  await pause(page, 1500);
  await shot(page, "memory-hunt");
  await page.goto("/memory-hunt/new?challenge=aswan-felucca");
  await page.getByTestId("photo-input").setInputFiles(await photo(page));
  await expect(page.getByText(/Photo added/)).toBeVisible();
  await page.getByLabel("Caption").pressSequentially("Gold on the water", { delay: 40 });
  await page.getByLabel("Your story (optional)").fill("The captain sang the whole way back to the Corniche.");
  await page.getByRole("radiogroup", { name: "Postcard design" }).getByRole("radio", { name: /The Nile/ }).click();
  await expect(page.getByTestId("postcard-canvas")).toHaveAttribute("data-ready", "true");
  await shot(page, "postcard-editor");
  await page.getByRole("button", { name: "Save to my album" }).click();
  await expect(page.getByText("Memory saved to your album.")).toBeVisible();
  const book = page.getByTestId("passport-book");
  await book.scrollIntoViewIfNeeded();
  await book.getByLabel("Name in your passport (optional)").pressSequentially("Maya Jensen", { delay: 40 });
  await expect(book.getByRole("img", { name: /Cover/ })).toHaveAttribute("data-ready", "true");
  await shot(page, "passport-cover");
  for (const name of ["passport-traveller-and-stamps", "passport-memory"]) {
    await book.getByRole("button", { name: "Next" }).click();
    await pause(page, 1500);
    await shot(page, name);
  }
  await page.getByRole("button", { name: "Back up now" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Back up now" }).click();
  await expect(page.getByText("1 memory backed up.")).toBeVisible({ timeout: 20_000 });
  await shot(page, "backed-up");

  // 5. Hieroglyphs explorer
  await page.goto("/hieroglyphs#learn");
  await pause(page, 1500);
  await shot(page, "hieroglyphs");

  // 6. Sign out, then the admin dashboard
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("You’ve signed out on this device.")).toBeVisible();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20_000 });
  await pause(page, 1500);
  await shot(page, "admin-dashboard");
  await page.getByRole("heading", { name: "Printing partners" }).scrollIntoViewIfNeeded();
  await pause(page);
  await shot(page, "admin-printing");

  const video = page.video();
  await page.close();
  await video?.saveAs(path.join(OUT, "discover-egypt-demo.webm"));
});
