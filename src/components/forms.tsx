"use client";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { destinations } from "@/content/destinations";
import { isEmail, mailtoHref } from "@/lib/mailto";

type State = { status: "idle" | "sending" | "done" | "error"; message: string | null; fields: Record<string, string>; mailto?: string };

/** With no database, a form prepares an email in the visitor's mail app instead of posting to the server. */
type EmailInstead = { to: string; subject: (fd: FormData) => string; fields: (fd: FormData) => [string, unknown][] };

/**
 * How a form sends. `offline` means there is no database; `to` is the site's contact address
 * (set on the server, see contactEmail() in lib/env). Offline without an address, the form is replaced by a note.
 */
type Sending = { offline?: boolean; to?: string | null };
const emailTo = ({ offline, to }: Sending) => (offline && isEmail(to) ? to.trim() : null);

/** Shared submit logic: JSON POST, server-side validation errors mapped to fields, focus on first error. */
export function useJsonForm(endpoint: string, emailInstead?: EmailInstead | null) {
  const [state, setState] = useState<State>({ status: "idle", message: null, fields: {} });
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>, build: (fd: FormData) => Record<string, unknown>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (emailInstead) {
      // Same checks the server would make, done in the browser.
      const invalid = Array.from(form.elements).filter(
        (el): el is HTMLInputElement => "validity" in el && !!(el as HTMLInputElement).name && !(el as HTMLInputElement).validity.valid,
      );
      if (invalid.length) {
        const fields = Object.fromEntries(invalid.map((el) => [el.name, el.type === "checkbox" ? "Please tick this box to continue." : el.validationMessage || "Please check this field."]));
        setState({ status: "error", message: "Please check the highlighted fields.", fields });
        invalid[0].focus();
        return;
      }
      const fd = new FormData(form);
      if (String(fd.get("website") ?? "")) return; // honeypot
      setState({
        status: "done",
        message: "Your message is ready. Open it in your email app and press send — nothing is sent until you do.",
        fields: {},
        mailto: mailtoHref(emailInstead.to, emailInstead.subject(fd), emailInstead.fields(fd)),
      });
      return;
    }
    setState({ status: "sending", message: null, fields: {} });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(build(new FormData(form))),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string; fields?: Record<string, string> };
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong.", fields: data.fields ?? {} });
        const first = data.fields && Object.keys(data.fields)[0];
        if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
        return;
      }
      form.reset();
      setState({ status: "done", message: data.message ?? "Sent.", fields: {} });
    } catch {
      setState({ status: "error", message: "We couldn't reach the server. Check your connection and try again.", fields: {} });
    }
  }
  return { state, onSubmit, formRef };
}

export function Field({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const described = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 mb-2 text-sm text-muted">
          {hint}
        </p>
      )}
      {children({ id, name, "aria-invalid": Boolean(error), "aria-describedby": described })}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function Consent({ error, label }: { error?: string; label?: ReactNode }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1 h-5 w-5 accent-[var(--color-nile)]" aria-invalid={Boolean(error)} required />
        <span>
          {label ?? (
            <>
              I agree to the{" "}
              <Link href="/privacy" className="text-nile underline">
                privacy policy
              </Link>
              . My email is never published.
            </>
          )}
        </span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Feedback({ state }: { state: State }) {
  return (
    <div aria-live="polite" role="status">
      {state.message && (
        <p className={`rounded-xl px-4 py-3 text-sm font-medium ${state.status === "done" ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"}`}>{state.message}</p>
      )}
      {state.mailto && (
        <a href={state.mailto} className="btn btn-primary mt-3" data-testid="open-email">
          Open in my email app
        </a>
      )}
    </div>
  );
}

/** Shown instead of a form when there is no database and no contact address has been set. */
export function FormOff({ what, tone = "light" }: { what: string; tone?: "light" | "dark" }) {
  return (
    <div className={`rounded-2xl p-6 ${tone === "dark" ? "bg-ivory/[0.06] text-ivory/85 ring-1 ring-ivory/15" : "grain bg-limestone"}`} data-testid="form-off">
      <p className={`font-display text-xl ${tone === "dark" ? "!text-ivory" : "text-midnight"}`}>{what} isn’t open on this version of the site.</p>
      <p className="mt-2 text-sm">This site runs entirely in your browser, with no database. Everything you save — trips, your bucket list, your Memory Hunt album — stays on this device.</p>
    </div>
  );
}

function Submit({ state, children }: { state: State; children: ReactNode }) {
  if (state.mailto) return null; // the "Open in my email app" button takes over
  return (
    <button type="submit" className="btn btn-primary" disabled={state.status === "sending"} aria-busy={state.status === "sending"}>
      {state.status === "sending" ? "Sending…" : children}
    </button>
  );
}

const destName = (slug: FormDataEntryValue | null) => (slug === "general" ? "General" : destinations.find((d) => d.slug === slug)?.name ?? "");

const DestSelect = (p: { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string; withGeneral?: boolean }) => (
  <select {...p} className="input" defaultValue={p.withGeneral ? "general" : "cairo"}>
    {p.withGeneral && <option value="general">General question</option>}
    {destinations.map((d) => (
      <option key={d.slug} value={d.slug}>
        {d.name}
      </option>
    ))}
  </select>
);

export function AskLocalForm(props: Sending) {
  const offline = !!props.offline;
  const to = emailTo(props);
  const { state, onSubmit } = useJsonForm(
    "/api/questions",
    to ? { to, subject: (fd) => `Ask a local: ${destName(fd.get("destination"))}`, fields: (fd) => [["First name", fd.get("name")], ["About", destName(fd.get("destination"))], ["Question", fd.get("question")]] } : null,
  );
  if (offline && !to) return <FormOff what="Asking a question" />;
  const f = state.fields;
  return (
    <form
      noValidate
      onSubmit={(e) =>
        onSubmit(e, (fd) => ({
          name: fd.get("name"),
          email: fd.get("email"),
          destination: fd.get("destination"),
          question: fd.get("question"),
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }))
      }
      className="relative space-y-5"
      aria-label="Ask a local"
    >
      <Honeypot />
      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Your first name" error={f.name}>
          {(p) => <input {...p} className="input" autoComplete="given-name" required minLength={2} maxLength={60} />}
        </Field>
        {!offline && (
          <Field name="email" label="Email" hint="Only used to tell you when we answer." error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
        )}
      </div>
      <Field name="destination" label="About" error={f.destination}>
        {(p) => <DestSelect {...p} withGeneral />}
      </Field>
      <Field name="question" label="Your question" hint="10–1000 characters." error={f.question}>
        {(p) => <textarea {...p} rows={4} className="input" required minLength={10} maxLength={1000} />}
      </Field>
      {!offline && <Consent error={f.consent} />}
      <Submit state={state}>Send question</Submit>
      <Feedback state={state} />
    </form>
  );
}

export function StoryForm(props: Sending) {
  const offline = !!props.offline;
  const to = emailTo(props);
  const { state, onSubmit } = useJsonForm(
    "/api/stories",
    to
      ? {
          to,
          subject: (fd) => `My Egypt story: ${String(fd.get("title") ?? "").trim()}`,
          fields: (fd) => [["Name", fd.get("name")], ["From", fd.get("country")], ["Where in Egypt", destName(fd.get("destination"))], ["Title", fd.get("title")], ["Story", fd.get("story")]],
        }
      : null,
  );
  if (offline && !to) return <FormOff what="Sharing a story" />;
  const f = state.fields;
  return (
    <form
      noValidate
      className="relative space-y-5"
      aria-label="Share your story"
      onSubmit={(e) =>
        onSubmit(e, (fd) => ({
          name: fd.get("name"),
          email: fd.get("email"),
          country: fd.get("country"),
          title: fd.get("title"),
          story: fd.get("story"),
          destination: fd.get("destination"),
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }))
      }
    >
      <Honeypot />
      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Your name" hint="Only your first name is shown." error={f.name}>
          {(p) => <input {...p} className="input" autoComplete="name" required />}
        </Field>
        {!offline && (
          <Field name="email" label="Email" hint="Never published." error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
        )}
        <Field name="country" label="Where are you from?" error={f.country}>
          {(p) => <input {...p} className="input" autoComplete="country-name" required />}
        </Field>
        <Field name="destination" label="Where in Egypt?" error={f.destination}>
          {(p) => <DestSelect {...p} />}
        </Field>
      </div>
      <Field name="title" label="Story title" error={f.title}>
        {(p) => <input {...p} className="input" required maxLength={120} />}
      </Field>
      <Field name="story" label="Your story" hint="50–3000 characters. Please don't include other people's personal details." error={f.story}>
        {(p) => <textarea {...p} rows={6} className="input" required minLength={50} maxLength={3000} />}
      </Field>
      {!offline && <Consent error={f.consent} />}
      <Submit state={state}>Submit story for review</Submit>
      <Feedback state={state} />
    </form>
  );
}

export function ContactForm(props: Sending) {
  const offline = !!props.offline;
  const to = emailTo(props);
  const { state, onSubmit } = useJsonForm(
    "/api/contact",
    to ? { to, subject: (fd) => `Discover Egypt: ${TOPICS[String(fd.get("topic"))] ?? "Message"}`, fields: (fd) => [["Name", fd.get("name")], ["Topic", TOPICS[String(fd.get("topic"))]], ["Message", fd.get("message")]] } : null,
  );
  if (offline && !to) return <FormOff what="The contact form" />;
  const f = state.fields;
  return (
    <form
      noValidate
      className="relative space-y-5"
      aria-label="Contact us"
      onSubmit={(e) =>
        onSubmit(e, (fd) => ({
          name: fd.get("name"),
          email: fd.get("email"),
          topic: fd.get("topic"),
          message: fd.get("message"),
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }))
      }
    >
      <Honeypot />
      <div className="grid gap-5 md:grid-cols-2">
        <Field name="name" label="Name" error={f.name}>
          {(p) => <input {...p} className="input" autoComplete="name" required />}
        </Field>
        {!offline && (
          <Field name="email" label="Email" error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
        )}
      </div>
      <Field name="topic" label="Topic" error={f.topic}>
        {(p) => (
          <select {...p} className="input" defaultValue="planning">
            {Object.entries(TOPICS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field name="message" label="Message" error={f.message}>
        {(p) => <textarea {...p} rows={5} className="input" required minLength={10} maxLength={2000} />}
      </Field>
      {!offline && <Consent error={f.consent} />}
      <Submit state={state}>Send message</Submit>
      <Feedback state={state} />
    </form>
  );
}

const TOPICS: Record<string, string> = {
  planning: "Trip planning",
  accessibility: "Accessibility",
  press: "Press & partnerships",
  feedback: "Website feedback",
  other: "Something else",
};

export function NewsletterForm() {
  const { state, onSubmit } = useJsonForm("/api/newsletter");
  return (
    <form
      noValidate
      className="relative space-y-3"
      aria-label="Newsletter"
      onSubmit={(e) => onSubmit(e, (fd) => ({ email: fd.get("email"), consent: fd.get("consent") === "on", website: fd.get("website") ?? "" }))}
    >
      <Honeypot />
      <Field name="email" label="Seasonal inspiration, once a month" error={state.fields.email}>
        {(p) => (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input {...p} type="email" placeholder="you@example.com" className="input !border-ivory/30 !bg-midnight-soft !text-ivory" autoComplete="email" required />
            <Submit state={state}>Subscribe</Submit>
          </div>
        )}
      </Field>
      <Consent error={state.fields.consent} label="Send me the monthly email. I can unsubscribe any time." />
      <Feedback state={state} />
    </form>
  );
}
