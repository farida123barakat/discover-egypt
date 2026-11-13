import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/discover", "/discover/siwa", "/plan", "/experience", "/travel-smart", "/my-egypt", "/community", "/contact", "/account", "/privacy", "/admin/login"];

for (const path of pages) {
  test(`no WCAG 2.2 A/AA violations on ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // Let entrance fades finish: axe would otherwise measure colours mid-animation.
    await page.waitForTimeout(1600);
    // Map pins can sit closer than 24px when places are close together (Cairo/Giza). WCAG 2.5.8 allows this
    // because every pin has an equivalent full-size control in the destination/stop list next to the map.
    const r = await new AxeBuilder({ page }).exclude(".leaflet-marker-icon").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes[0]?.target.join(" ")}`);
    expect(summary, summary.join("\n")).toEqual([]);
  });
}

test("keyboard: skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("text size control enlarges text", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  const group = page.getByRole("group", { name: "Display settings" }).first();
  await group.getByRole("button", { name: /Large text/ }).first().click();
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(after).toBeGreaterThan(before);
});
