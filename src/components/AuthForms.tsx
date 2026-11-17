"use client";
/** Visitor sign-in with Supabase Auth: password sign-in, new account, email link and password reset. */
import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Mail, UserPlus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { authErrorMessage, emailProblem, PASSWORD_MIN, passwordProblem, SENT } from "@/lib/auth-rules";

type Mode = "sign-in" | "sign-up" | "link" | "reset";
const TABS: { id: Mode; label: string; icon: typeof KeyRound }[] = [
  { id: "sign-in", label: "Sign in", icon: KeyRound },
  { id: "sign-up", label: "Create account", icon: UserPlus },
  { id: "link", label: "Email me a link", icon: Mail },
];

const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

export function AuthForms({ onSignedIn }: { onSignedIn: () => void }) {
  const sb = supabaseBrowser();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const live = useRef<HTMLDivElement>(null);

  function go(m: Mode) {
    setMode(m);
    setMsg(null);
    setFields({});
  }

  function fail(text: string, f: Record<string, string> = {}) {
    setFields(f);
    setMsg({ text, tone: "error" });
    requestAnimationFrame(() => live.current?.focus());
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const errs: Record<string, string> = {};
    const ep = emailProblem(email);
    if (ep) errs.email = ep;
    if (mode === "sign-in" && !password) errs.password = "Enter your password.";
    if (mode === "sign-up") {
      const pp = passwordProblem(password, email);
      if (pp) errs.password = pp;
      if (password !== String(fd.get("confirm") ?? "")) errs.confirm = "The two passwords don't match.";
    }
    if (Object.keys(errs).length) return fail("Please fix the highlighted fields.", errs);

    setBusy(true);
    setMsg(null);
    setFields({});
    try {
      if (mode === "sign-in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return fail(authErrorMessage(error));
        onSignedIn();
        return;
      }
      if (mode === "sign-up") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: callback("/account") } });
        if (error && error.code !== "user_already_exists") return fail(authErrorMessage(error));
        if (data.session) return onSignedIn(); // projects with email confirmation switched off sign in straight away
        setMsg({ text: SENT.signUp, tone: "ok" });
        return;
      }
      if (mode === "link") {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: callback("/account") } });
        if (error?.status === 429) return fail(authErrorMessage(error));
        setMsg({ text: SENT.link, tone: "ok" });
        return;
      }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: callback("/account/new-password") });
      if (error?.status === 429) return fail(authErrorMessage(error));
      setMsg({ text: SENT.reset, tone: "ok" });
    } catch {
      fail("We couldn't reach the sign-in service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) =>
    fields[k] ? (
      <p id={`auth-${k}-err`} className="field-error" role="alert">
        {fields[k]}
      </p>
    ) : null;
  const described = (k: string, help?: string) => [help, fields[k] ? `auth-${k}-err` : ""].filter(Boolean).join(" ") || undefined;

  const title = { "sign-in": "Sign in", "sign-up": "Create your account", link: "Sign in with an email link", reset: "Reset your password" }[mode];
  const cta = { "sign-in": "Sign in", "sign-up": "Create account", link: "Send sign-in link", reset: "Send reset link" }[mode];

  return (
    <div className="card mt-10 overflow-hidden" data-testid="auth-forms">
      <div role="tablist" aria-label="How to sign in" className="flex flex-wrap border-b border-line">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} aria-controls="auth-panel" id={`tab-${id}`} onClick={() => go(id)} className={`flex min-h-12 flex-1 items-center justify-center gap-2 px-4 text-sm font-semibold ${mode === id ? "border-b-2 border-gold text-midnight" : "text-muted hover:text-midnight"}`}>
            <Icon aria-hidden="true" size={16} /> {label}
          </button>
        ))}
      </div>
      <form id="auth-panel" role="tabpanel" aria-labelledby={mode === "reset" ? undefined : `tab-${mode}`} aria-label={mode === "reset" ? title : undefined} onSubmit={submit} noValidate className="space-y-5 p-7">
        <h2 className="text-2xl">{title}</h2>
        {mode === "sign-up" && <p className="text-sm text-muted">We only use your email to sign you in and to send links you ask for. No newsletter unless you sign up for it.</p>}
        {mode === "link" && <p className="text-sm text-muted">No password needed: we email you a link that signs you in.</p>}
        {mode === "reset" && <p className="text-sm text-muted">We&rsquo;ll email you a link to choose a new password.</p>}
        <div className="field">
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" required autoComplete={mode === "sign-up" ? "email" : "username"} className="input" aria-invalid={!!fields.email} aria-describedby={described("email")} />
          {err("email")}
        </div>
        {(mode === "sign-in" || mode === "sign-up") && (
          <div className="field">
            <label htmlFor="auth-password">{mode === "sign-up" ? "Choose a password" : "Password"}</label>
            <div className="relative">
              <input id="auth-password" name="password" type={show ? "text" : "password"} required minLength={mode === "sign-up" ? PASSWORD_MIN : undefined} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="input pr-12" aria-invalid={!!fields.password} aria-describedby={described("password", mode === "sign-up" ? "auth-password-help" : undefined)} />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-midnight" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
                {show ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
            {mode === "sign-up" && (
              <p id="auth-password-help" className="mt-1 text-xs text-muted">
                At least {PASSWORD_MIN} characters. A short phrase is easy to remember and hard to guess.
              </p>
            )}
            {err("password")}
          </div>
        )}
        {mode === "sign-up" && (
          <div className="field">
            <label htmlFor="auth-confirm">Type the password again</label>
            <input id="auth-confirm" name="confirm" type={show ? "text" : "password"} required autoComplete="new-password" className="input" aria-invalid={!!fields.confirm} aria-describedby={described("confirm")} />
            {err("confirm")}
          </div>
        )}
        <div ref={live} tabIndex={-1} aria-live="polite" className="outline-none">
          {msg && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
            {busy ? "Please wait…" : cta}
          </button>
          {mode === "sign-in" && (
            <button type="button" className="text-sm font-semibold text-nile underline underline-offset-4" onClick={() => go("reset")}>
              Forgot your password?
            </button>
          )}
          {mode === "reset" && (
            <button type="button" className="text-sm font-semibold text-nile underline underline-offset-4" onClick={() => go("sign-in")}>
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
