import { expect, type Page } from "@playwright/test";

/** The local Supabase test mailbox (Mailpit in current CLIs, Inbucket in older ones). */
const MAIL = process.env.MAIL_URL ?? "http://127.0.0.1:54324";

type Found = { subject: string; text: string; html: string };

async function mailpit(to: string): Promise<Found[]> {
  const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  if (!r.ok) throw new Error(`mailpit ${r.status}`);
  const d = (await r.json()) as { messages?: { ID: string; Subject: string }[] };
  const out: Found[] = [];
  for (const m of d.messages ?? []) {
    const full = (await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json()) as { Text?: string; HTML?: string };
    out.push({ subject: m.Subject, text: full.Text ?? "", html: full.HTML ?? "" });
  }
  return out; // newest first
}

async function inbucket(to: string): Promise<Found[]> {
  const box = to.split("@")[0];
  const r = await fetch(`${MAIL}/api/v1/mailbox/${encodeURIComponent(box)}`);
  if (!r.ok) throw new Error(`inbucket ${r.status}`);
  const list = ((await r.json()) as { id: string; subject: string }[]).reverse();
  const out: Found[] = [];
  for (const m of list) {
    const full = (await (await fetch(`${MAIL}/api/v1/mailbox/${encodeURIComponent(box)}/${m.id}`)).json()) as { body?: { text?: string; html?: string } };
    out.push({ subject: m.subject, text: full.body?.text ?? "", html: full.body?.html ?? "" });
  }
  return out;
}

/** Wait for the newest email to `to` whose subject matches, and return the first auth link in it. */
export async function linkFromEmail(to: string, subject: RegExp, seen = 0): Promise<string> {
  let link = "";
  await expect(async () => {
    let mails: Found[];
    try {
      mails = await mailpit(to);
    } catch {
      mails = await inbucket(to);
    }
    const hits = mails.filter((m) => subject.test(m.subject));
    expect(hits.length, `emails to ${to} matching ${subject}`).toBeGreaterThan(seen);
    const body = hits[0].html || hits[0].text;
    const m = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/);
    expect(m, "an auth link in the email").not.toBeNull();
    link = m![0].replace(/&amp;/g, "&");
  }).toPass({ timeout: 30_000, intervals: [500, 1000, 2000] });
  return link;
}

export const uniqueEmail = (name: string) => `${name}.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}@example.com`;
export const PASSWORD = "felucca at sunset 7";

/** Create and confirm an account through the real sign-up form and confirmation email. */
export async function signUp(page: Page, email: string, password = PASSWORD) {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Choose a password").fill(password);
  await page.getByLabel("Type the password again").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Check your inbox: we've sent a link to confirm your email/)).toBeVisible();
  await page.goto(await linkFromEmail(email, /confirm/i));
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId("signed-in-as")).toContainText(email);
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/account");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByTestId("signed-in-as")).toContainText(email, { timeout: 15_000 });
}

export async function signOut(page: Page) {
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("You’ve signed out on this device.")).toBeVisible();
}

export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "admin@discover-egypt.test", password: process.env.E2E_ADMIN_PASSWORD ?? "admin password for tests 1" };
