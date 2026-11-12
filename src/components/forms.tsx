"use client";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { destinations } from "@/content/destinations";

type State = { status: "idle" | "sending" | "done" | "error"; message: string | null; fields: Record<string, string> };

/** Shared submit logic: JSON POST, server-side validation errors mapped to fields, focus on first error. */
export function useJsonForm(endpoint: string) {
  const [state, setState] = useState<State>({ status: "idle", message: null, fields: {} });
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>, build: (fd: FormData) => Record<string, unknown>) {
    e.preventDefault();
    const form = e.currentTarget;
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
    </div>
  );
}

function Submit({ state, children }: { state: State; children: ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={state.status === "sending"} aria-busy={state.status === "sending"}>
      {state.status === "sending" ? "Sending…" : children}
    </button>
  );
}

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

export function AskLocalForm() {
  const { state, onSubmit } = useJsonForm("/api/questions");
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
        <Field name="email" label="Email" hint="Only used to tell you when we answer." error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
      </div>
      <Field name="destination" label="About" error={f.destination}>
        {(p) => <DestSelect {...p} withGeneral />}
      </Field>
      <Field name="question" label="Your question" hint="10–1000 characters." error={f.question}>
        {(p) => <textarea {...p} rows={4} className="input" required minLength={10} maxLength={1000} />}
      </Field>
      <Consent error={f.consent} />
      <Submit state={state}>Send question</Submit>
      <Feedback state={state} />
    </form>
  );
}

export function StoryForm() {
  const { state, onSubmit } = useJsonForm("/api/stories");
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
        <Field name="email" label="Email" hint="Never published." error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
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
      <Consent error={f.consent} />
      <Submit state={state}>Submit story for review</Submit>
      <Feedback state={state} />
    </form>
  );
}

export function ContactForm() {
  const { state, onSubmit } = useJsonForm("/api/contact");
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
        <Field name="email" label="Email" error={f.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" required />}
        </Field>
      </div>
      <Field name="topic" label="Topic" error={f.topic}>
        {(p) => (
          <select {...p} className="input" defaultValue="planning">
            <option value="planning">Trip planning</option>
            <option value="accessibility">Accessibility</option>
            <option value="press">Press & partnerships</option>
            <option value="feedback">Website feedback</option>
            <option value="other">Something else</option>
          </select>
        )}
      </Field>
      <Field name="message" label="Message" error={f.message}>
        {(p) => <textarea {...p} rows={5} className="input" required minLength={10} maxLength={2000} />}
      </Field>
      <Consent error={f.consent} />
      <Submit state={state}>Send message</Submit>
      <Feedback state={state} />
    </form>
  );
}

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
