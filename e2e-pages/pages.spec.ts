import { expect, test, type Page } from "@playwright/test";

/** Same-origin requests that failed: a missing prefix shows up here as a 404 on /_next, /media or a page. */
function trackBroken(page: Page) {
  const broken: string[] = [];
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.hostname === "localhost" && r.status() >= 400) broken.push(`${r.status()} ${u.pathname}`);
  });
  return broken;
}

const PAGES = [
  ["", /You haven.t seen Egypt yet/i],
  ["discover/", /Every traveller finds a different Egypt/],
  ["discover/luxor/", /Luxor/],
  ["plan/", /Your trip, day by day/],
  ["experience/", /A living country, not a museum/],
  ["taste/", /What should I eat where I am/i],
  ["taste/koshari/", /Koshari/],
  ["hieroglyphs/", /Decode ancient Egypt/i],
  ["bucket-list/", /bucket list/i],
  ["watch/", /./],
  ["watch/great-pyramid-how/", /Pyramid/i],
  ["memory-hunt/", /Collect moments/i],
  ["memory-hunt/new/", /./],
  ["memory-hunt/album/", /My album/i],
  ["travel-smart/", /Practical, checked, honest/],
  ["my-egypt/", /Your travel dashboard/],
  ["community/", /Questions answered/],
  ["contact/", /How can we help/],
  ["account/", /Your account/],
  ["credits/", /./],
  ["privacy/", /./],
] as const;

test("every page loads under the Pages prefix with nothing missing", async ({ page }) => {
  const broken = trackBroken(page);
  for (const [path, h1] of PAGES) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first(), path).toHaveText(h1);
  }
  expect(broken).toEqual([]);
});

test("links and the menu stay inside the site", async ({ page }) => {
  const broken = trackBroken(page);
  await page.goto("");
  await page.getByRole("banner").getByRole("link", { name: "My Egypt", exact: true }).click();
  await expect(page).toHaveURL(/\/discover-egypt\/my-egypt\/$/);
  await page.goto("community/");
  await page.getByRole("link", { name: /Getting around Cairo/ }).click();
  await expect(page).toHaveURL(/\/discover-egypt\/travel-smart\/#getting-around$/);
  await page.goto("this-page-does-not-exist/").catch(() => {});
  expect(broken.filter((b) => !b.includes("this-page-does-not-exist"))).toEqual([]);
});

test("explainer film files load from the site", async ({ page }) => {
  await page.goto("watch/great-pyramid-how/");
  const poster = await page.locator("video").first().getAttribute("poster");
  expect(poster).toMatch(/^\/discover-egypt\/media\//);
  const r = await page.request.get(poster!);
  expect(r.status()).toBe(200);
});

test("no server, no accounts: forms and sign-in behave", async ({ page }) => {
  await page.goto("");
  await expect(page.getByRole("banner").getByRole("link", { name: /Sign in|My account/ })).toHaveCount(0);
  await page.goto("contact/");
  await expect(page.getByTestId("form-off").or(page.getByRole("form", { name: "Contact us" }))).toBeVisible();
  await page.goto("account/");
  await expect(page.getByRole("heading", { name: "No sign-in needed" })).toBeVisible();
});

test("album backup works in the browser", async ({ page }) => {
  await page.goto("memory-hunt/album/");
  const backup = {
    format: "discover-egypt-album",
    version: 1,
    memories: [{ id: "pages000-0000-4000-8000-000000000001", challengeId: null, destination: "aswan", visitDate: null, caption: "Felucca at dusk", story: "", template: "nile", arabic: false, photo: null, createdAt: "2026-11-19T10:00:00.000Z", updatedAt: "2026-11-19T10:00:00.000Z" }],
  };
  await page.getByLabel("Choose an album backup file").setInputFiles({ name: "album.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText("Restored 1 memory from your file.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Felucca at dusk").first()).toBeVisible();
});

test("currency converter gets a live rate or asks for one", async ({ page }) => {
  await page.goto("plan/");
  const tools = page.locator("#tools");
  await expect(tools.getByText(/EGP/).first()).toBeVisible();
  await expect(tools.getByText(/unavailable|rate/i).first()).toBeVisible();
});
