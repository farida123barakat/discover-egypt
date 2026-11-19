import { expect, test } from "@playwright/test";

/**
 * The normal deployment: no database, no accounts. Runs against the same build as the other tests,
 * served with no back end and CONTACT_EMAIL=hello@example.com (see playwright.config.ts).
 */

test("no database: no sign-in, no admin notice, no newsletter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: /Sign in|My account/ })).toHaveCount(0);
  await expect(page.getByTestId("backend-notice")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Stay inspired" })).toHaveCount(0);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "No sign-in needed" })).toBeVisible();
});

test("contact form prepares an email instead of posting to a server", async ({ page }) => {
  let posted = false;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/api/")) posted = true;
  });
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Contact us" });
  await expect(form.getByLabel("Email")).toHaveCount(0); // their own mail app sends it

  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText("Please check the highlighted fields.")).toBeVisible();
  await expect(form.getByLabel("Name")).toBeFocused();

  await form.getByLabel("Name").fill("Ana");
  await form.getByLabel("Topic").selectOption("accessibility");
  await form.getByLabel("Message").fill("Is the Luxor Temple path step-free?");
  await form.getByRole("button", { name: "Send message" }).click();

  const open = form.getByTestId("open-email");
  await expect(open).toBeVisible();
  const href = (await open.getAttribute("href"))!;
  expect(href.startsWith("mailto:hello@example.com?")).toBe(true);
  const q = new URLSearchParams(href.split("?")[1]);
  expect(q.get("subject")).toBe("Discover Egypt: Accessibility");
  expect(q.get("body")).toContain("Name: Ana");
  expect(q.get("body")).toContain("Message: Is the Luxor Temple path step-free?");
  expect(posted).toBe(false);
});

test("community page works without a database", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByText("Send a question or a story by email.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Getting around Cairo/ })).toBeVisible();
  const ask = page.getByRole("form", { name: "Ask a local" });
  await ask.getByLabel("Your first name").fill("Omar");
  await ask.getByLabel("About").selectOption("aswan");
  await ask.getByLabel("Your question").fill("Where do locals swim in Aswan?");
  await ask.getByRole("button", { name: "Send question" }).click();
  const href = (await ask.getByTestId("open-email").getAttribute("href"))!;
  expect(new URLSearchParams(href.split("?")[1]).get("subject")).toBe("Ask a local: Aswan");
});

test("album: restore from a backup file, then save one", async ({ page }) => {
  await page.goto("/memory-hunt/album");
  const box = page.getByTestId("file-backup");
  await expect(box.getByRole("button", { name: "Save backup file" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Back up to your account (optional)" })).toHaveCount(0);

  const backup = {
    format: "discover-egypt-album",
    version: 1,
    memories: [
      {
        id: "e2e00000-0000-4000-8000-000000000001",
        challengeId: "karnak-cartouche",
        destination: "luxor",
        visitDate: "2026-11-02",
        caption: "Restored from a file",
        story: "",
        template: "papyrus",
        arabic: false,
        photo: null,
        createdAt: "2026-11-02T10:00:00.000Z",
        updatedAt: "2026-11-02T10:00:00.000Z",
      },
    ],
  };
  await page.getByLabel("Choose an album backup file").setInputFiles({ name: "album.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText("Restored 1 memory from your file.")).toBeVisible();
  await expect(page.getByText("Restored from a file").first()).toBeVisible();

  // Opening the same file again adds nothing.
  await page.getByLabel("Choose an album backup file").setInputFiles({ name: "album.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText("Everything in that file is already in your album.")).toBeVisible();

  // A file that isn't a backup is refused with a clear message.
  await page.getByLabel("Choose an album backup file").setInputFiles({ name: "notes.json", mimeType: "application/json", buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByText("That file isn't an album backup.", { exact: false })).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), box.getByRole("button", { name: "Save backup file" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^discover-egypt-album-\d{4}-\d{2}-\d{2}\.json$/);
  const saved = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString("utf8")));
  expect(saved.format).toBe("discover-egypt-album");
  expect(saved.memories.map((m: { caption: string }) => m.caption)).toEqual(["Restored from a file"]);
});

test("new photo headers credit their photographers", async ({ page }) => {
  for (const path of ["/plan", "/travel-smart", "/community", "/my-egypt"]) {
    await page.goto(path);
    await expect(page.locator("main section").first().getByRole("link", { name: /^Photo: .+ · (CC|Public domain)/ })).toBeVisible();
  }
});

test("recipes show without a database, clearly marked as drafts", async ({ page }) => {
  await page.goto("/taste");
  await expect(page.getByText("haven’t been checked by a cook yet", { exact: false })).toBeVisible();
  await page.goto("/taste/taameya");
  await expect(page.getByRole("heading", { level: 1, name: /Taameya/ })).toBeVisible();
  await expect(page.getByText("Draft recipe — not yet reviewed")).toBeVisible();
  await expect(page.getByText("treat it as a starting point", { exact: false })).toBeVisible();
});
