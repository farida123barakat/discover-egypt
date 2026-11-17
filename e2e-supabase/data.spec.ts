import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN, signUp, uniqueEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

const ORIGIN = { origin: "http://localhost:3200" };
const trip = (title: string) => ({ title, startDate: "2027-02-10", style: "comfortable", travellers: 2, interests: ["history"], days: [{ destination: "luxor", activities: [] }, { destination: "aswan", activities: [] }] });

async function visitor(browser: Browser, name: string) {
  const page = await (await browser.newContext()).newPage();
  const email = uniqueEmail(name);
  await signUp(page, email);
  return { page, email };
}

async function adminSignIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByRole("textbox", { name: "Email" }).fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20_000 });
}

/** A small real PNG made in the browser. */
async function png(page: Page) {
  const bytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 200;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c9a35a";
    g.fillRect(0, 0, 320, 200);
    g.fillStyle = "#123f58";
    g.fillRect(0, 140, 320, 60);
    const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), "image/png"));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  return { name: "nile.png", mimeType: "image/png", buffer: Buffer.from(bytes) };
}

test("each visitor sees and changes only their own saved trips", async ({ browser }) => {
  const a = await visitor(browser, "ana");
  const b = await visitor(browser, "ben");
  const saved = await a.page.request.post("/api/itineraries", { data: trip("Ana's Nile week"), headers: ORIGIN });
  expect(saved.status()).toBe(201);
  const mine = (await (await a.page.request.get("/api/itineraries")).json()).itineraries;
  expect(mine.map((t: { title: string }) => t.title)).toEqual(["Ana's Nile week"]);

  // Ben sees nothing of Ana's, and can't delete it even with its id
  expect((await (await b.page.request.get("/api/itineraries")).json()).itineraries).toEqual([]);
  expect((await b.page.request.delete("/api/itineraries", { data: { id: mine[0].id }, headers: ORIGIN })).status()).toBe(404);
  expect((await (await a.page.request.get("/api/itineraries")).json()).itineraries).toHaveLength(1);

  // and the account page lists it for Ana
  await a.page.goto("/account");
  await expect(a.page.getByRole("button", { name: "Load Ana's Nile week" })).toBeVisible();
  // signed-out visitors can't read or write trips at all
  const anon = await (await browser.newContext()).newPage();
  expect((await anon.request.get("/api/itineraries")).status()).toBe(401);
  expect((await anon.request.post("/api/itineraries", { data: trip("Planted"), headers: ORIGIN })).status()).toBe(401);
});

test("bucket-list progress syncs to the account and stays private", async ({ browser }) => {
  const a = await visitor(browser, "cara");
  const progress = { "felucca-sunset": { added: true, done: true, fav: true, doneAt: "2026-11-14T17:00:00.000Z" }, "white-desert-night": { added: true, done: false, fav: false } };
  expect((await a.page.request.put("/api/bucket", { data: progress, headers: ORIGIN })).status()).toBe(200);
  const back = (await (await a.page.request.get("/api/bucket")).json()).progress;
  expect(back["felucca-sunset"]).toMatchObject({ added: true, done: true, fav: true });
  expect(back["white-desert-night"]).toMatchObject({ added: true, done: false });
  const b = await visitor(browser, "dev");
  expect((await (await b.page.request.get("/api/bucket")).json()).progress).toEqual({});
});

test("memories back up to the visitor's own storage folder and restore on another device", async ({ browser }) => {
  const a = await visitor(browser, "eli");
  const p = a.page;
  await p.goto("/memory-hunt/new?challenge=aswan-felucca");
  await p.getByTestId("photo-input").setInputFiles(await png(p));
  await expect(p.getByText("Photo added. Its location data was removed on your device.")).toBeVisible();
  await p.getByLabel("Caption").fill("Gold on the water");
  await p.getByRole("button", { name: "Save to my album" }).click();
  await expect(p.getByRole("heading", { name: "Gold on the water" })).toBeVisible();
  await p.getByRole("button", { name: "Back up now" }).click();
  await expect(p.getByText("1 memory backed up.")).toBeVisible({ timeout: 20_000 });

  // a second device: same account, empty album, restore
  const other = await (await browser.newContext()).newPage();
  await other.goto("/account");
  await other.getByLabel("Email address").fill(a.email);
  await other.getByLabel("Password", { exact: true }).fill("felucca at sunset 7");
  await other.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(other.getByTestId("signed-in-as")).toContainText(a.email);
  await other.goto("/memory-hunt/album");
  await expect(other.getByText("Your album is empty.")).toBeVisible();
  await other.getByRole("button", { name: "Restore from backup" }).click();
  await expect(other.getByText("Restored 1 memory from your backup.")).toBeVisible({ timeout: 20_000 });
  await expect(other.getByRole("heading", { name: "Gold on the water" })).toBeVisible();

  // someone else restoring gets nothing of Eli's
  const f = await visitor(browser, "fay");
  await f.page.goto("/memory-hunt/album");
  await f.page.getByRole("button", { name: "Restore from backup" }).click();
  await expect(f.page.getByText("Everything in your backup is already on this device.")).toBeVisible({ timeout: 20_000 });
});

test("only administrators get into the dashboard", async ({ browser, page }) => {
  // a visitor signed in with an ordinary account
  const v = await visitor(browser, "gil");
  await v.page.goto("/admin");
  await expect(v.page).toHaveURL(/\/admin\/login/);
  await expect(v.page.getByTestId("not-admin")).toContainText(v.email);
  for (const url of ["/api/admin/moderate", "/api/admin/events", "/api/admin/bucket", "/api/admin/print-partners"]) {
    expect((await v.page.request.post(url, { data: {}, headers: ORIGIN })).status(), url).toBe(401);
  }
  // the real administrator
  await adminSignIn(page);
  await expect(page.getByText(`Signed in as ${ADMIN.email}`)).toBeVisible();
});

test("an administrator uploads a photo; nobody else can", async ({ browser, page }) => {
  await adminSignIn(page);
  await page.getByLabel("Image (JPEG, PNG or WebP, max 5 MB)").setInputFiles(await png(page));
  await page.getByLabel("Alt text").fill("The Nile at Aswan in late afternoon light");
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText(/Uploaded as [0-9a-f-]{36}\.png/)).toBeVisible({ timeout: 20_000 });

  const form = () => ({ file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }, alt: "An attempted upload by a visitor" });
  const anon = await (await browser.newContext()).newPage();
  expect((await anon.request.post("/api/admin/upload", { multipart: form(), headers: ORIGIN })).status()).toBe(401);
  const v = await visitor(browser, "hal");
  expect((await v.page.request.post("/api/admin/upload", { multipart: form(), headers: ORIGIN })).status()).toBe(401);
  // and an admin can't upload something that isn't an image
  expect((await page.request.post("/api/admin/upload", { multipart: { file: { name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") }, alt: "Not really an image file" }, headers: ORIGIN })).status()).toBe(415);
});

test("a visitor's question is moderated before it is published", async ({ browser, page }) => {
  const q = `Is the Aswan corniche nice for an evening walk? (run ${Date.now()})`;
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/community");
  const form = anon.getByRole("form", { name: "Ask a local" });
  await form.getByLabel("Your first name").fill("Ines");
  await form.getByLabel("Email", { exact: true }).fill("ines@example.com");
  await form.getByLabel("Your question").fill(q);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Send question" }).click();
  await expect(form.getByText(/Thank you/)).toBeVisible();
  await anon.reload();
  await expect(anon.getByText(q)).toHaveCount(0);

  await adminSignIn(page);
  const item = page.locator("li", { hasText: q });
  await item.getByLabel(/Answer/).fill("Yes: go around sunset, when the feluccas come in.");
  await item.getByRole("button", { name: "Answer & publish" }).click();
  await expect(item).toHaveCount(0);

  await anon.goto("/community");
  await expect(anon.getByText(q)).toBeVisible();
  await expect(anon.getByText("ines@example.com")).toHaveCount(0); // never published
});

test("recipe review, bucket-list activities and films are stored in the real database", async ({ page, browser }) => {
  await adminSignIn(page);
  // recipe review gate (table recipes)
  const unpublish = page.getByRole("button", { name: /Unpublish Karkade|Return to draft Karkade/ });
  if (await unpublish.count()) {
    page.once("dialog", (d) => d.accept());
    await unpublish.click();
    await expect(page.getByText("Karkade: returned to draft.")).toBeVisible();
  }
  await page.getByRole("button", { name: "Approve & publish Karkade" }).click();
  await expect(page.getByText("Karkade: approved and published.")).toBeVisible();
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/taste/karkade");
  await expect(anon.getByText(/Reviewed by our editors on/)).toBeVisible();

  // bucket-list activities (table bucket_list_activities)
  const id = `test-${Date.now().toString(36)}`;
  expect((await page.request.post("/api/admin/bucket", { data: { id, title: "Watch the stars at Wadi El Hitan", description: "Lie back in the desert and watch the stars appear one by one.", destination: "fayoum", categories: ["nature"], effort: "easy", duration: "Evening", bestMonths: [], tips: [], photo: null, published: true, featured: false }, headers: ORIGIN })).status()).toBe(200);
  await anon.goto("/bucket-list");
  await expect(anon.getByRole("heading", { name: "Watch the stars at Wadi El Hitan" }).first()).toBeVisible();
  expect((await page.request.delete("/api/admin/bucket", { data: { id }, headers: ORIGIN })).status()).toBe(200);

  // films (table media_items): visitors see only published ones
  await anon.goto("/watch");
  await expect(anon.getByText("Draft · awaiting review")).toHaveCount(0);
});
