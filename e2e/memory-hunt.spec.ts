import { readFileSync } from "node:fs";
import { expect, test, type Download, type Page } from "@playwright/test";

// Admin sign-in allows 5 attempts per 15 minutes per address. Each file acts as its own visitor so the
// suite (with CI retries) stays under the limit without weakening it.
test.use({ extraHTTPHeaders: { "x-real-ip": "10.20.0.3" } });

/** Pages in a PDF made by jsPDF: one "/Type /Page" object per page. */
function pdfPages(d: Download) {
  return d.path().then((p) => (readFileSync(p!, "latin1").match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length);
}

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
    const [album] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Postcard album (A4 PDF)" }).click()]);
    expect(album.suggestedFilename()).toBe("discover-egypt-my-album.pdf");

    // the Memory Passport: cover, traveller page, stamps, the memory's page, endorsements, notes, back = 8 pages
    const book = page.getByTestId("passport-book");
    await expect(book.getByRole("heading", { name: "Your Memory Passport" })).toBeVisible();
    await expect(book.getByTestId("passport-range")).toHaveText("Page 1 of 8");
    await expect(book.getByRole("img", { name: /Cover: Memory Passport/ })).toHaveAttribute("data-ready", "true");
    await book.getByLabel("Name in your passport (optional)").fill("Maya Jensen");
    await book.getByRole("button", { name: "Next" }).click();
    await expect(book.getByTestId("passport-range")).toHaveText("Pages 2–3 of 8");
    await expect(book.getByRole("img", { name: /Traveller page for Maya Jensen: 1 memory, 1 of 20 challenges, 10 points, places: Aswan/ })).toBeVisible();
    await expect(book.getByRole("img", { name: /Stamps page 1 of 1: Aswan, A felucca at sunset/ })).toHaveAttribute("data-ready", "true");
    await book.getByRole("button", { name: "Next" }).click();
    await expect(book.getByRole("img", { name: /Memory page: Aswan, “Gold on the water”, with photo/ })).toBeVisible();
    for (let i = 0; i < 2; i++) await book.getByRole("button", { name: "Next" }).click();
    await expect(book.getByTestId("passport-range")).toHaveText("Page 8 of 8");
    await expect(book.getByRole("button", { name: "Next" })).toBeDisabled();

    const [booklet] = await Promise.all([page.waitForEvent("download"), book.getByRole("button", { name: "Download booklet (A4, fold & staple)" }).click()]);
    expect(booklet.suggestedFilename()).toBe("discover-egypt-memory-passport-booklet-a4.pdf");
    expect(await pdfPages(booklet)).toBe(4); // 2 sheets, printed on both sides
    await expect(book.getByText("Your passport booklet has been downloaded.")).toBeVisible();
    const [shop] = await Promise.all([page.waitForEvent("download"), book.getByRole("button", { name: "Pages for a print shop" }).click()]);
    expect(shop.suggestedFilename()).toBe("discover-egypt-memory-passport-print-shop.pdf");
    expect(await pdfPages(shop)).toBe(8);

    // the name is kept on this device for next time
    await page.reload();
    await expect(page.getByLabel("Name in your passport (optional)")).toHaveValue("Maya Jensen");

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

  test("a print status page looks the code up once and leaves no request open", async ({ page }) => {
    const seen: string[] = [];
    const pending = new Map<object, string>();
    const path = (u: string) => new URL(u).pathname + new URL(u).search;
    page.on("request", (r) => {
      seen.push(path(r.url()));
      pending.set(r, path(r.url()));
    });
    page.on("requestfinished", (r) => pending.delete(r));
    page.on("requestfailed", (r) => pending.delete(r));
    await page.goto("/memory-hunt/print/DE-2222-2222");
    await expect(page.getByText(/couldn.t find a print request with the code/)).toBeVisible();
    await page.waitForTimeout(1500);
    expect(seen.filter((u) => u.startsWith("/api/print/requests/"))).toHaveLength(1);
    // Every response is read to the end, so nothing keeps a connection open (a bug that stalled the page before).
    expect([...pending.values()]).toEqual([]);
  });

  test("an admin sets up a printing partner; a visitor asks for a print, follows it and cancels", async ({ page, browser }) => {
    // The demo database persists between runs and retries: give this run's partner its own name.
    const partnerName = `Old Cataract Reception ${Date.now().toString(36)}`;
    // visitors cannot manage partners or jobs
    const denied = await page.request.post("/api/admin/print-partners", { data: {}, headers: { origin: "http://localhost:3200" } });
    expect(denied.status()).toBe(401);

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("e2e-admin-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Printing partners" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Add partner" }).click();
    const form = page.getByRole("form", { name: "New printing partner" });
    await form.getByLabel("Name", { exact: true }).fill(partnerName);
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
    await expect(page.getByText(`Added: ${partnerName}`)).toBeVisible();

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
    await panel.getByRole("radio", { name: new RegExp(partnerName) }).check();
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
    await visitor.waitForURL(/\/memory-hunt\/print\/DE-/);
    await expect(visitor.getByTestId("print-status")).toHaveText("Being printed", { timeout: 10_000 });
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
    await page.getByRole("button", { name: `Delete ${partnerName}` }).click();
    await expect(page.getByText(`Deleted: ${partnerName}`)).toBeVisible();
  });
});
