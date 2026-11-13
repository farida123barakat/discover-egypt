"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { replaceBucket, saveItinerary, useMyEgypt } from "@/lib/client-store";
import type { Itinerary } from "@/lib/validation";
import { formatDate } from "./ui";

type CloudTrip = { id: string; title: string; data: Itinerary; created_at: string };

async function call(method: "GET" | "POST" | "DELETE", body?: unknown) {
  const r = await fetch("/api/itineraries", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d as { itineraries?: CloudTrip[]; error?: string } };
}

export function AccountPanel() {
  const sb = supabaseBrowser();
  const me = useMyEgypt();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [trips, setTrips] = useState<CloudTrip[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await call("GET");
    if (r.ok) setTrips(r.data.itineraries ?? []);
  }, []);

  useEffect(() => {
    sb?.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user ?? null);
      if (data.user) load();
    });
  }, [sb, load]);

  async function sendLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sb) return;
    setBusy(true);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` } });
    setBusy(false);
    // Same message either way, so the form can't be used to find out who has an account.
    setMsg(error?.status === 429 ? "Too many requests. Please wait a minute." : "If that address is valid, a sign-in link is on its way. Check your inbox.");
  }

  if (user === undefined) return <p className="mt-10 text-muted" aria-live="polite">Loading your account…</p>;

  if (!user)
    return (
      <form onSubmit={sendLink} className="card mt-10 space-y-5 p-7">
        <h2 className="text-2xl">Sign in with an email link</h2>
        <p className="text-muted">No password needed. We only use your email to sign you in.</p>
        <div className="field">
          <label htmlFor="acc-email">Email address</label>
          <input id="acc-email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send sign-in link"}</button>
        <p aria-live="polite" className="text-sm font-medium">{msg}</p>
      </form>
    );

  return (
    <div className="mt-10 space-y-8">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-7">
        <p>Signed in as <strong>{user.email}</strong></p>
        <button type="button" className="btn btn-ghost" onClick={async () => { await sb?.auth.signOut(); setUser(null); setTrips([]); }}>Sign out</button>
      </div>

      <section className="card p-7" aria-labelledby="bucket-sync-h">
        <h2 id="bucket-sync-h" className="text-2xl">Bucket list progress</h2>
        <p className="mt-1 text-sm text-muted">
          {Object.values(me.bucket).filter((b) => b.done).length} completed and {Object.values(me.bucket).filter((b) => b.added).length} on your list on this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await fetch("/api/bucket", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(me.bucket) });
              setBusy(false);
              setMsg(r.ok ? "Bucket list saved to your account." : "Could not save your bucket list.");
            }}
          >
            Save to my account
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={async () => {
              const r = await fetch("/api/bucket");
              const d = (await r.json().catch(() => ({}))) as { progress?: typeof me.bucket };
              if (r.ok && d.progress) {
                replaceBucket(d.progress);
                setMsg("Loaded your bucket list from your account.");
              } else setMsg("Could not load your bucket list.");
            }}
          >
            Load from my account
          </button>
        </div>
      </section>

      <section className="card p-7" aria-labelledby="cloud-h">
        <h2 id="cloud-h" className="text-2xl">Trips saved to your account</h2>
        <p aria-live="polite" className="mt-2 min-h-6 text-sm font-semibold text-ok">{msg}</p>
        {me.itinerary && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await call("POST", me.itinerary);
              setBusy(false);
              setMsg(r.ok ? `Saved "${me.itinerary!.title}" to your account.` : r.data.error ?? "Could not save");
              if (r.ok) load();
            }}
          >
            Save &ldquo;{me.itinerary.title}&rdquo; from this device
          </button>
        )}
        {trips.length === 0 ? (
          <p className="mt-4 text-muted">No trips in your account yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand">
            {trips.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <strong>{t.title}</strong> · {t.data.days.length} days <span className="text-muted">· saved {formatDate(t.created_at.slice(0, 10))}</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" className="btn btn-ghost !min-h-9 !py-1" onClick={() => { saveItinerary(t.data); setMsg(`Loaded "${t.title}" into My Egypt on this device.`); }}>
                    Load<span className="sr-only"> {t.title}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !min-h-9 !py-1 text-alert"
                    onClick={async () => {
                      if (!confirm(`Delete "${t.title}" from your account?`)) return;
                      const r = await call("DELETE", { id: t.id });
                      setMsg(r.ok ? "Trip deleted." : r.data.error ?? "Could not delete");
                      if (r.ok) load();
                    }}
                  >
                    Delete<span className="sr-only"> {t.title}</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
