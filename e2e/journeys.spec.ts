import { expect, test } from "@playwright/test";

// Admin sign-in allows 5 attempts per 15 minutes per address. Each file acts as its own visitor so the
// suite (with CI retries) stays under the limit without weakening it.
test.use({ extraHTTPHeaders: { "x-real-ip": "10.20.0.2" } });

test("1. a first-time visitor discovers Egypt through the preference quiz", async ({ page }) => {
  await page.goto("/discover");
  const quiz = page.locator("#find");
  const scope = (await quiz.count()) ? quiz : page;
  await scope.locator("label", { hasText: /diving/i }).first().click();
  await expect(scope.getByRole("checkbox", { name: /diving/i }).first()).toBeChecked();
  for (let i = 0; i < 6; i++) {
    const show = scope.getByRole("button", { name: "Show my Egypt" });
    if (await show.isVisible()) break;
    await scope.getByRole("button", { name: "Continue" }).first().click();
  }
  await scope.getByRole("button", { name: "Show my Egypt" }).click();
  await expect(page.getByRole("heading", { name: "Your Egypt" })).toBeVisible();
  await expect(page.getByText("Why it matches you").first()).toBeVisible();
  await expect(scope.getByRole("heading", { name: "Dahab", exact: true }).first()).toBeVisible();
});

test("2. a visitor explores destinations using the interactive map", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("group", { name: "Filter destinations by category" }).getByRole("button", { name: /Red Sea/ }).click();
  const list = page.getByRole("list", { name: "Destinations" });
  await expect(list.getByRole("button", { name: /Luxor/ })).toHaveCount(0);
  await list.getByRole("button", { name: /Dahab/ }).click();
  await expect(page.getByText("Nearby highlights").first()).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("3. a visitor builds and saves an itinerary", async ({ page }) => {
  await page.goto("/plan");
  await page.getByLabel("Trip name").fill("Nile in November");
  await page.getByLabel("Days").first().fill("3");
  const days = page.getByRole("list", { name: "Day-by-day itinerary" });
  await days.locator("select").first().selectOption("luxor");
  await days.getByRole("button", { name: /Karnak/ }).first().click();
  await page.getByRole("button", { name: "Save itinerary" }).click();
  await expect(page.getByText(/Trip saved on this device/)).toBeVisible();
  await page.goto("/my-egypt");
  await expect(page.getByRole("heading", { name: "Nile in November" })).toBeVisible();
});

test("4. a visitor calculates a travel budget", async ({ page }) => {
  await page.goto("/plan#budget");
  const presets = page.getByRole("group", { name: "Travel style preset" });
  await presets.getByRole("button", { name: /backpacker/i }).click();
  const estimate = page.locator("#budget").getByText(/\$[\d,]+/).first();
  const low = await estimate.textContent();
  await presets.getByRole("button", { name: /luxury/i }).click();
  await expect(estimate).not.toHaveText(low ?? "");
  await expect(page.locator("#budget").getByText(/estimate/i).first()).toBeVisible();
});

test("5. a visitor saves destinations", async ({ page }) => {
  await page.goto("/discover/luxor");
  await page.getByRole("button", { name: "Save Luxor" }).first().click();
  await expect(page.getByRole("button", { name: "Remove Luxor from saved" }).first()).toHaveAttribute("aria-pressed", "true");
  await page.goto("/my-egypt");
  await expect(page.getByRole("heading", { name: "Luxor" }).first()).toBeVisible();
});

test("6–7. a visitor submits a question and an admin publishes it", async ({ page }) => {
  const q = `Where can I hear live Nubian music in Aswan? (run ${Date.now()})`;
  await page.goto("/community");
  const form = page.getByRole("form", { name: "Ask a local" });
  await form.getByLabel("Your first name").fill("Ines");
  await form.getByLabel("Email", { exact: true }).fill("ines@example.com");
  await form.getByLabel("Your question").fill(q);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Send question" }).click();
  await expect(form.getByText(/Thank you/)).toBeVisible();

  // Not public until moderated
  await page.reload();
  await expect(page.getByText(q)).toHaveCount(0);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Password").fill("e2e-admin-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
  const item = page.locator("li", { hasText: q });
  await item.getByLabel(/Answer/).fill("Ask at the Nubian Museum and at guesthouses on the West Bank.");
  await item.getByRole("button", { name: "Answer & publish" }).click();
  await expect(page.getByText("Published.")).toBeVisible();

  await page.goto("/community");
  await expect(page.getByText(q)).toBeVisible();
  await expect(page.getByText("ines@example.com")).toHaveCount(0);
});

test("8. a visitor downloads their itinerary as a PDF", async ({ page }) => {
  await page.goto("/plan");
  await page.getByLabel("Trip name").fill("Pdf test trip");
  await page.getByRole("button", { name: "Save itinerary" }).click();
  await page.goto("/my-egypt");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});

test("admin pages and APIs are closed to visitors", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  const r = await request.post("/api/admin/prices", { data: { id: "water", min: 1, max: 2 }, headers: { origin: "http://localhost:3200" } });
  expect(r.status()).toBe(401);
});

test("forms show helpful errors", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Contact us" });
  await form.getByLabel("Name", { exact: true }).fill("A");
  await form.getByLabel("Email", { exact: true }).fill("not-an-email@x");
  await form.getByLabel("Message").fill("short");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText(/at least 2 characters/)).toBeVisible();
});
