/**
 * Rules and wording for visitor accounts (Supabase Auth). Pure, so the forms, the server and the
 * tests agree. Messages never reveal whether an email address has an account.
 */
export const PASSWORD_MIN = 10;
/** bcrypt, which Supabase Auth uses, only looks at the first 72 bytes. */
export const PASSWORD_MAX = 72;

export function passwordProblem(password: string, email = ""): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return "That password is too long. Use up to 72 characters.";
  if (/^(.)\1+$/.test(password)) return "Don't repeat one character. Try a short phrase you'll remember.";
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && password.toLowerCase().includes(local)) return "Don't use your email address in your password.";
  if (COMMON.has(password.toLowerCase())) return "That password is too common. Try a short phrase you'll remember.";
  return null;
}

const COMMON = new Set(["password123", "password1234", "1234567890", "qwertyuiop", "iloveegypt", "egypt12345", "letmein123", "welcome123", "0123456789", "abcdefghij"]);

export function emailProblem(email: string): string | null {
  const e = email.trim();
  if (!e) return "Enter your email address.";
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "Enter a valid email address, like name@example.com.";
  return null;
}

/** Same message whether or not the address has an account, so the forms can't be used to find out. */
export const SENT = {
  signUp: "Check your inbox: we've sent a link to confirm your email. It expires in an hour.",
  link: "If that address is valid, a sign-in link is on its way. Check your inbox.",
  reset: "If that address has an account, a link to choose a new password is on its way.",
} as const;

/** Turn a Supabase Auth error into words for the visitor. Unknown errors get a generic line. */
export function authErrorMessage(err: { message?: string; status?: number; code?: string } | null | undefined): string {
  if (!err) return "";
  const m = (err.message ?? "").toLowerCase();
  const code = err.code ?? "";
  if (err.status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || m.includes("rate limit"))
    return "Too many attempts. Please wait a minute and try again.";
  if (code === "invalid_credentials" || m.includes("invalid login credentials")) return "That email and password don't match. Check them, or reset your password.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) return "Please confirm your email first: open the link we sent you. You can ask for a new one below.";
  // before the weak-password check: "New password should be different…" also contains "password should"
  if (code === "same_password" || m.includes("should be different")) return "Choose a password you haven't used for this account before.";
  if (code === "weak_password" || m.includes("password should")) return `Choose a stronger password: at least ${PASSWORD_MIN} characters.`;
  if (code === "session_not_found" || code === "refresh_token_not_found" || m.includes("auth session missing")) return "Your link has expired. Ask for a new one.";
  if (code === "signup_disabled" || m.includes("signups not allowed")) return "New accounts are switched off at the moment.";
  return "Something went wrong. Please try again.";
}

/** Only local paths after sign-in, so a link can't send people to another site. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && /^\/(?!\/)[\w\-/]*$/.test(next) ? next : fallback;
}
