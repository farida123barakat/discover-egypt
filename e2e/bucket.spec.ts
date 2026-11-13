import { expect, test } from "@playwright/test";

test.describe("bucket list", () => {
  test("a visitor adds, completes and earns a badge; progress survives a reload", async ({ page }) => {
    await page.goto("/bucket-list");
    await expect(page.getByRole("status").filter({ hasText: /of 18/ })).toContainText("0");
    await page.getByRole("button", { name: "Add to my list: Lose yourself in Khan el-Khalili" }).click();
    await page.getByRole("button", { name: "I did this: Sail the Nile on a felucca at sunset" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: /of 18/ })).toContainText("1");
    await expect(page.getByText(/2 on your list · 1 badge earned/)).toBeVisible(); // completed items stay on the list
    await expect(page.getByRole("img", { name: "1 of 1, earned" })).toBeVisible(); // "First stamp"

    await page.getByRole("group", { name: "Show" }).getByRole("button", { name: "My list" }).click();
    await expect(page.getByRole("heading", { name: "Lose yourself in Khan el-Khalili" })).toBeVisible();
    await page.getByRole("group", { name: "Show" }).getByRole("button", { name: "Completed" }).click();
    // first match is the featured card, the second is the card in the filtered full list
    await expect(page.getByRole("heading", { name: "Sail the Nile on a felucca at sunset" }).nth(1)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("status").filter({ hasText: /of 18/ })).toContainText("1");
    await page.getByRole("button", { name: "Mark not done: Sail the Nile on a felucca at sunset" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: /of 18/ })).toContainText("0");
  });

  test("an admin creates, publishes, features and removes an official activity", async ({ page, request }) => {
    // visitors can't touch official records
    const denied = await request.post("/api/admin/bucket", { data: { id: "x-y-z" }, headers: { origin: "http://localhost:3200" } });
    expect(denied.status()).toBe(401);

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("e2e-admin-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Bucket list", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "New activity" }).click();
    const form = page.getByRole("form", { name: "New bucket-list activity" });
    await form.getByLabel("ID (url-safe)").fill("fayoum-pottery");
    await form.getByLabel("Title").fill("Make pottery in Tunis village");
    await form.getByRole("button", { name: "Create activity" }).click();
    await expect(form.getByText(/Description must be at least/)).toBeVisible(); // validation
    await form.getByLabel("Description").fill("Shape your own bowl in the pottery village near Lake Qarun.");
    await form.getByLabel("Destination", { exact: true }).selectOption("fayoum");
    await form.locator("label", { hasText: "culture" }).click();
    await form.locator("label", { hasText: "family" }).click();
    await form.getByLabel("Duration").fill("Half day");
    await form.getByLabel("Published (visible to visitors)").check();
    await form.getByRole("button", { name: "Create activity" }).click();
    await expect(page.getByText("Created: Make pottery in Tunis village")).toBeVisible();

    await page.getByLabel("Search activities").fill("pottery");
    await page.getByRole("button", { name: "Feature Make pottery in Tunis village" }).click();
    await expect(page.getByText("Make pottery in Tunis village: featured")).toBeVisible();

    await page.goto("/bucket-list");
    await expect(page.getByRole("heading", { name: "Make pottery in Tunis village" }).first()).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /of 19/ })).toBeVisible();

    await page.goto("/admin");
    await page.getByLabel("Search activities").fill("pottery");
    await page.getByRole("button", { name: "Unpublish Make pottery in Tunis village" }).click();
    await expect(page.getByText("Make pottery in Tunis village: unpublished")).toBeVisible();
    await page.goto("/bucket-list");
    await expect(page.getByRole("heading", { name: "Make pottery in Tunis village" })).toHaveCount(0);

    await page.goto("/admin");
    await page.getByLabel("Search activities").fill("pottery");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete Make pottery in Tunis village" }).click();
    await expect(page.getByText("Deleted: Make pottery in Tunis village")).toBeVisible();
  });
});
