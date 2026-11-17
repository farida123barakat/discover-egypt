"use client";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { authErrorMessage, PASSWORD_MIN, passwordProblem } from "@/lib/auth-rules";

export function NewPasswordForm({ email }: { email: string }) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const errs: Record<string, string> = {};
    const p = passwordProblem(password, email);
    if (p) errs.password = p;
    if (password !== String(fd.get("confirm") ?? "")) errs.confirm = "The two passwords don't match.";
    setFields(errs);
    if (Object.keys(errs).length) return setMsg({ text: "Please fix the highlighted fields.", tone: "error" });
    setBusy(true);
    const { error } = (await supabaseBrowser()?.auth.updateUser({ password })) ?? { error: { message: "unavailable" } };
    setBusy(false);
    if (error) return setMsg({ text: authErrorMessage(error), tone: "error" });
    window.location.assign("/account?password=changed");
  }

  const err = (k: string) =>
    fields[k] ? (
      <p id={`np-${k}-err`} className="field-error" role="alert">
        {fields[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="card mt-10 space-y-5 p-7" aria-label="Choose a new password">
      <div className="field">
        <label htmlFor="np-password">New password</label>
        <input id="np-password" name="password" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" className="input" aria-invalid={!!fields.password} aria-describedby={`np-help${fields.password ? " np-password-err" : ""}`} />
        <p id="np-help" className="mt-1 text-xs text-muted">At least {PASSWORD_MIN} characters.</p>
        {err("password")}
      </div>
      <div className="field">
        <label htmlFor="np-confirm">Type it again</label>
        <input id="np-confirm" name="confirm" type="password" required autoComplete="new-password" className="input" aria-invalid={!!fields.confirm} aria-describedby={fields.confirm ? "np-confirm-err" : undefined} />
        {err("confirm")}
      </div>
      <div aria-live="polite">{msg && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}</div>
      <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
