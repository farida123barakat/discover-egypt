import { expect, test } from "@playwright/test";
import { linkFromEmail, PASSWORD, signIn, signOut, signUp, uniqueEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

const email = uniqueEmail("maya");
const NEW_PASSWORD = "white desert at night 3";

test("the backend notice is hidden when a real database is connected", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("backend-notice")).toHaveCount(0);
});

test("sign-up checks the form, then confirms the email address", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Choose a password").fill("short");
  await page.getByLabel("Type the password again").fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a valid email address, like name@example.com.")).toBeVisible();
  await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
  await expect(page.getByText("The two passwords don't match.")).toBeVisible();

  await signUp(page, email);
  await expect(page.getByRole("banner").getByRole("link", { name: "My account" })).toBeVisible();
});

test("signing up again with the same address gives the same answer (no account fishing)", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Choose a password").fill("another long password");
  await page.getByLabel("Type the password again").fill("another long password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Check your inbox: we've sent a link to confirm your email/)).toBeVisible();
});

test("sign out, a wrong password, then sign in again", async ({ page }) => {
  await signIn(page, email);
  await signOut(page);
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  // signed out means signed out on the server too
  expect((await page.request.get("/api/itineraries")).status()).toBe(401);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not my password at all");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("That email and password don't match. Check them, or reset your password.")).toBeVisible();

  await signIn(page, email);
  await page.reload(); // the session survives a reload
  await expect(page.getByTestId("signed-in-as")).toContainText(email);
  expect((await page.request.get("/api/itineraries")).status()).toBe(200);
});

test("forgotten password: email link, choose a new one, old one stops working", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If that address has an account, a link to choose a new password is on its way/)).toBeVisible();

  await page.goto(await linkFromEmail(email, /reset/i));
  await expect(page).toHaveURL(/\/account\/new-password/);
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Type it again").fill("something else entirely");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("The two passwords don't match.")).toBeVisible();
  await page.getByLabel("Type it again").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Your password has been changed.")).toBeVisible();

  await signOut(page);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/don't match/)).toBeVisible();
  await signIn(page, email, NEW_PASSWORD);
});

test("a reset for an unknown address looks exactly the same", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email address").fill(uniqueEmail("nobody"));
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If that address has an account, a link to choose a new password is on its way/)).toBeVisible();
});

test("the new-password page is only for someone who came from a reset link", async ({ page }) => {
  await page.goto("/account/new-password");
  await expect(page).toHaveURL(/\/account\?error=reset/);
  await expect(page.getByRole("alert")).toContainText("That password-reset link has expired");
});

test("sign in with an emailed link instead of a password", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Email me a link" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByText(/If that address is valid, a sign-in link is on its way/)).toBeVisible();
  await page.goto(await linkFromEmail(email, /magic|sign.?in|log.?in/i));
  await expect(page.getByTestId("signed-in-as")).toContainText(email);
});

test("a used or broken sign-in link explains what happened", async ({ page }) => {
  await page.goto("/auth/callback?code=not-a-real-code&next=/account");
  await expect(page).toHaveURL(/\/account\?error=link/);
  await expect(page.getByRole("alert")).toContainText("That link has expired");
  // and the callback never redirects off the site
  await page.goto("/auth/callback?code=x&next=//evil.example");
  await expect(page).toHaveURL(/localhost:3200\/account/);
});
