import { expect, test, type Page } from "@playwright/test";

/** A real image made in the browser, so the photo goes through the same decode and re-encode as a camera photo. */
async function testPhoto(page: Page) {
  const bytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 480;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, "#c9a35a");
    grad.addColorStop(1, "#123f58");
    g.fillStyle = grad;
    g.fillRect(0, 0, 640, 480);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  return { name: "felucca.png", mimeType: "image/png", buffer: Buffer.from(bytes) };
}

test.describe("Memory Hunt", () => {
  test("a visitor picks a challenge, captures a memory, opens the album and downloads the PDFs", async ({ page }) => {
    await page.goto("/memory-hunt");
    await expect(page.getByRole("heading", { level: 1, name: "Collect moments, not souvenirs." })).toBeVisible();
    await expect(page.getByTestId("hunt-progress")).toContainText("0 points");

    // filter, then pick a challenge
    await page.getByLabel("Destination", { exact: true }).selectOption("aswan");
    await page.getByRole("radiogroup", { name: "Kind of challenge" }).getByRole("radio", { name: "Sunsets & sunrises" }).click();
    await expect(page.getByTestId("challenge-card")).toHaveCount(1);
    await page.getByRole("link", { name: /Capture this memory.*A felucca at sunset/ }).click();

    await expect(page).toHaveURL(/\/memory-hunt\/new\?challenge=aswan-felucca/);
    await expect(page.getByLabel("Challenge", { exact: true })).toHaveValue("aswan-felucca");
    await expect(page.getByLabel("Destination (optional)")).toHaveValue("aswan");

    // a memory needs a photo or words
    await page.getByRole("button", { name: "Save to my album" }).click();
    await expect(page.getByText("Add a photo or write a few words")).toBeVisible();

    await page.getByTestId("photo-input").setInputFiles(await testPhoto(page));
    await expect(page.getByText("Photo added. Its location data was removed on your device.")).toBeVisible();
    await page.getByLabel("Caption").fill("Gold on the water");
    await page.getByLabel("Your story (optional)").fill("We drifted past Elephantine Island as the light went.");
    await page.getByRole("radiogroup", { name: "Postcard design" }).getByRole("radio", { name: /The Nile/ }).click();
    await expect(page.getByTestId("postcard-canvas")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Save to my album" }).click();

    await expect(page).toHaveURL(/\/memory-hunt\/album\?saved=/);
    await expect(page.getByText("Memory saved to your album.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "1 memory" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gold on the water" })).toBeVisible();
    await expect(page.getByTestId("hunt-progress")).toContainText("10 points");
    await expect(page.locator('[data-earned="true"]').filter({ hasText: "First memory" })).toBeVisible();

    // printing is not offered while there are no verified, active partners
    await expect(page.getByRole("button", { name: /Print at a partner/ })).toHaveCount(0);

    const [postcard] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Print-ready PDF.*Gold on the water/ }).click()]);
    expect(postcard.suggestedFilename()).toMatch(/^discover-egypt-postcard-aswan-.*\.pdf$/);
    const [album] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download album (PDF)" }).click()]);
    expect(album.suggestedFilename()).toBe("discover-egypt-my-album.pdf");

    // the memory is kept on the device
    await page.reload();
    await expect(page.getByRole("heading", { name: "Gold on the water" })).toBeVisible();
    await page.goto("/memory-hunt");
    await page.getByLabel("Destination", { exact: true }).selectOption("aswan");
    await expect(page.getByTestId("challenge-card").filter({ hasText: "A felucca at sunset" })).toContainText("Completed");
    await page.goto("/my-egypt");
    await expect(page.getByRole("region", { name: "My memories" })).toContainText("1 memory · 1 of");

    // edit, then delete
    await page.goto("/memory-hunt/album");
    await page.getByRole("link", { name: /Edit.*Gold on the water/ }).click();
    await page.getByLabel("Caption").fill("Gold on the Nile");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Gold on the Nile" })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^Delete.*Gold on the Nile/ }).click();
    await expect(page.getByText("Your album is empty.")).toBeVisible();
  });

  test("an admin sets up a printing partner; a visitor asks for a print, follows it and cancels", async ({ page, browser }) => {
    // visitors cannot manage partners or jobs
    const denied = await page.request.post("/api/admin/print-partners", { data: {}, headers: { origin: "http://localhost:3200" } });
    expect(denied.status()).toBe(401);

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("e2e-admin-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Printing partners" })).toBeVisible();

    await page.getByRole("button", { name: "Add partner" }).click();
    const form = page.getByRole("form", { name: "New printing partner" });
    await form.getByLabel("Name", { exact: true }).fill("Old Cataract Reception");
    await form.getByLabel("Destination", { exact: true }).selectOption("aswan");
    await form.getByLabel("Address (shown to visitors)").fill("Abtal El Tahrir Street, Aswan");
    await form.getByLabel("Opening hours for collection").fill("Reception, 8:00–22:00");
    await form.getByLabel("Partnership verified").check();
    await form.getByLabel("Active (visitors can choose this partner)").check();
    await form.getByRole("button", { name: "Add partner" }).click();
    await expect(form.getByText("Record the date you verified this partner")).toBeVisible(); // validation
    await form.getByLabel("Verified on").fill("2026-11-12");
    await form.getByLabel("How it was verified").fill("Agreement signed with the front-office manager in person.");
    await form.getByRole("button", { name: "Add partner" }).click();
    await expect(page.getByText("Added: Old Cataract Reception")).toBeVisible();

    // a separate visitor (no admin cookie)
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/memory-hunt/new?challenge=aswan-karkade");
    await visitor.getByLabel("Caption").fill("Hibiscus, iced");
    await visitor.getByRole("button", { name: "Save to my album" }).click();
    await expect(visitor.getByRole("heading", { name: "Hibiscus, iced" })).toBeVisible();

    await visitor.getByRole("button", { name: /Print at a partner.*Hibiscus, iced/ }).click();
    const panel = visitor.getByTestId("print-panel");
    await expect(panel.getByRole("heading", { name: "Print this postcard at a partner" })).toBeFocused();
    await panel.getByRole("button", { name: "Request a print" }).click();
    await expect(panel.getByText("Choose where you'd like to collect it.")).toBeVisible();
    await expect(panel.getByText("Please confirm that the partner may see")).toBeVisible();
    await panel.getByLabel(/Old Cataract Reception/).check();
    await panel.getByRole("checkbox", { name: /will see and print this postcard image/ }).check();
    await panel.getByRole("button", { name: "Request a print" }).click();
    const code = (await panel.getByTestId("collection-code").textContent())!.trim();
    expect(code).toMatch(/^DE-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    await expect(panel.getByRole("img", { name: `QR code for the status page of ${code}` })).toBeVisible();

    // admin sees the job and starts printing
    await page.reload();
    await page.getByLabel("Find a collection code").fill(code);
    await page.getByRole("button", { name: `Start printing ${code}` }).click();
    await expect(page.getByText(`${code}: being printed`)).toBeVisible();

    // visitor follows the status and cancels; the image is then gone
    await panel.getByRole("link", { name: "Check the status" }).click();
    await expect(visitor.getByTestId("print-status")).toHaveText("Being printed");
    visitor.once("dialog", (d) => d.accept());
    await visitor.getByRole("button", { name: "Cancel this request" }).click();
    await expect(visitor.getByText("Request cancelled. The postcard image has been deleted.")).toBeVisible();
    await expect(visitor.getByTestId("print-status")).toHaveText("Cancelled");

    // a wrong code
    await visitor.getByLabel("Check another collection code").fill("hello");
    await visitor.getByRole("button", { name: "Check", exact: true }).click();
    await expect(visitor.getByText("Codes look like DE-7K3M-Q9TX")).toBeVisible();

    // clean up: the partner has no open jobs any more, so it can be deleted
    await page.reload();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete Old Cataract Reception" }).click();
    await expect(page.getByText("Deleted: Old Cataract Reception")).toBeVisible();
  });
});
