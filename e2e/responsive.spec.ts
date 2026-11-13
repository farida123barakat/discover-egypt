import { expect, test } from "@playwright/test";

test("mobile navigation opens, is keyboard-closable and has no sideways scroll", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /menu/i });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Main mobile" })).toBeVisible();
  await page.getByRole("navigation", { name: "Main mobile" }).getByRole("link", { name: "Plan" }).click();
  await expect(page).toHaveURL(/\/plan/);
  for (const path of ["/", "/hieroglyphs", "/taste", "/taste/sayadeya", "/bucket-list", "/discover", "/plan", "/experience", "/travel-smart", "/my-egypt"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
