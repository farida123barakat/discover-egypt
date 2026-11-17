"use client";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { replaceBucket, saveItinerary, useMyEgypt } from "@/lib/client-store";
import type { Itinerary } from "@/lib/validation";
import { AuthForms } from "./AuthForms";
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

  const refreshUser = useCallback(async () => {
    const { data } = (await sb?.auth.getUser()) ?? { data: { user: null } };
    setUser(data.user ?? null);
    if (data.user) load();
  }, [sb, load]);

  useEffect(() => {
    void refreshUser();
    // Keep this page in step with sign-in and sign-out in other tabs.
    const sub = sb?.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void refreshUser();
    });
    return () => sub?.data.subscription.unsubscribe();
  }, [sb, refreshUser]);

  if (user === undefined) return <p className="mt-10 text-muted" aria-live="polite">Loading your account…</p>;

  if (!user)
    return (
      <AuthForms
        onSignedIn={() => {
          // A full load so the server, the header and this page all see the new session.
          window.location.assign("/account?welcome=1");
        }}
      />
    );

  return (
    <div className="mt-10 space-y-8">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-7">
        <p data-testid="signed-in-as">
          Signed in as <strong>{user.email}</strong>
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await sb?.auth.signOut();
            setTrips([]);
            window.location.assign("/account?signed-out=1");
          }}
        >
          Sign out
        </button>
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
