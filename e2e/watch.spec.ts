import { expect, test } from "@playwright/test";

// Admin sign-in allows 5 attempts per 15 minutes per address. Each file acts as its own visitor so the
// suite (with CI retries) stays under the limit without weakening it.
test.use({ extraHTTPHeaders: { "x-real-ip": "10.20.0.5" } });

test.describe("watch & discover", () => {
  test("the hub lists films, labels drafts, and filters by destination", async ({ page }) => {
    await page.goto("/watch");
    await expect(page.getByRole("heading", { name: "The stories behind the stones." })).toBeVisible();
    const cards = page.getByTestId("media-card");
    await expect(cards).toHaveCount(5);
    await expect(page.getByText("Draft · awaiting review").first()).toBeVisible(); // demo mode shows drafts, labelled
    await page.getByRole("navigation", { name: "Filter films by destination" }).getByRole("link", { name: "Giza" }).click();
    await expect(page).toHaveURL(/d=giza/);
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("How the Great Pyramid was built");
  });

  test("an original film plays with captions on, and chapters and transcript seek the video", async ({ page }) => {
    await page.goto("/watch/great-pyramid-how");
    const video = page.getByTestId("media-video");
    await expect(video).toBeVisible();

    // Captions track is present, English, and showing by default; its cues load.
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => { const t = Array.from(v.textTracks).find((x) => x.kind === "captions"); return t ? `${t.language}:${t.mode}:${t.cues?.length ?? 0}` : "none"; }))
      .toMatch(/^en:showing:[1-9]\d*$/);

    // It actually plays.
    await video.evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play(); });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 }).toBeGreaterThan(0.5);
    await video.evaluate((v: HTMLVideoElement) => v.pause());

    // Chapter seek
    await page.getByRole("navigation", { name: "Chapters" }).getByRole("button", { name: /Merer's logbook/ }).click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(60);
    await video.evaluate((v: HTMLVideoElement) => v.pause());
    await expect(page.getByRole("navigation", { name: "Chapters" }).locator('[aria-current="true"]')).toContainText("Merer's logbook");

    // Transcript seek + highlight
    const line = page.getByRole("button", { name: /Most Egyptologists think ramps were used/ });
    await line.click();
    await video.evaluate((v: HTMLVideoElement) => v.pause());
    await expect(line).toHaveAttribute("aria-current", "true");
    const t = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    expect(t).toBeGreaterThan(150);

    await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Diary of Merer/ })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText(/Draft — awaiting editorial review/)).toBeVisible();
  });

  test("caption and media files are served with the right types", async ({ request }) => {
    const vtt = await request.get("/media/great-pyramid-how.en.vtt");
    expect(vtt.status()).toBe(200);
    expect(vtt.headers()["content-type"]).toContain("text/vtt");
    expect((await vtt.text()).startsWith("WEBVTT")).toBe(true);
    const mp4 = await request.get("/media/moving-abu-simbel.mp4", { headers: { range: "bytes=0-99" } });
    expect([200, 206]).toContain(mp4.status());
    expect(mp4.headers()["content-type"]).toContain("video/mp4");
  });

  test("embedded videos load nothing from YouTube until the visitor presses play", async ({ page }) => {
    const calls: string[] = [];
    await page.route(/youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com/, (route) => {
      calls.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" });
    });
    await page.goto("/watch/whe-hatshepsut");
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(calls).toHaveLength(0);
    await page.getByRole("button", { name: "Load video from YouTube" }).click();
    const frame = page.locator("iframe");
    await expect(frame).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/-qw-_IHkKoI\?.*cc_load_policy=1/);
    await expect(frame).toHaveAttribute("title", /Hatshepsut/);
    await expect(page.getByRole("link", { name: /Watch on YouTube/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=-qw-_IHkKoI");
  });

  test("destination pages show their films", async ({ page }) => {
    await page.goto("/discover/abu-simbel");
    const section = page.getByRole("region", { name: "Before you go to Abu Simbel" });
    await expect(section.getByTestId("media-card").first()).toContainText("Moving Abu Simbel");
    await section.getByTestId("media-card").first().click();
    await expect(page).toHaveURL(/\/watch\/moving-abu-simbel$/);
  });

  test("an admin adds an embed, is held to the publishing rules, then publishes and removes it", async ({ page, request }) => {
    const denied = await request.post("/api/admin/media", { data: { id: "x-y-z" }, headers: { origin: "http://localhost:3200" } });
    expect(denied.status()).toBe(401);

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("e2e-admin-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Watch & discover", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Add a video" }).click();
    const form = page.getByRole("form", { name: "Add a video" });
    await form.getByLabel("ID (url-safe)").fill("e2e-karnak-film");
    await form.getByLabel("YouTube video id").fill("abcdefghijk");
    await form.getByLabel("Channel (who published it)").fill("E2E Museum");
    await form.getByLabel("Title", { exact: true }).fill("Inside Karnak — a test film");
    await form.getByLabel("Summary").fill("A test documentary about the temples of Karnak.");
    await form.locator("label", { hasText: "Luxor" }).click();
    await form.getByLabel("Period").fill("New Kingdom");
    await form.getByLabel("Length (minutes:seconds)").fill("2:00");
    await form.getByLabel("Credit").fill("E2E Museum");
    await form.getByLabel(/^Chapters/).fill("0:00 Arrival\n1:00 Hypostyle hall");
    await form.getByLabel(/^Sources/).fill("E2E Museum | https://example.org/karnak");
    await form.getByLabel("Status").selectOption("published");
    await form.getByRole("button", { name: "Add video" }).click();
    await expect(page.getByText(/Embedded videos should run 5–15 minutes|Record whether captions/).first()).toBeVisible();

    await form.getByLabel("Length (minutes:seconds)").fill("9:30");
    await form.getByLabel("Captions").fill("Creator's English captions");
    await form.getByRole("button", { name: "Add video" }).click();
    await expect(page.getByText("Added: Inside Karnak — a test film")).toBeVisible();

    await page.goto("/watch/e2e-karnak-film");
    await expect(page.getByRole("heading", { name: "Inside Karnak — a test film" })).toBeVisible();
    await expect(page.getByText(/Draft — awaiting/)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Chapters" }).getByRole("button", { name: /Hypostyle hall/ })).toBeVisible();

    await page.goto("/admin");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete Inside Karnak — a test film" }).click();
    await expect(page.getByText("Deleted: Inside Karnak — a test film")).toBeVisible();
    // (streamed pages keep a 200 status, so check the not-found page itself)
    await page.goto("/watch/e2e-karnak-film");
    await expect(page.getByRole("heading", { name: "Lost in the desert." })).toBeVisible();
  });
});
